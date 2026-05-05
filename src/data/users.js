export const allUsers = [
  { id: "u1", name: "Ava Patel",     email: "ava@school.edu",     role: "student", status: "active",   joined: "2025-09-12" },
  { id: "u2", name: "Liam Chen",     email: "liam@school.edu",    role: "student", status: "active",   joined: "2025-10-04" },
  { id: "u3", name: "Sofia Garcia",  email: "sofia@school.edu",   role: "student", status: "active",   joined: "2025-08-22" },
  { id: "u4", name: "Daniel Kim",    email: "daniel@career.io",   role: "mentor",  status: "active",   joined: "2024-03-09" },
  { id: "u5", name: "Priya Shah",    email: "priya@career.io",    role: "mentor",  status: "active",   joined: "2024-06-18" },
  { id: "u6", name: "Marcus Lee",    email: "marcus@career.io",   role: "mentor",  status: "disabled", joined: "2023-11-02" },
  { id: "u7", name: "Helena Ross",   email: "helena@admin.io",    role: "admin",   status: "active",   joined: "2023-01-15" },
  { id: "u8", name: "Noah Williams", email: "noah@school.edu",    role: "student", status: "active",   joined: "2025-10-29" },
  { id: "u9", name: "Mia Johnson",   email: "mia@school.edu",     role: "student", status: "active",   joined: "2025-11-12" },
];

export const adminStats = {
  totals: { users: 12480, students: 9820, mentors: 2410, admins: 250 },
  growth: [
    { m: "Jun", users: 8200 }, { m: "Jul", users: 9100 }, { m: "Aug", users: 9750 },
    { m: "Sep", users: 10500 }, { m: "Oct", users: 11320 }, { m: "Nov", users: 12480 },
  ],
  engagement: [
    { day: "Mon", sessions: 320 }, { day: "Tue", sessions: 410 }, { day: "Wed", sessions: 380 },
    { day: "Thu", sessions: 460 }, { day: "Fri", sessions: 520 }, { day: "Sat", sessions: 290 }, { day: "Sun", sessions: 240 },
  ],
  roleSplit: [
    { name: "Students", value: 9820 },
    { name: "Mentors", value: 2410 },
    { name: "Admins", value: 250 },
  ],
};
