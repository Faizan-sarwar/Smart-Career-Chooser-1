// backend/src/prompts/roadmap.js
//
// Generates a 12-month skill roadmap.
// CRITICAL change: every course must have a working URL. We use a
// "smart search URL" strategy — the AI generates URLs that point to real
// platform searches, which guarantees the link always lands on relevant
// content even when the AI doesn't know the exact course slug.

export const PROMPT_VERSION = 'road-v1.1';

export function buildRoadmapPrompt({ studentName, careerTitle, hollandCode, skillStrength = [] }) {
  const skillStr = skillStrength.length
    ? skillStrength.map((s) => `${s.skill}: ${s.value}/100`).join(', ')
    : 'no skill data available';

  return `You are a career coach helping a Pakistani student build a 12-month learning roadmap.

STUDENT CONTEXT:
- Name: ${studentName}
- Target career: ${careerTitle}
- Holland Code: ${hollandCode || 'N/A'}
- Current self-rated skills: ${skillStr}

Generate a personalized 12-month roadmap with 8 milestones spread across 4 phases.

═══════════════════════════════════════════════════════════════════
URL GENERATION RULES — READ CAREFULLY
═══════════════════════════════════════════════════════════════════
Every course MUST have a working "url" field. Use these patterns:

For YouTube content:
  url: "https://www.youtube.com/results?search_query=<topic+keywords>"
  Example: "https://www.youtube.com/results?search_query=solidworks+tutorial+beginners"

For Coursera:
  url: "https://www.coursera.org/search?query=<topic+keywords>"
  Example: "https://www.coursera.org/search?query=machine+learning+pakistan"

For freeCodeCamp:
  url: "https://www.freecodecamp.org/news/search/?query=<topic>"
  Example: "https://www.freecodecamp.org/news/search/?query=react"

For edX:
  url: "https://www.edx.org/search?q=<topic+keywords>"
  Example: "https://www.edx.org/search?q=cnc+machining"

For DigiSkills.pk (Pakistan free training):
  url: "https://digiskills.pk/"
  (Always exact homepage — they list courses on landing page)

For Udemy:
  url: "https://www.udemy.com/courses/search/?q=<topic+keywords>"

For MIT OpenCourseWare:
  url: "https://ocw.mit.edu/search/?q=<topic+keywords>"

DO NOT invent specific course URLs like /course/abc-123 — those will 404.
ALWAYS use the search URL pattern above. URL-encode spaces as +.

═══════════════════════════════════════════════════════════════════
JSON SHAPE (return ONLY this, no markdown, no preamble)
═══════════════════════════════════════════════════════════════════
{
  "summary": "1-2 sentence motivational summary of the roadmap journey",
  "milestones": [
    {
      "name": "Specific milestone name",
      "description": "1-2 sentences on what they'll learn and why",
      "phase": "0-3-months" | "3-6-months" | "6-12-months" | "12+ months",
      "courses": [
        {
          "title": "Specific resource title (e.g. 'SolidWorks Tutorial for Beginners')",
          "provider": "YouTube" | "Coursera" | "freeCodeCamp" | "edX" | "DigiSkills.pk" | "Udemy" | "MIT OpenCourseWare",
          "hours": <integer estimated hours>,
          "isFree": <boolean>,
          "url": "<search URL using rules above>"
        }
      ]
    }
  ]
}

REQUIREMENTS:
- Exactly 8 milestones total
- 2 milestones per phase (Foundations 0-3mo, Building 3-6mo, Specialization 6-12mo, Career launch 12+ mo)
- Each milestone has 2-3 courses
- Prefer FREE resources (Pakistan-friendly: YouTube, freeCodeCamp, DigiSkills, MIT OCW)
- Course titles should be specific and searchable (not "Learn Python" but "Python for Data Analysis: NumPy, Pandas, Matplotlib")
- Mention the student by name in the summary (use "${studentName}")

Return ONLY the JSON object. No markdown fences, no explanation.`;
}