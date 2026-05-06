// backend/src/controllers/adminController.js
//
// All admin-only endpoints. Each is `protect + authorize('Admin')`.
//
// Endpoints:
//   GET    /api/admin/stats              — dashboard aggregator
//   GET    /api/admin/users              — paginated user list (real DB)
//   PUT    /api/admin/users/:id/status   — toggle active/disabled
//   PATCH  /api/admin/users/:id/role     — change role
//   DELETE /api/admin/users/:id          — delete user
//   GET    /api/admin/market             — current market snapshot
//   PUT    /api/admin/market             — update market data
//   GET    /api/admin/careers            — list all careers (with filters)
//   POST   /api/admin/careers            — create career
//   PUT    /api/admin/careers/:id        — update career
//   DELETE /api/admin/careers/:id        — soft-delete (isActive=false)
//   GET    /api/admin/events             — list all events
//   POST   /api/admin/events             — create event
//   PUT    /api/admin/events/:id         — update event
//   DELETE /api/admin/events/:id         — delete event
//   GET    /api/admin/reports            — moderation queue
//   POST   /api/admin/reports/:id/resolve — resolve a report (remove or ignore)
//   POST   /api/admin/reports            — student endpoint to file a report
//                                          (mounted on /community routes too)

import User from '../models/User.js';
import Career from '../models/Career.js';
import Event from '../models/Event.js';
import MarketTrend from '../models/MarketTrend.js';
import Post from '../models/Post.js';
import Report from '../models/Report.js';
import AssessmentResult from '../models/AssessmentResult.js';
import Roadmap from '../models/Roadmap.js';

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════

export const getStats = async (req, res, next) => {
  try {
    // All counts in parallel
    const [
      totalUsers,
      students,
      mentors,
      admins,
      totalCareers,
      totalEvents,
      totalPosts,
      totalAssessments,
      totalRoadmaps,
      pendingReports,
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

    // User growth — last 6 months
    const growth = await monthlyGrowth();

    // Weekly engagement — count distinct active users per day for last 7 days
    const engagement = await weeklyEngagement();

    res.json({
      totals: {
        users: totalUsers,
        students,
        mentors,
        admins,
        careers: totalCareers,
        events: totalEvents,
        posts: totalPosts,
        assessments: totalAssessments,
        roadmaps: totalRoadmaps,
        pendingReports,
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
  // Count users created in each of the last 6 months
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

  // Cumulative running total
  let running = await User.countDocuments({ createdAt: { $lt: months[0].start } });
  return months.map((m, i) => {
    running += counts[i];
    return { m: m.label, users: running };
  });
}

async function weeklyEngagement() {
  // Use AssessmentResult + Roadmap completion + new posts as proxy for "sessions"
  // Get count of activity in each of the last 7 days
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
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        avatar: u.avatar,
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
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Don't let an admin disable themselves
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error("You can't disable your own account");
    }

    user.status = user.status === 'active' ? 'disabled' : 'active';
    await user.save();

    res.json({
      id: user._id,
      status: user.status,
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['Student', 'Mentor', 'Admin', 'President'];
    if (!validRoles.includes(role)) {
      res.status(400);
      throw new Error('Invalid role');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

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
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error("You can't delete your own account");
    }

    // Cascade — clean up user's data
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

export const getMarket = async (req, res, next) => {
  try {
    const trend = await MarketTrend.findOne({}).sort({ snapshotDate: -1 }).lean();
    if (!trend) {
      return res.json(null);
    }
    res.json(trend);
  } catch (err) {
    next(err);
  }
};

export const updateMarket = async (req, res, next) => {
  try {
    const { stats, ticker, salaryYears, topSkills, trendingCareers } = req.body;

    let trend = await MarketTrend.findOne({}).sort({ snapshotDate: -1 });

    if (!trend) {
      trend = new MarketTrend({});
    }

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
// CAREERS (CRUD)
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
    if (!career) {
      res.status(404);
      throw new Error('Career not found');
    }
    res.json(career);
  } catch (err) {
    next(err);
  }
};

export const deleteCareer = async (req, res, next) => {
  try {
    // Soft delete — keep historical data
    const career = await Career.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!career) {
      res.status(404);
      throw new Error('Career not found');
    }
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
        ...e,
        id: e._id,
        attendees: e.rsvps?.length || 0,
      }))
    );
  } catch (err) {
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
      new: true,
      runValidators: true,
    });
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
    res.json(event);
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
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

    // Hydrate target content where possible
    const enriched = await Promise.all(
      reports.map(async (r) => {
        let target = null;
        if (r.targetType === 'Post') {
          target = await Post.findById(r.targetId)
            .populate('author', 'name role')
            .lean();
        } else if (r.targetType === 'User') {
          target = await User.findById(r.targetId).select('name email role').lean();
        }
        return {
          id: r._id,
          targetType: r.targetType,
          targetId: r.targetId,
          target,
          reportedBy: r.reportedBy,
          reason: r.reason,
          notes: r.notes,
          status: r.status,
          createdAt: r.createdAt,
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
    const { action } = req.body; // 'remove' | 'ignore'
    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404);
      throw new Error('Report not found');
    }

    if (action === 'remove') {
      // Actually delete the offending content
      if (report.targetType === 'Post') {
        await Post.findByIdAndDelete(report.targetId);
      }
      report.status = 'resolved-removed';
    } else {
      report.status = 'resolved-ignored';
    }

    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();

    res.json({
      id: report._id,
      status: report.status,
    });
  } catch (err) {
    next(err);
  }
};

// Endpoint for any logged-in user (not just admin) to file a report.
// Mounted on /api/community/posts/:id/report
export const fileReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason, notes } = req.body;

    if (!targetType || !targetId) {
      res.status(400);
      throw new Error('targetType and targetId required');
    }

    const report = await Report.create({
      targetType,
      targetId,
      reportedBy: req.user._id,
      reason: reason || 'Other',
      notes: notes || '',
    });

    res.status(201).json({ id: report._id });
  } catch (err) {
    next(err);
  }
};