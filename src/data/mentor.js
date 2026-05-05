export const mentees = [
  { id: "m1", name: "Ava Patel", program: "Computer Science", progress: 72, status: "Active", lastActive: "2h ago" },
  { id: "m2", name: "Liam Chen", program: "Data Analytics", progress: 45, status: "Active", lastActive: "1d ago" },
  { id: "m3", name: "Sofia Garcia", program: "UX Design", progress: 88, status: "Active", lastActive: "5h ago" },
  { id: "m4", name: "Noah Williams", program: "Cybersecurity", progress: 30, status: "At risk", lastActive: "5d ago" },
  { id: "m5", name: "Mia Johnson", program: "Cloud Engineering", progress: 60, status: "Active", lastActive: "3h ago" },
];

export const conversations = [
  { id: "t1", with: "Ava Patel", last: "Thanks for the feedback!", unread: 2, messages: [
    { id:1, from:"them", text:"Hi! Got time to review my portfolio?" , at:"10:01" },
    { id:2, from:"me", text:"Sure, send it over." , at:"10:03" },
    { id:3, from:"them", text:"Thanks for the feedback!" , at:"10:21" },
  ]},
  { id: "t2", with: "Liam Chen", last: "Tomorrow at 4pm works.", unread: 0, messages: [
    { id:1, from:"me", text:"Available tomorrow for a sync?" , at:"Yesterday" },
    { id:2, from:"them", text:"Tomorrow at 4pm works." , at:"Yesterday" },
  ]},
  { id: "t3", with: "Sofia Garcia", last: "Sharing the case study now.", unread: 1, messages: [
    { id:1, from:"them", text:"Sharing the case study now." , at:"08:14" },
  ]},
];

export const sessions = [
  { id: "s1", title: "Career planning — Ava", date: 12, time: "10:00" },
  { id: "s2", title: "Portfolio review — Sofia", date: 14, time: "14:30" },
  { id: "s3", title: "1:1 — Liam", date: 18, time: "16:00" },
  { id: "s4", title: "Mock interview — Noah", date: 22, time: "11:00" },
];
