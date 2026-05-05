// backend/src/services/scoringService.js
//
// Pure functions: raw answers -> normalized 0..100 scores per dimension.
// No DB calls here so it is unit-testable and fast.
//
// METHOD (defendable in viva):
//   RIASEC: each question is tagged with one Holland dimension (R/I/A/S/E/C).
//           Likert responses (1..5) are summed per dimension, then min-max
//           normalized to 0..100 against the theoretical max for that dimension.
//   SKILLS: same approach across 6 skill buckets.
//   Holland Code: top 3 RIASEC letters concatenated, ordered by score.
//
// References:
//   - Holland, J. L. (1997). Making Vocational Choices (3rd ed.).
//   - O*NET Interest Profiler methodology (US Dept. of Labor).

const RIASEC_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'];
const SKILL_KEYS = [
  'technical',
  'analytical',
  'creative',
  'communication',
  'leadership',
  'organization',
];

/**
 * Score a set of answers against an assessment definition.
 * @param {Object} assessment - Assessment doc with .questions
 * @param {Array<{questionId:string, value:number}>} answers
 * @returns {Object} { riasecScores, hollandCode, skillScores, interestAreas, workStyle }
 */
export function scoreAnswers(assessment, answers) {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));

  // Tally per dimension
  const riasecRaw = Object.fromEntries(RIASEC_KEYS.map((k) => [k, { sum: 0, max: 0 }]));
  const skillRaw = Object.fromEntries(SKILL_KEYS.map((k) => [k, { sum: 0, max: 0 }]));
  const interestSet = new Set();
  let workStyle = null;

  for (const q of assessment.questions) {
    const ans = answerMap.get(q.questionId);
    if (ans == null) continue;

    if (q.section === 'riasec' && RIASEC_KEYS.includes(q.dimension)) {
      riasecRaw[q.dimension].sum += ans;
      riasecRaw[q.dimension].max += 5; // likert max
    } else if (q.section === 'skills' && SKILL_KEYS.includes(q.dimension)) {
      skillRaw[q.dimension].sum += ans;
      skillRaw[q.dimension].max += 5;
    } else if (q.section === 'interests' && ans >= 4) {
      // Only "agree"/"strongly agree" counts as a real interest
      interestSet.add(q.dimension);
    } else if (q.section === 'workstyle') {
      // For workstyle we expect a single 'choice' question — store the option label
      // The frontend should submit { value: optionIndex }; we store dimension + idx
      workStyle = `${q.dimension}-${ans}`;
    }
  }

  const riasecScores = normalizeBucket(riasecRaw);
  const skillScores = normalizeBucket(skillRaw);
  const hollandCode = computeHollandCode(riasecScores);

  return {
    riasecScores,
    hollandCode,
    skillScores,
    interestAreas: [...interestSet],
    workStyle,
  };
}

function normalizeBucket(raw) {
  const out = {};
  for (const [k, { sum, max }] of Object.entries(raw)) {
    out[k] = max > 0 ? Math.round((sum / max) * 100) : 0;
  }
  return out;
}

function computeHollandCode(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k)
    .join('');
}

/**
 * Career fit using weighted cosine similarity between user vector and career vector.
 * Combines RIASEC (60% weight) and skills (40% weight).
 * Returns 0..100.
 */
export function computeCareerFit(userScores, career) {
  const riasecVec = RIASEC_KEYS.map((k) => userScores.riasecScores[k] / 100);
  const careerRiasecVec = RIASEC_KEYS.map((k) => career.riasecFit[k] / 10);
  const riasecSim = cosineSimilarity(riasecVec, careerRiasecVec);

  const skillVec = SKILL_KEYS.map((k) => userScores.skillScores[k] / 100);
  const careerSkillVec = SKILL_KEYS.map((k) => career.skillWeights[k] / 10);
  const skillSim = cosineSimilarity(skillVec, careerSkillVec);

  const combined = riasecSim * 0.6 + skillSim * 0.4;
  return Math.round(combined * 100);
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Identify skill gaps for a target career.
 * Returns array of { skill, userLevel, requiredLevel, gap } sorted by largest gap.
 */
export function identifySkillGaps(userScores, career) {
  return SKILL_KEYS.map((skill) => {
    const userLevel = userScores.skillScores[skill]; // 0..100
    const requiredLevel = (career.skillWeights[skill] || 0) * 10; // 0..100
    return {
      skill,
      userLevel,
      requiredLevel,
      gap: Math.max(0, requiredLevel - userLevel),
    };
  })
    .filter((g) => g.requiredLevel >= 50) // only skills the career actually needs
    .sort((a, b) => b.gap - a.gap);
}