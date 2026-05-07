// backend/src/models/Session.js
//
// Mentoring sessions scheduled between a mentor and a mentee.
// Tracks status, agenda, and outcome notes for follow-up.

import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    agenda: { type: String, default: '' },
    when: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30 },
    meetingLink: { type: String, default: '' }, // e.g. Google Meet URL
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    notes: { type: String, default: '' }, // mentor's private notes after the session
  },
  { timestamps: true }
);

sessionSchema.index({ mentor: 1, when: 1 });
sessionSchema.index({ mentee: 1, when: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;