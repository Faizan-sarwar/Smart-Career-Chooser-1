// backend/src/models/AssessmentResult.js
// Stores a single user's submission and the computed scores.

import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const assessmentResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assessmentVersion: { type: String, required: true },
    answers: [answerSchema],

    // Computed scores (0-100 each, normalized)
    riasecScores: {
      R: { type: Number, default: 0 }, // Realistic
      I: { type: Number, default: 0 }, // Investigative
      A: { type: Number, default: 0 }, // Artistic
      S: { type: Number, default: 0 }, // Social
      E: { type: Number, default: 0 }, // Enterprising
      C: { type: Number, default: 0 }, // Conventional
    },
    // Top 3 RIASEC letters joined, e.g. "IAR"
    hollandCode: { type: String },

    skillScores: {
      technical: { type: Number, default: 0 },
      analytical: { type: Number, default: 0 },
      creative: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      leadership: { type: Number, default: 0 },
      organization: { type: Number, default: 0 },
    },

    interestAreas: { type: [String], default: [] }, // e.g. ['tech', 'business']
    workStyle: { type: String }, // e.g. 'collaborative-remote'

    // Cache of latest LLM recommendations (avoid re-calling on every page load)
    cachedRecommendations: {
      generatedAt: Date,
      careers: [
        {
          careerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Career' },
          title: String,
          matchScore: Number, // 0-100
          reasoning: String, // LLM-generated personalized explanation
          strengthsMatch: [String],
          gapsToAddress: [String],
        },
      ],
    },
  },
  { timestamps: true }
);

const AssessmentResult = mongoose.model('AssessmentResult', assessmentResultSchema);
export default AssessmentResult;