// backend/src/seeders/communitySeed.js
//
// Seeds: President account, demo events, demo posts (with random author from existing users)
// Run via the main seed index.

import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Post from '../models/Post.js';

// ── EVENTS (Pakistan-localized) ─────────────────────────────────────
const EVENTS_SEED = [
  {
    title: 'AI Career Day Pakistan 2026',
    description:
      'Industry experts from Systems Ltd, Afiniti, and 10Pearls share what AI roles look like in Pakistan and how to break in.',
    host: 'DigiSkills.pk · Career Hub',
    when: addDays(7, 17, 0),
    tag: 'Webinar',
    coverColor: '#0d9488',
  },
  {
    title: 'Acing Tech Interviews at FAANG',
    description:
      'A live mock interview workshop covering DSA, system design, and behavioral questions for Pakistani candidates targeting global firms.',
    host: 'Ana Morales · Ex-Meta',
    when: addDays(10, 19, 0),
    tag: 'Workshop',
    coverColor: '#14b8a6',
  },
  {
    title: "Inside Pakistan's Big Tech: AMA",
    description:
      "Senior engineers from Systems Ltd, Venturedive, and Devsinc answer your questions about hiring, culture, and growth.",
    host: 'Engineers from Systems Ltd',
    when: addDays(14, 18, 30),
    tag: 'AMA',
    coverColor: '#f97316',
  },
  {
    title: 'Portfolio Review Live',
    description:
      'Submit your portfolio in advance and get live feedback from senior designers and engineers. First 20 submissions reviewed on-air.',
    host: 'Helio Studio',
    when: addDays(17, 16, 0),
    tag: 'Live',
    coverColor: '#fb923c',
  },
  {
    title: 'Networking Night: UoG Alumni in Tech',
    description:
      'Connect with University of Gujrat alumni working at top tech firms in Pakistan and abroad.',
    host: 'UoG Career Services',
    when: addDays(21, 19, 0),
    tag: 'Networking',
    coverColor: '#0d9488',
  },
];

// ── POSTS — Pakistan-relevant content ───────────────────────────────
const POST_SEED = [
  {
    title: 'How I landed my first internship at Systems Ltd',
    body: "Sharing the steps and what I'd do differently. The biggest unlock was a focused 3-week portfolio project, not certifications. Started with a real problem, not tutorials.",
    tag: 'Insight',
    daysAgo: 0.08, // 2h
  },
  {
    title: 'AI roles to watch in Pakistan in 2026',
    body: 'Applied research, ML platform engineer, and AI product manager are growing fast in Karachi and Lahore. Salaries for ML engineers with 2 years experience now reach 250k-400k PKR/month.',
    tag: 'Career',
    daysAgo: 1,
  },
  {
    title: 'Free MERN stack resources for FAST/COMSATS students',
    body: "After trying many courses, here's the path I recommend — most are free, and DigiSkills covers the rest. Start with HTML/CSS/JS fundamentals before jumping to React.",
    tag: 'Resource',
    daysAgo: 2,
  },
  {
    title: 'Did anyone clear the Afiniti coding round?',
    body: 'Got the OA next week. Anyone here cleared it recently — what topics did they focus on? My DSA is decent, weak on system design.',
    tag: 'Question',
    daysAgo: 3,
  },
  {
    title: 'PEC engineering vs CS: which has better job market right now?',
    body: 'Hearing mixed signals — software market saturated, embedded/electrical is hiring more in Lahore. What are people actually seeing?',
    tag: 'Discussion',
    daysAgo: 4,
  },
];

export async function seedCommunity() {
  console.log('🌱 Seeding community data…');

  // ── 1. Create President account if it doesn't exist ───────────────
  let president = await User.findOne({ role: 'President' });
  if (!president) {
    president = await User.create({
      name: 'Avery Hale',
      email: 'president@careerchooser.pk',
      password: 'president123', // gets hashed by pre-save hook
      role: 'President',
      avatar: '🎓',
    });
    console.log('  ✓ Created President account (president@careerchooser.pk)');
  }

  // ── 2. Wipe + reseed events ───────────────────────────────────────
  await Event.deleteMany({});
  await Event.insertMany(EVENTS_SEED);
  console.log(`  ✓ Seeded ${EVENTS_SEED.length} events`);

  // ── 3. Wipe + reseed posts ───────────────────────────────────────
  // Use existing users (or president) as authors
  const authors = await User.find({}).limit(10);
  if (authors.length === 0) {
    console.log('  ⚠ No users to author posts; skipping post seed.');
    return;
  }

  await Post.deleteMany({});
  const posts = POST_SEED.map((p, i) => ({
    author: authors[i % authors.length]._id,
    title: p.title,
    body: p.body,
    tag: p.tag,
    createdAt: new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000),
  }));
  await Post.insertMany(posts);
  console.log(`  ✓ Seeded ${posts.length} posts`);
}

// ── Helpers ─────────────────────────────────────────────────────────
function addDays(days, hour, min) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, min || 0, 0, 0);
  return d;
}