// backend/src/services/recommendationService.js
//
// Hybrid recommendation pipeline:
//   1. Compute rule-based fit (cosine similarity) for every active career.
//   2. Take top N candidates (default 10) — cheap, deterministic, defendable.
//   3. Send shortlist to Gemini for personalized ranking + explanations.
//   4. Merge LLM output with career metadata, persist on AssessmentResult.
//
// Why hybrid?
//   - Pure LLM hallucinates careers that don't exist or have wrong salary data.
//   - Pure rules give cold, generic results — no personalization in language.
//   - Hybrid grounds the LLM in real data while letting it personalize prose.
//   - Cheaper too: we send 10 careers in the prompt instead of asking the LLM
//     to "think of every career in the world".

import Career from '../models/Career.js';
import { computeCareerFit } from './scoringService.js';
import { generateJSON } from './geminiService.js';
import { buildRecommendationPrompt } from '../prompts/recommendation.js';

const SHORTLIST_SIZE = parseInt(process.env.RECOMMENDATION_SHORTLIST_SIZE || '10', 10);

export async function generateRecommendations({ user, scores }) {
  // 1. Rule-based shortlist
  const allCareers = await Career.find({ isActive: true }).lean();

  if (allCareers.length === 0) {
    throw new Error('No careers in database. Run seed script first.');
  }

  const ranked = allCareers
    .map((c) => ({ ...c, preliminaryFit: computeCareerFit(scores, c) }))
    .sort((a, b) => b.preliminaryFit - a.preliminaryFit)
    .slice(0, SHORTLIST_SIZE);

  // 2. LLM personalization
  const prompt = buildRecommendationPrompt({ user, scores, shortlist: ranked });
  let llmResult;
  try {
    llmResult = await generateJSON(prompt);
  } catch (err) {
    // Graceful degradation: if LLM fails, return rule-based ranking only
    console.error('[recommendation] LLM failed, falling back to rule-based:', err.message);
    return ranked.slice(0, 6).map((c) => ({
      careerId: c._id,
      title: c.title,
      matchScore: c.preliminaryFit,
      reasoning:
        'Personalized AI explanation temporarily unavailable. This career was matched based on your assessment scores.',
      strengthsMatch: [],
      gapsToAddress: [],
      _fallback: true,
    }));
  }

  // 3. Merge LLM rankings with our career data
  const titleToCareer = new Map(ranked.map((c) => [c.title.toLowerCase(), c]));
  const merged = (llmResult.rankings || [])
    .map((r) => {
      const career = titleToCareer.get(r.title.toLowerCase());
      if (!career) return null; // LLM hallucinated a title not in shortlist — drop
      return {
        careerId: career._id,
        title: career.title,
        matchScore: clamp(r.matchScore, 0, 100),
        reasoning: r.reasoning || '',
        strengthsMatch: Array.isArray(r.strengthsMatch) ? r.strengthsMatch : [],
        gapsToAddress: Array.isArray(r.gapsToAddress) ? r.gapsToAddress : [],
      };
    })
    .filter(Boolean);

  // Safety net: if LLM dropped careers, append remaining rule-based ones
  if (merged.length < 5) {
    const seen = new Set(merged.map((m) => String(m.careerId)));
    for (const c of ranked) {
      if (seen.has(String(c._id))) continue;
      merged.push({
        careerId: c._id,
        title: c.title,
        matchScore: c.preliminaryFit,
        reasoning: 'Matched based on your assessment scores.',
        strengthsMatch: [],
        gapsToAddress: [],
      });
      if (merged.length >= 6) break;
    }
  }

  return merged.slice(0, 8);
}

function clamp(n, min, max) {
  if (typeof n !== 'number' || Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}