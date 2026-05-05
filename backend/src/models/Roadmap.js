// backend/src/models/Roadmap.js
// Personalized roadmap generated for a user targeting a specific career.

import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    provider: { type: String }, // e.g. "Coursera", "DigiSkills.pk", "YouTube — freeCodeCamp"
    url: { type: String },
    hours: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    phase: {
      type: String,
      enum: ['0-3-months', '3-6-months', '6-12-months', '12+ months'],
      required: true,
    },
    courses: { type: [courseSchema], default: [] },
    done: { type: Boolean, default: false },
    doneAt: Date,
  },
  { _id: true } // _id needed so frontend can mark individual milestones complete
);

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    career: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Career',
      required: true,
    },
    careerTitle: { type: String, required: true }, // denormalized for display
    summary: String, // LLM-generated overview
    milestones: [milestoneSchema],
    generatedBy: { type: String, default: 'gemini-1.5-flash' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;