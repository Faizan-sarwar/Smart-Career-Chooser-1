// backend/src/models/Message.js
//
// Enhanced for Instagram-grade chat:
//   - replyTo: reference to another message being quoted
//   - reactions: array of {user, emoji} subdocs
//   - deliveredAt / readAt: precise timestamps for status tracking
//   - clientId: lets the sender's optimistic message match server response
//   - compound index for fast pagination

import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true, maxlength: 8 },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, default: '', maxlength: 5000 },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video', null], default: null },

    // Reply-to: stores enough to render the quoted preview without an extra query
    replyTo: {
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
      preview: { type: String, default: '' }, // e.g. "Photo" or first 80 chars of body
      senderName: { type: String, default: '' },
    },

    // Reactions: array of { user, emoji, createdAt }
    reactions: { type: [reactionSchema], default: [] },

    // Status tracking
    deliveredAt: { type: Date, default: null }, // when recipient's socket received it
    readAt: { type: Date, default: null },      // when recipient opened the thread
    read: { type: Boolean, default: false },    // kept for backward compat

    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },

    // Client-supplied UUID for optimistic-UI deduplication
    clientId: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

// Compound index: fast "newest first between A and B" for pagination
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, read: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;