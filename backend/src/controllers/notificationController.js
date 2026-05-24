// backend/src/controllers/notificationController.js
//
// FIXED — removed the welcome-seed logic that was firing on every empty
// fetch. A new user with no notifications just sees "You're all caught up"
// in the dropdown. No phantom welcomes.

import Notification from '../models/Notification.js';

// @desc    List notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 30;

    const notifs = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(
      notifs.map((n) => ({
        _id: String(n._id),
        id: String(n._id),
        type: n.type,
        text: n.text,
        body: n.text,
        link: n.link || null,
        unread: !n.read,
        read: n.read,
        createdAt: n.createdAt,
        timeAgo: timeAgo(n.createdAt),
      }))
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Count of unread notifications (badge)
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle a single notification's read status
// @route   PUT /api/notifications/:id/read
// @access  Private
export const toggleReadStatus = async (req, res, next) => {
  try {
    const notif = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!notif) {
      res.status(404);
      throw new Error('Notification not found');
    }
    if (typeof req.body.unread === 'boolean') {
      notif.read = !req.body.unread;
    } else {
      notif.read = !notif.read;
    }
    await notif.save();
    res.json({ id: notif._id, read: notif.read, unread: !notif.read });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!notif) {
      res.status(404);
      throw new Error('Notification not found');
    }
    res.json({ id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
};

function timeAgo(date) {
  if (!date) return 'just now';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-PK');
} 