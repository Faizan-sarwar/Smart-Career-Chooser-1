// backend/src/services/roadmapService.js
//
// Generates a roadmap via Groq (Llama 3.3) and post-processes the result
// to GUARANTEE every course has a working URL — even if the AI omits one.

import { generateJSON } from './geminiService.js';
import { buildRoadmapPrompt, PROMPT_VERSION } from '../prompts/roadmap.js';

const VALID_PHASES = ['0-3-months', '3-6-months', '6-12-months', '12+ months'];

// Search URL templates — every provider gets one. Spaces → +.
const SEARCH_URL_BUILDERS = {
  YouTube: (q) =>
    `https://www.youtube.com/results?search_query=${encodeQuery(q)}`,
  Coursera: (q) =>
    `https://www.coursera.org/search?query=${encodeQuery(q)}`,
  freeCodeCamp: (q) =>
    `https://www.freecodecamp.org/news/search/?query=${encodeQuery(q)}`,
  edX: (q) => `https://www.edx.org/search?q=${encodeQuery(q)}`,
  Udemy: (q) =>
    `https://www.udemy.com/courses/search/?q=${encodeQuery(q)}`,
  'MIT OpenCourseWare': (q) =>
    `https://ocw.mit.edu/search/?q=${encodeQuery(q)}`,
  'DigiSkills.pk': () => 'https://digiskills.pk/',
};

const DEFAULT_SEARCH = (q) =>
  `https://www.google.com/search?q=${encodeQuery(q + ' free course tutorial')}`;

function encodeQuery(s) {
  return encodeURIComponent(String(s).trim()).replace(/%20/g, '+');
}

// Quick check: does the URL look usable?
function looksLikeValidUrl(u) {
  if (!u || typeof u !== 'string') return false;
  return /^https?:\/\/.+\..+/.test(u.trim());
}

export async function generateRoadmap({
  studentName,
  careerTitle,
  hollandCode,
  skillStrength,
}) {
  const prompt = buildRoadmapPrompt({
    studentName,
    careerTitle,
    hollandCode,
    skillStrength,
  });

  const raw = await generateJSON(prompt);

  return normalizeRoadmap(raw, careerTitle);
}

// ── POST-PROCESSING ────────────────────────────────────────────────
//
// 1. Normalize phase names to allowed enum
// 2. Ensure every course has a working URL (build one if missing)
// 3. Default `isFree` to true (Pakistani-friendly bias)
// 4. Default hours if missing
//
function normalizeRoadmap(raw, careerTitle) {
  const summary = String(
    raw.summary || `Your personalized roadmap for ${careerTitle}.`
  ).trim();

  const milestones = (raw.milestones || []).map((m, idx) => {
    const phase = VALID_PHASES.includes(m.phase)
      ? m.phase
      : VALID_PHASES[Math.min(Math.floor(idx / 2), 3)];

    const courses = (m.courses || []).map((c) => {
      const title = String(c.title || 'Recommended Resource').trim();
      const provider = String(c.provider || 'YouTube').trim();
      const hours = Number.isFinite(c.hours) ? c.hours : 10;
      const isFree = c.isFree !== false; // default to free unless explicitly false

      // The big fix: ensure URL exists and is sensible
      let url = String(c.url || '').trim();
      if (!looksLikeValidUrl(url)) {
        url = buildFallbackUrl(provider, title);
      }

      return { title, provider, hours, isFree, url };
    });

    return {
      name: String(m.name || `Milestone ${idx + 1}`).trim(),
      description: String(m.description || '').trim(),
      phase,
      courses,
      done: false,
    };
  });

  return { summary, milestones, promptVersion: PROMPT_VERSION };
}

function buildFallbackUrl(provider, title) {
  const builder = SEARCH_URL_BUILDERS[provider];
  if (builder) return builder(title);
  // Provider name not recognized — fall back to a Google search
  return DEFAULT_SEARCH(`${provider} ${title}`);
}