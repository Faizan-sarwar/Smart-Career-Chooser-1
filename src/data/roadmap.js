export const roadmap = [
  { id: 1, name: "HTML & CSS Foundations", done: true, courses: [] },
  { id: 2, name: "JavaScript Essentials", done: true, courses: [] },
  { id: 3, name: "React Fundamentals", done: true, courses: [] },
  { id: 4, name: "TypeScript", done: false, courses: [
    { title: "TypeScript Deep Dive", provider: "Frontend Masters", hours: 8 },
    { title: "TS for React Devs", provider: "Coursera", hours: 6 },
  ]},
  { id: 5, name: "System Design Basics", done: false, courses: [
    { title: "Grokking System Design", provider: "Educative", hours: 14 },
    { title: "Designing Data-Intensive Apps", provider: "Book", hours: 30 },
  ]},
  { id: 6, name: "Cloud Fundamentals (AWS)", done: false, courses: [
    { title: "AWS Cloud Practitioner", provider: "AWS", hours: 18 },
  ]},
  { id: 7, name: "ML & AI Foundations", done: false, courses: [
    { title: "Andrew Ng's ML Specialization", provider: "Coursera", hours: 60 },
  ]},
];

export const events = [
  { id: "e1", title: "AI Career Day 2026", host: "Northwind Labs", when: "May 10 · 5:00 PM", attendees: 312, tag: "Webinar" },
  { id: "e2", title: "Mastering Behavioral Interviews", host: "Ana Morales", when: "May 14 · 3:00 PM", attendees: 184, tag: "Workshop" },
  { id: "e3", title: "Inside Big Tech: Q&A", host: "Daniel Kim", when: "May 18 · 6:30 PM", attendees: 540, tag: "AMA" },
  { id: "e4", title: "Portfolio Review Live", host: "Helio Studio", when: "May 22 · 4:00 PM", attendees: 96, tag: "Live" },
];
