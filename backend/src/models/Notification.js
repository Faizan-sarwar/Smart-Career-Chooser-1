// backend/src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'milestone', 'event', 'message'],
      default: 'info',
    },
    color: { type: String, default: 'var(--color-primary)' },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;