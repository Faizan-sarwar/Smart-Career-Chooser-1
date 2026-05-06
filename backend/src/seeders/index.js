// backend/src/seeders/index.js
//
// Run with: npm run seed
// Idempotent — re-running wipes the seeded data and re-inserts.

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';
import Career from '../models/Career.js';
import { buildAssessmentDoc } from './assessmentSeed.js';
import { careersSeed } from './careersSeed.js';
import { seedMarket } from './marketSeed.js';
import { seedCommunity } from './communitySeed.js';

dotenv.config();

async function run() {
  const uri =
    process.env.MONGO_URI || 'mongodb://localhost:27017/career-chooser';
  console.log(`Connecting to ${uri} ...`);
  await mongoose.connect(uri);
  console.log('Connected.\n');

  // 1. Assessment (63-question RIASEC + skills + interests + workstyle)
  const assessmentDoc = buildAssessmentDoc();
  await Assessment.deleteMany({ version: assessmentDoc.version });
  await Assessment.create(assessmentDoc);
  console.log(
    `✓ Seeded assessment ${assessmentDoc.version} with ${assessmentDoc.questions.length} questions`
  );

  // 2. Careers (30 Pakistan-localized)
  await Career.deleteMany({ slug: { $in: careersSeed.map((c) => c.slug) } });
  await Career.insertMany(careersSeed);
  console.log(`✓ Seeded ${careersSeed.length} careers\n`);

  // 3. Market trends snapshot
  await seedMarket();

  // 4. Community: President account, events, posts
  await seedCommunity();

  await mongoose.disconnect();
  console.log('\n✅ All seed data loaded.\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});