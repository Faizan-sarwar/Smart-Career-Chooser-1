// backend/src/controllers/messageController.js
//
// Enhanced for Instagram-grade chat:
//   getContacts          — now returns last message + per-contact unread count
//   getThread            — cursor-based pagination, returns {messages, hasMore, oldestCursor}
//   sendMessage          — accepts replyTo, clientId; emits delivered if recipient is online
//   markRead             — explicit endpoint, emits 'messagesRead' to sender's socket
//   reactToMessage       — toggle a reaction emoji
//   editMessage          — unchanged contract, emits 'messageEdited'
//   deleteMessage        — unchanged contract, emits 'messageDeleted'
//   getUnreadCount       — global unread count for badge

import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import MentorRequest from '../models/MentorRequest.js';
import { getReceiverSocketId, io } from '../socket/socket.js';

const PAGE_SIZE = 25;

// ════════════════════════════════════════════════════════════════
// CONTACTS — with last message preview + unread counts
// ════════════════════════════════════════════════════════════════

export const getContacts = async (req, res, next) => {
  try {
    const me = req.user._id;
    const role = req.user.role.toLowerCase();
    let candidateUsers = [];

    if (role === 'mentor') {
      const accepted = await MentorRequest.find({ mentor: me, status: 'accepted' })
        .populate('student', 'name role avatar updatedAt')
        .lean();
      candidateUsers = accepted.map((r) => r.student).filter(Boolean);
    } else if (role === 'student') {
      const accepted = await MentorRequest.find({ student: me, status: 'accepted' })
        .populate('mentor', 'name role avatar updatedAt')
        .lean();
      candidateUsers = accepted.map((r) => r.mentor).filter(Boolean);
    } else {
      candidateUsers = await User.find({ _id: { $ne: me } })
        .select('name role avatar updatedAt')
        .lean();
    }

    // For each contact, fetch the last message + unread count
    const enriched = await Promise.all(
      candidateUsers.map(async (c) => {
        const [lastMsg, unread] = await Promise.all([
          Message.findOne({
            $or: [
              { sender: me, recipient: c._id },
              { sender: c._id, recipient: me },
            ],
          })
            .sort({ createdAt: -1 })
            .lean(),
          Message.countDocuments({
            sender: c._id,
            recipient: me,
            read: false,
          }),
        ]);

        return {
          _id: c._id,
          name: c.name,
          role: c.role,
          avatar: c.avatar,
          updatedAt: c.updatedAt,
          lastMessage: lastMsg
            ? {
              _id: String(lastMsg._id),
              preview: previewOf(lastMsg),
              fromMe: lastMsg.sender.toString() === me.toString(),
              createdAt: lastMsg.createdAt,
            }
            : null,
          unreadCount: unread,
        };
      })
    );

    // Sort: contacts with messages first (newest first), then contacts without
    enriched.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// THREAD — cursor-based pagination
// ════════════════════════════════════════════════════════════════

export const getThread = async (req, res, next) => {
  try {
    const me = req.user._id;
    const otherId = req.params.userId;
    const before = req.query.before; // ISO date string for cursor

    if (!mongoose.Types.ObjectId.isValid(otherId)) {
      res.status(400);
      throw new Error('Invalid user id');
    }

    const target = await User.findById(otherId).lean();
    if (!target) {
      res.status(404);
      throw new Error('User not found');
    }

    // Cursor: fetch messages older than `before`
    const filter = {
      $or: [
        { sender: me, recipient: otherId },
        { sender: otherId, recipient: me },
      ],
    };
    if (before) filter.createdAt = { $lt: new Date(before) };

    // Fetch PAGE_SIZE+1 to know if there are more
    const docs = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE + 1)
      .lean();

    const hasMore = docs.length > PAGE_SIZE;
    const slice = hasMore ? docs.slice(0, PAGE_SIZE) : docs;
    // Reverse to oldest-first for UI
    const messages = slice.reverse().map((m) => formatMessage(m, me));
    const oldestCursor = slice.length > 0 ? slice[slice.length - 1].createdAt : null;

    // Mark incoming as read (background) + emit messagesRead
    const incomingUnread = await Message.find({
      sender: otherId,
      recipient: me,
      read: false,
    })
      .select('_id')
      .lean();

    if (incomingUnread.length > 0) {
      const ids = incomingUnread.map((m) => m._id);
      const readAt = new Date();
      Message.updateMany(
        { _id: { $in: ids } },
        { $set: { read: true, readAt } }
      ).catch((e) => console.warn('[messages] mark-read failed:', e.message));

      // Notify the original sender so their UI updates "Seen"
      const senderSocket = getReceiverSocketId(otherId);
      if (senderSocket) {
        io.to(senderSocket).emit('messagesRead', {
          by: String(me),
          messageIds: ids.map(String),
          readAt,
        });
      }
    }

    res.json({
      contact: {
        id: target._id,
        name: target.name,
        title: target.role,
        avatar: target.avatar || '👋',
        updatedAt: target.updatedAt,
      },
      messages,
      hasMore,
      oldestCursor,
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// SEND
// ════════════════════════════════════════════════════════════════

export const sendMessage = async (req, res, next) => {
  try {
    const { text, replyTo, clientId } = req.body;
    const file = req.file;

    if (!text?.trim() && !file) {
      res.status(400);
      throw new Error('Content is required');
    }

    let mediaUrl = null;
    let mediaType = null;
    if (file) {
      mediaUrl = file.path.replace(/\\/g, '/');
      mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    // Build replyTo if provided — fetch the original to snapshot preview
    let replyToData = null;
    if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
      const original = await Message.findById(replyTo)
        .populate('sender', 'name')
        .lean();
      if (original) {
        replyToData = {
          messageId: original._id,
          preview: previewOf(original).slice(0, 120),
          senderName: original.sender?.name || 'Unknown',
        };
      }
    }

    // Check if recipient is online — if so, mark as delivered immediately
    const receiverSocketId = getReceiverSocketId(req.params.userId);
    const deliveredAt = receiverSocketId ? new Date() : null;

    const message = await Message.create({
      sender: req.user._id,
      recipient: req.params.userId,
      body: text ? text.trim() : '',
      mediaUrl,
      mediaType,
      replyTo: replyToData,
      deliveredAt,
      clientId: clientId || null,
    });

    const populated = await Message.findById(message._id).lean();
    const forSender = formatMessage(populated, req.user._id);
    const forRecipient = formatMessage(populated, req.params.userId);

    // Real-time delivery
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', forRecipient);
    }

    res.status(201).json(forSender);
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// MARK READ — explicit endpoint (called when thread becomes visible)
// ════════════════════════════════════════════════════════════════

export const markThreadRead = async (req, res, next) => {
  try {
    const me = req.user._id;
    const otherId = req.params.userId;

    const unreadDocs = await Message.find({
      sender: otherId,
      recipient: me,
      read: false,
    })
      .select('_id')
      .lean();

    if (unreadDocs.length === 0) {
      return res.json({ modified: 0 });
    }

    const ids = unreadDocs.map((d) => d._id);
    const readAt = new Date();

    await Message.updateMany(
      { _id: { $in: ids } },
      { $set: { read: true, readAt } }
    );

    // Tell the sender their messages were seen
    const senderSocket = getReceiverSocketId(otherId);
    if (senderSocket) {
      io.to(senderSocket).emit('messagesRead', {
        by: String(me),
        messageIds: ids.map(String),
        readAt,
      });
    }

    res.json({ modified: ids.length });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// REACTIONS — toggle an emoji
// ════════════════════════════════════════════════════════════════

export const reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji || typeof emoji !== 'string' || emoji.length > 8) {
      res.status(400);
      throw new Error('Invalid emoji');
    }

    const message = await Message.findById(req.params.msgId);
    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    // Authorization — must be sender or recipient of this message
    const me = req.user._id.toString();
    if (
      message.sender.toString() !== me &&
      message.recipient.toString() !== me
    ) {
      res.status(403);
      throw new Error('Not authorized');
    }

    // Toggle: if same emoji from same user exists, remove it; else replace user's reaction
    const myIndex = message.reactions.findIndex(
      (r) => r.user.toString() === me
    );

    if (myIndex >= 0) {
      if (message.reactions[myIndex].emoji === emoji) {
        // same emoji → remove
        message.reactions.splice(myIndex, 1);
      } else {
        // different emoji → swap
        message.reactions[myIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    const summary = summarizeReactions(message.reactions);
    const otherId =
      message.sender.toString() === me
        ? message.recipient.toString()
        : message.sender.toString();

    // Notify the other party
    const otherSocket = getReceiverSocketId(otherId);
    if (otherSocket) {
      io.to(otherSocket).emit('messageReacted', {
        messageId: String(message._id),
        reactions: summary,
      });
    }

    res.json({
      messageId: String(message._id),
      reactions: summary,
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// EDIT / DELETE
// ════════════════════════════════════════════════════════════════

export const editMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.msgId);
    if (!message || message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    if (message.isDeleted) {
      res.status(400);
      throw new Error('Cannot edit a deleted message');
    }

    const newText = (req.body.text || '').trim();
    if (!newText) {
      res.status(400);
      throw new Error('Text required');
    }

    message.body = newText;
    message.isEdited = true;
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.recipient.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('messageEdited', {
        messageId: String(message._id),
        text: newText,
        isEdited: true,
      });
    }

    res.json({ success: true, text: newText, isEdited: true });
  } catch (err) {
    next(err);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.msgId);
    if (!message || message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }

    message.isDeleted = true;
    message.body = '';
    message.mediaUrl = null;
    message.mediaType = null;
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.recipient.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('messageDeleted', {
        messageId: String(message._id),
      });
    }

    res.json({ success: true, isDeleted: true });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// UNREAD COUNT (global, for badge)
// ════════════════════════════════════════════════════════════════

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function formatMessage(m, viewerId) {
  const viewerStr = String(viewerId);
  const isMe = m.sender.toString() === viewerStr;

  // Status: 'sending' (client only), 'sent' (server has it),
  //         'delivered' (recipient online had it), 'seen' (recipient opened thread)
  let status = 'sent';
  if (m.readAt) status = 'seen';
  else if (m.deliveredAt) status = 'delivered';

  return {
    _id: String(m._id),
    text: m.body || '',
    mediaUrl: m.mediaUrl || null,
    mediaType: m.mediaType || null,
    replyTo: m.replyTo?.messageId
      ? {
        messageId: String(m.replyTo.messageId),
        preview: m.replyTo.preview,
        senderName: m.replyTo.senderName,
      }
      : null,
    reactions: summarizeReactions(m.reactions || []),
    isEdited: m.isEdited || false,
    isDeleted: m.isDeleted || false,
    from: isMe ? 'me' : 'them',
    senderId: String(m.sender),
    createdAt: formatTime(m.createdAt),
    createdAtISO: m.createdAt,
    status,
    read: m.read,
    clientId: m.clientId || null,
  };
}

function summarizeReactions(reactions) {
  // Group by emoji: [{ emoji: '❤️', count: 2, userIds: [...] }]
  const map = new Map();
  for (const r of reactions) {
    const k = r.emoji;
    if (!map.has(k)) map.set(k, { emoji: k, count: 0, userIds: [] });
    const e = map.get(k);
    e.count++;
    e.userIds.push(String(r.user));
  }
  return Array.from(map.values());
}

function previewOf(m) {
  if (m.isDeleted) return 'Message deleted';
  if (m.mediaType === 'image') return '📷 Photo';
  if (m.mediaType === 'video') return '🎥 Video';
  return m.body || '';
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}