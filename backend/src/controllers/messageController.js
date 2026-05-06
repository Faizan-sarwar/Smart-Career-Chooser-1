// backend/src/controllers/messageController.js

import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get all allowed contacts (e.g., all real users except yourself)
// @route   GET /api/messages/contacts
export const getContacts = async (req, res, next) => {
  try {
    // Fetch all users except the currently logged-in user
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name role avatar')
      .lean();
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
        avatar: targetUser.avatar || '👋'
      },
      messages: messages.map(m => ({
        _id: String(m._id),
        text: m.body,
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
    if (!text) {
      res.status(400);
      throw new Error('Message text is required');
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: req.params.userId,
      body: text.trim()
    });

    res.status(201).json({
      _id: String(message._id),
      text: message.body,
      from: 'me',
      createdAt: formatTime(message.createdAt),
      createdAtISO: message.createdAt,
      read: false
    });
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