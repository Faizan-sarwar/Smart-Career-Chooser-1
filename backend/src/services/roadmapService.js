// backend/src/services/roadmapService.js

import { generateJSON } from './geminiService.js';
import { buildRoadmapPrompt } from '../prompts/roadmap.js';
import { identifySkillGaps } from './scoringService.js';

const VALID_PHASES = new Set(['0-3-months', '3-6-months', '6-12-months', '12+ months']);

export async function generateRoadmap({ user, scores, career }) {
  const skillGaps = identifySkillGaps(scores, career);
  const prompt = buildRoadmapPrompt({ user, scores, career, skillGaps });

  const result = await generateJSON(prompt);

  const milestones = (result.milestones || [])
    .filter((m) => m && m.name && VALID_PHASES.has(m.phase))
    .map((m) => ({
      name: String(m.name).slice(0, 200),
      description: String(m.description || '').slice(0, 500),
      phase: m.phase,
      done: false,
      courses: Array.isArray(m.courses)
        ? m.courses.slice(0, 3).map((c) => ({
            title: String(c.title || 'Untitled course').slice(0, 200),
            provider: String(c.provider || 'Self-paced').slice(0, 100),
            url: typeof c.url === 'string' && c.url.startsWith('http') ? c.url : '',
            hours: Number.isFinite(c.hours) ? Math.min(500, Math.max(0, c.hours)) : 0,
            isFree: !!c.isFree,
          }))
        : [],
    }));

  if (milestones.length < 4) {
    throw new Error('LLM returned too few milestones');
  }

  return {
    summary: String(result.summary || '').slice(0, 1000),
    milestones,
  };
}