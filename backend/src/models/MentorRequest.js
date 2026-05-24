// backend/src/models/MentorRequest.js
//
// A student's request to be mentored by a specific mentor.
// Mentor decides: accept → they become connected; reject → archived.
// Only one active (pending OR accepted) request per (student, mentor) pair.

import mongoose from 'mongoose';

const mentorRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    intro: {
      type: String,
      default: '',
      maxlength: 600,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
      maxlength: 300,
    },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index — fast lookup for "does this pair already exist?"
mentorRequestSchema.index({ student: 1, mentor: 1, status: 1 });
mentorRequestSchema.index({ mentor: 1, status: 1, createdAt: -1 });
mentorRequestSchema.index({ student: 1, status: 1, createdAt: -1 });

const MentorRequest = mongoose.model('MentorRequest', mentorRequestSchema);
export default MentorRequest;