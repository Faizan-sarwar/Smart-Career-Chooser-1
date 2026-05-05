// backend/src/seeders/index.js
//
// Run with: node src/seeders/index.js
// Idempotent: deletes existing seed data and re-inserts. Safe to re-run.

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';
import Career from '../models/Career.js';
import { buildAssessmentDoc } from './assessmentSeed.js';
import { careersSeed } from './careersSeed.js';

dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/career-chooser';
  console.log(`Connecting to ${uri} ...`);
  await mongoose.connect(uri);
  console.log('Connected.');

  // 1. Assessment
  const assessmentDoc = buildAssessmentDoc();
  await Assessment.deleteMany({ version: assessmentDoc.version });
  await Assessment.create(assessmentDoc);
  console.log(`✓ Seeded assessment ${assessmentDoc.version} with ${assessmentDoc.questions.length} questions`);

  // 2. Careers
  await Career.deleteMany({ slug: { $in: careersSeed.map((c) => c.slug) } });
  await Career.insertMany(careersSeed);
  console.log(`✓ Seeded ${careersSeed.length} careers`);

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});