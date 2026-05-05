// backend/src/models/Assessment.js
// Stores the question bank itself. Seeded once, then served read-only to clients.
// Versioned so you can update questions without invalidating old results.

import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: Number, required: true }, // 1..5 Likert score
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true }, // stable id like "ria_r_01"
    text: { type: String, required: true },
    section: {
      type: String,
      enum: ['riasec', 'skills', 'interests', 'workstyle'],
      required: true,
    },
    // For RIASEC: which trait this question measures (R/I/A/S/E/C)
    // For skills: which skill bucket (technical/analytical/creative/communication/leadership/organization)
    // For interests: subject area
    dimension: { type: String, required: true },
    // 'likert' = 1-5 agreement scale; 'choice' = pick one of options
    type: { type: String, enum: ['likert', 'choice'], default: 'likert' },
    options: { type: [optionSchema], default: [] }, // empty for likert (1-5 implied)
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    version: { type: String, required: true, unique: true }, // e.g. "v1.0"
    title: { type: String, required: true },
    description: String,
    questions: [questionSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Assessment = mongoose.model('Assessment', assessmentSchema);
export default Assessment;