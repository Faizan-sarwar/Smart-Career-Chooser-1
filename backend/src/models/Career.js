// backend/src/models/Career.js
// The career taxonomy. Seeded with Pakistan-localized data.
// Used by the rule-based shortlister BEFORE we ask the LLM to rank.

import mongoose from 'mongoose';

const careerSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    cluster: {
      type: String,
      enum: [
        'technology',
        'business',
        'engineering',
        'health',
        'creative',
        'education',
        'public-service',
        'science',
        'finance',
        'media',
      ],
      required: true,
    },

    // RIASEC fit profile — 0-10 each. Used for cosine similarity vs user.
    riasecFit: {
      R: { type: Number, default: 0, min: 0, max: 10 },
      I: { type: Number, default: 0, min: 0, max: 10 },
      A: { type: Number, default: 0, min: 0, max: 10 },
      S: { type: Number, default: 0, min: 0, max: 10 },
      E: { type: Number, default: 0, min: 0, max: 10 },
      C: { type: Number, default: 0, min: 0, max: 10 },
    },

    // Required skill weights — how much each matters (0-10)
    skillWeights: {
      technical: { type: Number, default: 0, min: 0, max: 10 },
      analytical: { type: Number, default: 0, min: 0, max: 10 },
      creative: { type: Number, default: 0, min: 0, max: 10 },
      communication: { type: Number, default: 0, min: 0, max: 10 },
      leadership: { type: Number, default: 0, min: 0, max: 10 },
      organization: { type: Number, default: 0, min: 0, max: 10 },
    },

    coreSkills: { type: [String], default: [] }, // e.g. ["JavaScript", "React"]
    educationPaths: { type: [String], default: [] }, // e.g. ["BSCS at UoG, FAST, NUST"]

    // Pakistan-specific salary in PKR / month
    salaryPKR: {
      entry: { type: Number, required: true },
      mid: { type: Number, required: true },
      senior: { type: Number, required: true },
    },

    demand: {
      type: String,
      enum: ['low', 'moderate', 'high', 'very-high'],
      default: 'moderate',
    },
    growthOutlook: { type: String }, // short text e.g. "+25% over next 5 years"
    workSettings: { type: [String], default: [] }, // ['remote', 'office', 'hybrid', 'field']
    relatedCareers: { type: [String], default: [] }, // slugs
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

careerSchema.index({ cluster: 1, demand: 1 });

const Career = mongoose.model('Career', careerSchema);
export default Career;