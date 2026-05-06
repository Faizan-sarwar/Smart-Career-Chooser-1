// backend/src/controllers/messageController.js
import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get conversation between current user and the President
// @route   GET /api/messages/president
// @access  Private (Student)
export const getPresidentThread = async (req, res, next) => {
  try {
    // Find the President account (singleton — first user with role President)
    const president = await User.findOne({ role: 'President' });
    if (!president) {
      // No president yet — return empty thread + a placeholder
      return res.json({
        contact: {
          id: 'president',
          name: 'Student Body President',
          title: 'Awaiting assignment',
          avatar: '🎓',
        },
        messages: [],
      });
    }

    const userId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: president._id },
        { sender: president._id, recipient: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      contact: {
        id: president._id,
        name: president.name,
        title: 'Student Body President',
        avatar: president.avatar || '🎓',
      },
      messages: messages.map((m) => ({
        _id: m._id,
        text: m.body,
        from: m.sender.toString() === userId.toString() ? 'me' : 'them',
        createdAt: formatTime(m.createdAt),
        createdAtISO: m.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send a message to the President
// @route   POST /api/messages/president
// @access  Private (Student)
export const sendToPresident = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      res.status(400);
      throw new Error('Message text is required');
    }

    const president = await User.findOne({ role: 'President' });
    if (!president) {
      res.status(503);
      throw new Error('No President is currently assigned to receive messages.');
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: president._id,
      body: text.trim(),
    });

    res.status(201).json({
      _id: message._id,
      text: message.body,
      from: 'me',
      createdAt: formatTime(message.createdAt),
      createdAtISO: message.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
} 