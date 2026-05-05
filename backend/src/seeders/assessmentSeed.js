// backend/src/seeders/assessmentSeed.js
//
// Question bank: 36 RIASEC items (6 per dimension) + 18 skill items (3 per bucket)
// + 8 interest items + 1 workstyle question = 63 questions total.
//
// RIASEC items adapted from public-domain interest inventories (O*NET-style).
// All items use 1-5 Likert: 1=strongly disagree ... 5=strongly agree.

export const ASSESSMENT_VERSION = 'v1.0';

const riasecItems = [
  // Realistic (R) — hands-on, practical, tools, machines, outdoors
  { d: 'R', t: 'I enjoy fixing or building things with my hands.' },
  { d: 'R', t: 'I would rather work with tools and machines than with people.' },
  { d: 'R', t: 'I like outdoor activities like hiking, sports, or fieldwork.' },
  { d: 'R', t: 'I prefer concrete tasks with visible, physical results.' },
  { d: 'R', t: 'I enjoy figuring out how mechanical or electrical systems work.' },
  { d: 'R', t: 'I would feel comfortable working in a workshop, lab, or field site.' },

  // Investigative (I) — analytical, curious, scientific, research
  { d: 'I', t: 'I enjoy solving puzzles and complex problems.' },
  { d: 'I', t: 'I like understanding why things happen, not just what happens.' },
  { d: 'I', t: 'I am drawn to research, data analysis, or scientific thinking.' },
  { d: 'I', t: 'I enjoy reading about new theories, discoveries, or technologies.' },
  { d: 'I', t: 'I prefer working independently on intellectually challenging problems.' },
  { d: 'I', t: 'I like tasks that require deep thinking over fast action.' },

  // Artistic (A) — creative, expressive, original
  { d: 'A', t: 'I enjoy creating things — writing, drawing, designing, music.' },
  { d: 'A', t: 'I value originality and self-expression in my work.' },
  { d: 'A', t: 'I prefer flexible, unstructured tasks over rigid procedures.' },
  { d: 'A', t: 'I am drawn to aesthetics — visual design, style, beauty.' },
  { d: 'A', t: 'I often think of new ideas or different ways to do things.' },
  { d: 'A', t: 'I enjoy storytelling, performing, or producing creative content.' },

  // Social (S) — helping, teaching, healing
  { d: 'S', t: 'I find meaning in helping people solve their problems.' },
  { d: 'S', t: 'I enjoy teaching, mentoring, or explaining things to others.' },
  { d: 'S', t: 'People often come to me for advice or emotional support.' },
  { d: 'S', t: 'I would prefer a job where I improve other people\'s lives directly.' },
  { d: 'S', t: 'I am comfortable working closely with diverse groups of people.' },
  { d: 'S', t: 'I value cooperation and harmony over competition.' },

  // Enterprising (E) — leading, persuading, business
  { d: 'E', t: 'I enjoy persuading others to see my point of view.' },
  { d: 'E', t: 'I am comfortable taking charge of a group or project.' },
  { d: 'E', t: 'I am interested in starting my own business someday.' },
  { d: 'E', t: 'I enjoy taking calculated risks for big rewards.' },
  { d: 'E', t: 'I am energized by competition and ambitious goals.' },
  { d: 'E', t: 'I am comfortable selling, negotiating, or pitching ideas.' },

  // Conventional (C) — structured, detail-oriented, organized
  { d: 'C', t: 'I like keeping things organized, accurate, and on schedule.' },
  { d: 'C', t: 'I prefer clear rules and predictable routines at work.' },
  { d: 'C', t: 'I am good at following detailed instructions carefully.' },
  { d: 'C', t: 'I enjoy working with numbers, records, or spreadsheets.' },
  { d: 'C', t: 'I value accuracy and precision over speed.' },
  { d: 'C', t: 'I am comfortable in office or administrative environments.' },
];

const skillItems = [
  // technical
  { d: 'technical', t: 'I can pick up new software, programming languages, or technical tools quickly.' },
  { d: 'technical', t: 'I am confident debugging or troubleshooting technical issues.' },
  { d: 'technical', t: 'I have built or coded something I am genuinely proud of.' },

  // analytical
  { d: 'analytical', t: 'I can break a complex problem into smaller, solvable parts.' },
  { d: 'analytical', t: 'I am comfortable interpreting data, charts, or statistics.' },
  { d: 'analytical', t: 'I notice patterns and inconsistencies that others miss.' },

  // creative
  { d: 'creative', t: 'I can come up with original solutions when standard ones don\'t work.' },
  { d: 'creative', t: 'I am skilled at producing visual, written, or design work.' },
  { d: 'creative', t: 'I enjoy reimagining existing things in new ways.' },

  // communication
  { d: 'communication', t: 'I can explain complex ideas in simple, clear language.' },
  { d: 'communication', t: 'I am comfortable speaking in front of groups or in meetings.' },
  { d: 'communication', t: 'I write clearly and persuasively.' },

  // leadership
  { d: 'leadership', t: 'I have led a team or project and others followed my direction.' },
  { d: 'leadership', t: 'I can motivate people and resolve conflicts in a group.' },
  { d: 'leadership', t: 'I make decisions confidently when others are uncertain.' },

  // organization
  { d: 'organization', t: 'I plan ahead and meet deadlines consistently.' },
  { d: 'organization', t: 'My workspace, files, or notes are well-organized.' },
  { d: 'organization', t: 'I track multiple tasks without losing details.' },
];

const interestItems = [
  { d: 'tech', t: 'I am interested in technology and the digital industry.' },
  { d: 'business', t: 'I am interested in business, finance, or entrepreneurship.' },
  { d: 'creative', t: 'I am interested in arts, media, or creative fields.' },
  { d: 'health', t: 'I am interested in healthcare or biological sciences.' },
  { d: 'engineering', t: 'I am interested in engineering, manufacturing, or construction.' },
  { d: 'education', t: 'I am interested in teaching or working with students.' },
  { d: 'public-service', t: 'I am interested in public service, civil services, or NGOs.' },
  { d: 'science', t: 'I am interested in scientific research or academia.' },
];

const workstyleItem = {
  d: 'preferred',
  t: 'Which work style fits you best?',
  type: 'choice',
  options: [
    { label: 'Deep solo focus work', value: 1 },
    { label: 'Pair / small-team collaboration', value: 2 },
    { label: 'Cross-functional meetings and presentations', value: 3 },
    { label: 'Field or on-the-ground work', value: 4 },
    { label: 'Mix of remote and in-person', value: 5 },
  ],
};

export function buildAssessmentDoc() {
  const questions = [];
  let order = 0;

  riasecItems.forEach((q, i) => {
    questions.push({
      questionId: `ria_${q.d.toLowerCase()}_${String(i + 1).padStart(2, '0')}`,
      text: q.t,
      section: 'riasec',
      dimension: q.d,
      type: 'likert',
      options: [],
      order: order++,
    });
  });

  skillItems.forEach((q, i) => {
    questions.push({
      questionId: `skl_${q.d}_${String(i + 1).padStart(2, '0')}`,
      text: q.t,
      section: 'skills',
      dimension: q.d,
      type: 'likert',
      options: [],
      order: order++,
    });
  });

  interestItems.forEach((q, i) => {
    questions.push({
      questionId: `int_${q.d}_${String(i + 1).padStart(2, '0')}`,
      text: q.t,
      section: 'interests',
      dimension: q.d,
      type: 'likert',
      options: [],
      order: order++,
    });
  });

  questions.push({
    questionId: 'wst_pref_01',
    text: workstyleItem.t,
    section: 'workstyle',
    dimension: workstyleItem.d,
    type: 'choice',
    options: workstyleItem.options,
    order: order++,
  });

  return {
    version: ASSESSMENT_VERSION,
    title: 'Smart Career Chooser Assessment',
    description:
      'A 63-question assessment combining RIASEC personality (Holland Codes), skill self-assessment, and interest mapping to recommend careers tailored to Pakistan\'s job market.',
    questions,
    isActive: true,
  };
}