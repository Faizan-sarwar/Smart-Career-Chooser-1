// backend/src/models/Report.js
//
// Stores user-submitted reports of community content (posts, etc.)
// Admin moderation queue reads from this collection.

import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['Post', 'Comment', 'User'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'Spam / Promotion',
        'Harassment',
        'Hate Speech',
        'Misinformation',
        'Off-Topic',
        'Other',
      ],
      default: 'Other',
    },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'resolved-removed', 'resolved-ignored'],
      default: 'pending',
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;