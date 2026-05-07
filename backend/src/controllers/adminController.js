import User from '../models/User.js';
import Career from '../models/Career.js';
import Event from '../models/Event.js';
import MarketTrend from '../models/MarketTrend.js';
import Post from '../models/Post.js';
import Report from '../models/Report.js';
import AssessmentResult from '../models/AssessmentResult.js';
import Roadmap from '../models/Roadmap.js';
import Groq from "groq-sdk"; // 🚨 IMPORTED GROQ HERE

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════

export const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers, students, mentors, admins,
      totalCareers, totalEvents, totalPosts, totalAssessments,
      totalRoadmaps, pendingReports,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Mentor' }),
      User.countDocuments({ role: 'Admin' }),
      Career.countDocuments({ isActive: true }),
      Event.countDocuments({}),
      Post.countDocuments({}),
      AssessmentResult.countDocuments({}),
      Roadmap.countDocuments({ isActive: true }),
      Report.countDocuments({ status: 'pending' }),
    ]);

    const growth = await monthlyGrowth();
    const engagement = await weeklyEngagement();

    res.json({
      totals: {
        users: totalUsers, students, mentors, admins,
        careers: totalCareers, events: totalEvents, posts: totalPosts,
        assessments: totalAssessments, roadmaps: totalRoadmaps, pendingReports,
      },
      growth,
      engagement,
      roleSplit: [
        { name: 'Students', value: students },
        { name: 'Mentors', value: mentors },
        { name: 'Admins', value: admins },
      ],
    });
  } catch (err) {
    next(err);
  }
};

async function monthlyGrowth() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({ start: d, end: next, label: d.toLocaleString('en-PK', { month: 'short' }) });
  }

  const counts = await Promise.all(
    months.map((m) =>
      User.countDocuments({ createdAt: { $gte: m.start, $lt: m.end } })
    )
  );

  let running = await User.countDocuments({ createdAt: { $lt: months[0].start } });
  return months.map((m, i) => {
    running += counts[i];
    return { m: m.label, users: running };
  });
}

async function weeklyEngagement() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    days.push({ start: d, end: next, label: d.toLocaleString('en-PK', { weekday: 'short' }) });
  }

  const sessions = await Promise.all(
    days.map(async (d) => {
      const [a, p] = await Promise.all([
        AssessmentResult.countDocuments({ createdAt: { $gte: d.start, $lt: d.end } }),
        Post.countDocuments({ createdAt: { $gte: d.start, $lt: d.end } }),
      ]);
      return a + p;
    })
  );

  return days.map((d, i) => ({ day: d.label, sessions: sessions[i] }));
}

// ════════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════════

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      users.map((u) => ({
        id: u._id, name: u.name, email: u.email, role: u.role,
        status: u.status || 'active', avatar: u.avatar,
        university: u.university || null,
        joined: new Date(u.createdAt).toISOString().split('T')[0],
      }))
    );
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new Error('User not found');

    if (user._id.toString() === req.user._id.toString()) {
      res.status(400); throw new Error("You can't disable your own account");
    }

    user.status = user.status === 'active' ? 'disabled' : 'active';
    await user.save();

    res.json({ id: user._id, status: user.status });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['Student', 'Mentor', 'Admin', 'President'];
    if (!validRoles.includes(role)) {
      res.status(400); throw new Error('Invalid role');
    }

    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }

    user.role = role;
    await user.save();
    res.json({ id: user._id, role: user.role });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }

    if (user._id.toString() === req.user._id.toString()) {
      res.status(400); throw new Error("You can't delete your own account");
    }

    await Promise.all([
      AssessmentResult.deleteMany({ user: user._id }),
      Roadmap.deleteMany({ user: user._id }),
      Post.deleteMany({ author: user._id }),
    ]);

    await user.deleteOne();
    res.json({ id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// MARKET DATA
// ════════════════════════════════════════════════════════════════
// 🚨 NEW AI MARKET DATA GENERATOR 🚨
export const generateMarketData = async (req, res, next) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
      You are an expert labor market analyst for the tech and business sectors in Pakistan.
      Generate a realistic, highly accurate, and up-to-date market snapshot.
      
      Return ONLY a valid JSON object matching this exact structure:
      {
        "stats": {
          "openRoles": "String (e.g., '14.2K' or '8,500')",
          "avgSalary": "String (e.g., 'PKR 150K' or 'PKR 1.2M')",
          "remoteShare": "String (e.g., '38%')",
          "topGrowthField": "String (e.g., 'AI Engineering' or 'Data Science')"
        },
        "ticker": [
          "Generate 3 highly engaging, realistic news headlines about Pakistan's tech or business job market (e.g., 'IT exports cross $3 Billion mark...')"
        ],
        "topSkills": [
          { "skill": "Skill Name", "demand": 95 } // Generate exactly 5 highly-demanded skills with demand scores from 0-100
        ],
        "trendingCareers": [
          { "title": "Career Title", "growth": "String (e.g., '+45%')", "color": "#0891b2" } // Generate exactly 3 careers with distinct hex colors
        ]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const generatedData = JSON.parse(chatCompletion.choices[0].message.content);
    res.json(generatedData);
  } catch (err) {
    console.error("Market Generation Error:", err);
    next(err);
  }
};
export const getMarket = async (req, res, next) => {
  try {
    const trend = await MarketTrend.findOne({}).sort({ snapshotDate: -1 }).lean();
    if (!trend) return res.json(null);
    res.json(trend);
  } catch (err) {
    next(err);
  }
};

export const updateMarket = async (req, res, next) => {
  try {
    const { stats, ticker, salaryYears, topSkills, trendingCareers } = req.body;

    let trend = await MarketTrend.findOne({}).sort({ snapshotDate: -1 });
    if (!trend) trend = new MarketTrend({});

    if (stats) trend.stats = { ...trend.stats?.toObject?.() || trend.stats, ...stats };
    if (Array.isArray(ticker)) trend.ticker = ticker;
    if (Array.isArray(salaryYears)) trend.salaryYears = salaryYears;
    if (Array.isArray(topSkills)) trend.topSkills = topSkills;
    if (Array.isArray(trendingCareers)) trend.trendingCareers = trendingCareers;
    trend.snapshotDate = new Date();

    await trend.save();
    res.json(trend);
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// CAREERS (CRUD + AI)
// ════════════════════════════════════════════════════════════════

export const listCareers = async (req, res, next) => {
  try {
    const { cluster, demand, q } = req.query;
    const filter = {};
    if (cluster && cluster !== 'All') filter.cluster = cluster;
    if (demand && demand !== 'All') filter.demand = demand;
    if (q) filter.title = new RegExp(q, 'i');

    const careers = await Career.find(filter).sort({ title: 1 }).lean();
    res.json(careers);
  } catch (err) {
    next(err);
  }
};

// 🚨 NEW AI GENERATOR ROUTE CONTROLLER 🚨
export const generateCareerData = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Career title is required." });

    // Ensure we fetch from .env dynamically
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
      You are an expert career counselor and labor market analyst for Pakistan.
      Provide highly accurate, realistic data for the career: "${title}".
      
      Return ONLY a valid JSON object matching this exact structure:
      {
        "slug": "url-friendly-slug-of-the-title",
        "summary": "A 2-3 sentence professional summary of what this role does.",
        "cluster": "technology", // MUST be one of: technology, business, engineering, health, creative, education, public-service, science, finance, media
        "demand": "high", // MUST be one of: low, moderate, high, very-high
        "growthOutlook": "String (e.g., +25% over next 5 years)",
        "salaryPKR": { "entry": Number, "mid": Number, "senior": Number }, // Realistic monthly salary in PKR
        "riasecFit": { "R": Number, "I": Number, "A": Number, "S": Number, "E": Number, "C": Number }, // 0 to 10 scale for Realistic, Investigative, Artistic, Social, Enterprising, Conventional
        "skillWeights": { "technical": Number, "analytical": Number, "creative": Number, "communication": Number, "leadership": Number, "organization": Number }, // 0 to 10 scale
        "coreSkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
        "educationPaths": ["Path 1", "Path 2"]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.5, // Keeps data factual and consistent
    });

    const generatedData = JSON.parse(chatCompletion.choices[0].message.content);
    res.json(generatedData);
  } catch (err) {
    console.error("Career Generation Error:", err);
    next(err);
  }
};

export const createCareer = async (req, res, next) => {
  try {
    const career = await Career.create(req.body);
    res.status(201).json(career);
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      return next(new Error('A career with this slug already exists'));
    }
    next(err);
  }
};

export const updateCareer = async (req, res, next) => {
  try {
    const career = await Career.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!career) { res.status(404); throw new Error('Career not found'); }
    res.json(career);
  } catch (err) {
    next(err);
  }
};

export const deleteCareer = async (req, res, next) => {
  try {
    const career = await Career.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!career) { res.status(404); throw new Error('Career not found'); }
    res.json({ id: career._id, isActive: false });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// EVENTS (CRUD)
// ════════════════════════════════════════════════════════════════

export const listEventsAdmin = async (req, res, next) => {
  try {
    const events = await Event.find({}).sort({ when: -1 }).lean({ virtuals: true });
    res.json(
      events.map((e) => ({
        ...e, id: e._id, attendees: e.rsvps?.length || 0,
      }))
    );
  } catch (err) {
    next(err);
  }
};
// 🚨 NEW AI EVENT GENERATOR 🚨
export const generateEventData = async (req, res, next) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ message: "Event topic/title is required." });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
      You are an expert tech community manager in Pakistan.
      Generate realistic, highly engaging event details based on this rough topic: "${topic}".
      
      Return ONLY a valid JSON object matching this exact structure:
      {
        "title": "A catchy, professional title for the event",
        "description": "A 2-3 sentence engaging description of what attendees will learn and why they should join.",
        "host": "A realistic Pakistani tech company, university, or community (e.g., Systems Ltd, FAST NUST, Devsinc, Google Developer Group Lahore)",
        "tag": "Webinar", // MUST be one of: Webinar, Workshop, AMA, Live, Networking
        "coverColor": "#0d9488" // A hex color code that fits the tech theme
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const generatedData = JSON.parse(chatCompletion.choices[0].message.content);
    res.json(generatedData);
  } catch (err) {
    console.error("Event Generation Error:", err);
    next(err);
  }
};
export const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!event) { res.status(404); throw new Error('Event not found'); }
    res.json(event);
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) { res.status(404); throw new Error('Event not found'); }
    res.json({ id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// MODERATION / REPORTS
// ════════════════════════════════════════════════════════════════

export const listReports = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    const reports = await Report.find(status === 'all' ? {} : { status })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      reports.map(async (r) => {
        let target = null;
        if (r.targetType === 'Post') {
          target = await Post.findById(r.targetId).populate('author', 'name role').lean();
        } else if (r.targetType === 'User') {
          target = await User.findById(r.targetId).select('name email role').lean();
        }
        return {
          id: r._id, targetType: r.targetType, targetId: r.targetId,
          target, reportedBy: r.reportedBy, reason: r.reason,
          notes: r.notes, status: r.status, createdAt: r.createdAt,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

export const resolveReport = async (req, res, next) => {
  try {
    const { action } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) { res.status(404); throw new Error('Report not found'); }

    if (action === 'remove') {
      if (report.targetType === 'Post') await Post.findByIdAndDelete(report.targetId);
      report.status = 'resolved-removed';
    } else {
      report.status = 'resolved-ignored';
    }

    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();

    res.json({ id: report._id, status: report.status });
  } catch (err) {
    next(err);
  }
};

export const fileReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason, notes } = req.body;
    if (!targetType || !targetId) { res.status(400); throw new Error('targetType and targetId required'); }

    const report = await Report.create({
      targetType, targetId, reportedBy: req.user._id,
      reason: reason || 'Other', notes: notes || '',
    });

    res.status(201).json({ id: report._id });
  } catch (err) {
    next(err);
  }
};
// 🚨 NEW AI TRUST & SAFETY ANALYZER 🚨
export const analyzeContentAI = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Content text is required." });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = `
      You are an expert Trust & Safety moderator for an educational tech platform.
      Analyze this user-reported content for community guideline violations (spam, harassment, inappropriate content, hate speech, etc.).
      
      Content to analyze: "${text}"

      Return ONLY a valid JSON object matching this exact structure:
      {
        "riskLevel": "Low", // MUST be "Low", "Medium", or "High"
        "verdict": "A 1-2 sentence professional explanation of what the text contains and a recommendation on whether to remove or ignore it."
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.2, // Low temperature for highly consistent moderation rules
    });

    const analysis = JSON.parse(chatCompletion.choices[0].message.content);
    res.json(analysis);
  } catch (err) {
    console.error("AI Analysis Error:", err);
    next(err);
  }
};
// ════════════════════════════════════════════════════════════════
// ROADMAPS (MONITORING)
// ════════════════════════════════════════════════════════════════

export const listRoadmapsAdmin = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({})
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();
    res.json(roadmaps);
  } catch (err) {
    next(err);
  }
};

export const deleteRoadmapAdmin = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findByIdAndDelete(req.params.id);
    if (!roadmap) { res.status(404); throw new Error('Roadmap not found'); }
    res.json({ id: req.params.id, deleted: true });
  } catch (err) {
    next(err);
  }
};