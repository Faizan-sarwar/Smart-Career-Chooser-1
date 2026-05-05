// backend/src/prompts/recommendation.js
//
// Versioned prompt for career recommendations.
// Keep prompts in code (not DB) so they're reviewable in git history — useful
// for the FYP report's "prompt engineering" section.

export const RECOMMENDATION_PROMPT_VERSION = 'rec-v1.0';

/**
 * Builds the prompt string sent to Gemini for ranking shortlisted careers.
 *
 * Inputs:
 *   - user: { name, educationLevel, fieldOfStudy, university }
 *   - scores: { hollandCode, riasecScores, skillScores, interestAreas }
 *   - shortlist: array of Career docs (top N from rule-based filter)
 */
export function buildRecommendationPrompt({ user, scores, shortlist }) {
  const careerCards = shortlist
    .map(
      (c, i) => `${i + 1}. ${c.title} (${c.cluster})
   Summary: ${c.summary}
   Core skills: ${c.coreSkills.join(', ')}
   Education paths: ${c.educationPaths.join('; ')}
   Salary (PKR/month): entry ${c.salaryPKR.entry.toLocaleString()}, mid ${c.salaryPKR.mid.toLocaleString()}, senior ${c.salaryPKR.senior.toLocaleString()}
   Demand in Pakistan: ${c.demand}
   Rule-based fit score: ${c.preliminaryFit}/100`
    )
    .join('\n\n');

  return `You are a senior career counselor advising university students in Pakistan.
You will personalize and rank a pre-filtered shortlist of careers for ONE specific student.

# STUDENT PROFILE
- Name: ${user.name}
- Education: ${user.educationLevel || 'not specified'}${user.fieldOfStudy ? ` in ${user.fieldOfStudy}` : ''}
- Institution: ${user.university || 'not specified'}

# ASSESSMENT RESULTS
- Holland Code (top RIASEC traits): ${scores.hollandCode}
- RIASEC scores (0-100): R=${scores.riasecScores.R}, I=${scores.riasecScores.I}, A=${scores.riasecScores.A}, S=${scores.riasecScores.S}, E=${scores.riasecScores.E}, C=${scores.riasecScores.C}
- Skill self-ratings (0-100): technical=${scores.skillScores.technical}, analytical=${scores.skillScores.analytical}, creative=${scores.skillScores.creative}, communication=${scores.skillScores.communication}, leadership=${scores.skillScores.leadership}, organization=${scores.skillScores.organization}
- Stated interests: ${scores.interestAreas.length ? scores.interestAreas.join(', ') : 'none specified'}

# SHORTLISTED CAREERS (already filtered by algorithm)
${careerCards}

# YOUR TASK
1. Re-rank ALL ${shortlist.length} careers using your judgment about Pakistan's job market in 2026 and how well each fits THIS student's combination of traits, skills, and education background.
2. For each career, write a personalized 2-3 sentence reasoning that references the student's specific scores (NOT generic statements). Mention concrete numbers from their profile.
3. Identify 2-4 strengths the student already has that match this career.
4. Identify 2-3 specific gaps they need to address.
5. Adjust the matchScore (0-100) based on your judgment, but stay within ±15 of the rule-based fit score unless you have strong reason to deviate.

# OUTPUT FORMAT (strict JSON, no markdown, no extra text)
{
  "rankings": [
    {
      "title": "exact title from shortlist",
      "matchScore": 87,
      "reasoning": "personalized explanation referencing specific traits/scores",
      "strengthsMatch": ["strength 1", "strength 2"],
      "gapsToAddress": ["gap 1", "gap 2"]
    }
  ]
}

Rules:
- Output MUST be valid JSON parseable by JSON.parse.
- Include EVERY career from the shortlist in your rankings (don't drop any).
- Order rankings from highest matchScore to lowest.
- Reasoning must be specific to this student — generic answers are unacceptable.
- Use Pakistani context (PKR, local universities like UoG/NUST/FAST, local employers).`;
}