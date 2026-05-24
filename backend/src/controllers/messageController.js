// backend/src/controllers/messageController.js

import Message from '../models/Message.js';
import User from '../models/User.js';
import MentorRequest from '../models/MentorRequest.js'; // 🚨 Added to verify relationships
import { getReceiverSocketId, io } from '../socket/socket.js';

// @desc    Get ONLY officially connected contacts
// @route   GET /api/messages/contacts
export const getContacts = async (req, res, next) => {
  try {
    let users = [];
    const role = req.user.role.toLowerCase();

    if (role === 'mentor') {
      // 🚨 PRIVACY LOCK: Mentors only see students who they have ACCEPTED
      const acceptedRequests = await MentorRequest.find({
        mentor: req.user._id,
        status: 'accepted'
      }).populate('student', 'name role avatar updatedAt').lean();

      users = acceptedRequests.map(r => r.student).filter(Boolean);
    }
    else if (role === 'student') {
      // 🚨 PRIVACY LOCK: Students only see their ACCEPTED mentor
      const acceptedRequest = await MentorRequest.findOne({
        student: req.user._id,
        status: 'accepted'
      }).populate('mentor', 'name role avatar updatedAt').lean();

      if (acceptedRequest && acceptedRequest.mentor) {
        users.push(acceptedRequest.mentor);
      }
    }
    else {
      // Admins see everyone
      users = await User.find({ _id: { $ne: req.user._id } }).select('name role avatar updatedAt').lean();
    }

    res.json(users);
  } catch (err) {
    next(err);
  }
};

// @desc    Get conversation with a specific user
// @route   GET /api/messages/:userId
export const getThread = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      res.status(404);
      throw new Error('User not found');
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: targetUser._id },
        { sender: targetUser._id, recipient: req.user._id },
      ],
    }).sort({ createdAt: 1 }).lean();

    // Background task: mark incoming messages as read
    Message.updateMany(
      { sender: targetUser._id, recipient: req.user._id, read: false },
      { $set: { read: true } }
    ).catch(err => console.log(err));

    res.json({
      contact: {
        id: targetUser._id,
        name: targetUser.name,
        title: targetUser.role,
        avatar: targetUser.avatar || '👋',
        updatedAt: targetUser.updatedAt // Needed for "Active Now" status
      },
      messages: messages.map(m => ({
        _id: String(m._id),
        text: m.body,
        mediaUrl: m.mediaUrl || null,
        mediaType: m.mediaType || null,
        isEdited: m.isEdited || false,
        isDeleted: m.isDeleted || false,
        from: m.sender.toString() === req.user._id.toString() ? 'me' : 'them',
        createdAt: formatTime(m.createdAt),
        createdAtISO: m.createdAt,
        read: m.read
      }))
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send a message to a specific user
// @route   POST /api/messages/:userId
export const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const file = req.file; // For Instagram-style media

    if (!text && !file) {
      res.status(400);
      throw new Error('Content is required');
    }

    let mediaUrl = null;
    let mediaType = null;

    if (file) {
      mediaUrl = file.path.replace(/\\/g, '/');
      mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: req.params.userId,
      body: text ? text.trim() : '',
      mediaUrl,
      mediaType
    });

    const formattedMessage = {
      _id: String(message._id),
      text: message.body,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      isEdited: message.isEdited || false,
      isDeleted: message.isDeleted || false,
      from: 'them', // Relative to the receiver
      createdAt: formatTime(message.createdAt),
      createdAtISO: message.createdAt,
      read: false
    };

    // 🚨 INSTANT WEBSOCKET DELIVERY 🚨
    const receiverSocketId = getReceiverSocketId(req.params.userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", formattedMessage);
    }

    res.status(201).json({ ...formattedMessage, from: 'me' });
  } catch (err) {
    next(err);
  }
};

// 🚨 MISSING EXPORT ADDED: Edit Message
// @route   PUT /api/messages/:msgId/edit
export const editMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.msgId);
    if (!message || message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }

    message.body = req.body.text;
    message.isEdited = true;
    await message.save();

    res.json({ success: true, text: message.body, isEdited: true });
  } catch (err) {
    next(err);
  }
};

// 🚨 MISSING EXPORT ADDED: Delete Message
// @route   DELETE /api/messages/:msgId/delete
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.msgId);
    if (!message || message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }

    message.isDeleted = true;
    message.body = "";
    message.mediaUrl = null;
    await message.save();

    res.json({ success: true, isDeleted: true });
  } catch (err) {
    next(err);
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
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

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}