// backend/src/seeders/marketSeed.js
//
// Market insights snapshot — designed for Pakistan job market with realistic
// PKR salary figures (LPA = Lakhs Per Annum, 1 lakh = 100,000 PKR).

import MarketTrend from '../models/MarketTrend.js';

const MARKET_DATA = {
  snapshotDate: new Date(),

  stats: {
    openRoles: '14.2K',
    avgSalary: 'PKR 2.4M',
    remoteShare: '38%',
    topGrowthField: 'AI Engineering',
  },

  ticker: [
    '🇵🇰 Pakistan IT exports hit $3.2B (FY25) — up 24% YoY',
    '💼 Karachi & Lahore tech salaries up 18% in 2026',
    '🚀 Generative AI roles see 142% YoY growth',
    '🏠 38% of new tech jobs in Pakistan are now remote',
    '📈 ML Engineering tops fastest-growing role list',
    '🎓 Pakistani CS grads in 6-figure USD remote roles up 3x',
    '⚡ Cybersecurity hiring surges as banks digitize',
  ],

  // Yearly average salaries in LPA (Lakhs PKR Per Annum)
  // Software engineer mid-level: 18-30 LPA in 2026 (PKR 1.5M-2.5M)
  salaryYears: [
    { year: '2021', Software: 12, Data: 14, Design: 9,  Cyber: 13, Cloud: 15 },
    { year: '2022', Software: 15, Data: 17, Design: 11, Cyber: 16, Cloud: 18 },
    { year: '2023', Software: 18, Data: 22, Design: 14, Cyber: 20, Cloud: 22 },
    { year: '2024', Software: 22, Data: 28, Design: 17, Cyber: 24, Cloud: 27 },
    { year: '2025', Software: 26, Data: 34, Design: 20, Cyber: 28, Cloud: 32 },
    { year: '2026', Software: 30, Data: 42, Design: 24, Cyber: 34, Cloud: 38 },
  ],

  // Demand on a 0-100 scale, ranked
  topSkills: [
    { skill: 'Python',      demand: 96 },
    { skill: 'React',       demand: 92 },
    { skill: 'AWS',         demand: 88 },
    { skill: 'SQL',         demand: 85 },
    { skill: 'Node.js',     demand: 82 },
    { skill: 'Docker',      demand: 78 },
    { skill: 'TypeScript',  demand: 75 },
    { skill: 'Figma',       demand: 70 },
  ],

  trendingCareers: [
    { title: 'AI/ML Engineer',      growth: '+142%', color: '#0d9488' },
    { title: 'Data Scientist',      growth: '+86%',  color: '#14b8a6' },
    { title: 'Cloud Engineer',      growth: '+74%',  color: '#0891b2' },
    { title: 'Cybersecurity Analyst', growth: '+68%', color: '#f97316' },
    { title: 'Product Manager',     growth: '+52%',  color: '#fb923c' },
    { title: 'Full-Stack Developer', growth: '+48%', color: '#0d9488' },
  ],
};

export async function seedMarket() {
  console.log('🌱 Seeding market trends…');
  await MarketTrend.deleteMany({});
  await MarketTrend.create(MARKET_DATA);
  console.log('  ✓ Seeded market trends snapshot');
}