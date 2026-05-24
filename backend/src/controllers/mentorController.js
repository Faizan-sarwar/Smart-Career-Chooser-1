// backend/src/controllers/mentorController.js
//
// PATCHED — every role/string comparison is now case-insensitive.
// Also adds verbose logging to surface why "X not found" happens.

import User from '../models/User.js';
import AssessmentResult from '../models/AssessmentResult.js';
import Roadmap from '../models/Roadmap.js';
import Session from '../models/Session.js';
import Message from '../models/Message.js';
import MentorRequest from '../models/MentorRequest.js';

// ── Get IDs of students this mentor has accepted ─────────────────
async function getAcceptedMenteeIds(mentorId) {
  const accepted = await MentorRequest.find({
    mentor: mentorId,
    status: 'accepted',
  })
    .select('student')
    .lean();
  return accepted.map((r) => r.student);
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════

export const getDashboard = async (req, res, next) => {
  try {
    const mentorId = req.user._id;
    const menteeIds = await getAcceptedMenteeIds(mentorId);

    const [mentees, sessionsThisWeek, unreadMessages, pendingRequests] =
      await Promise.all([
        User.find({ _id: { $in: menteeIds }, status: { $ne: 'disabled' } })
          .select('-password')
          .sort({ createdAt: -1 })
          .lean(),
        Session.countDocuments({
          mentor: mentorId,
          when: { $gte: startOfWeek(), $lte: endOfWeek() },
          status: 'scheduled',
        }),
        Message.countDocuments({ recipient: mentorId, read: false }),
        MentorRequest.countDocuments({ mentor: mentorId, status: 'pending' }),
      ]);

    const enriched = await Promise.all(
      mentees.map(async (m) => {
        const [assessment, roadmap] = await Promise.all([
          AssessmentResult.findOne({ user: m._id }).sort({ createdAt: -1 }).lean(),
          Roadmap.findOne({ user: m._id, isActive: true }).lean(),
        ]);
        return formatMentee(m, assessment, roadmap);
      })
    );

    const recentlyAssessed = enriched
      .filter((m) => m.lastAssessmentDays !== null && m.lastAssessmentDays <= 14)
      .slice(0, 5);

    res.json({
      stats: {
        activeMentees: enriched.length,
        sessionsThisWeek,
        unreadMessages,
        pendingRequests,
        avgRating: 'N/A',
      },
      mentees: enriched,
      recentlyAssessed,
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// MENTEES (accepted only)
// ════════════════════════════════════════════════════════════════

export const listMentees = async (req, res, next) => {
  try {
    const menteeIds = await getAcceptedMenteeIds(req.user._id);

    const mentees = await User.find({
      _id: { $in: menteeIds },
      status: { $ne: 'disabled' },
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      mentees.map(async (m) => {
        const [assessment, roadmap] = await Promise.all([
          AssessmentResult.findOne({ user: m._id }).sort({ createdAt: -1 }).lean(),
          Roadmap.findOne({ user: m._id, isActive: true }).lean(),
        ]);
        return formatMentee(m, assessment, roadmap);
      })
    );

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

// THE FIX — case-insensitive role check + verbose logging
export const getMenteeDetail = async (req, res, next) => {
  try {
    console.log(
      `[getMenteeDetail] mentor=${req.user._id} requesting mentee=${req.params.id}`
    );

    // Verify accepted relationship first
    const isAccepted = await MentorRequest.findOne({
      mentor: req.user._id,
      student: req.params.id,
      status: 'accepted',
    });

    if (!isAccepted) {
      console.log('[getMenteeDetail] No accepted relationship found');
      res.status(403);
      throw new Error('This student is not in your accepted roster');
    }

    const mentee = await User.findById(req.params.id).select('-password').lean();
    if (!mentee) {
      console.log('[getMenteeDetail] User not found in DB');
      res.status(404);
      throw new Error('Mentee not found');
    }

    // Case-insensitive role check
    const role = String(mentee.role || '').toLowerCase();
    console.log(`[getMenteeDetail] Found user "${mentee.name}" with role "${mentee.role}"`);

    if (role !== 'student') {
      res.status(404);
      throw new Error(
        `User "${mentee.name}" has role "${mentee.role}", not Student`
      );
    }

    const [assessment, roadmap, recentSessions] = await Promise.all([
      AssessmentResult.findOne({ user: mentee._id }).sort({ createdAt: -1 }).lean(),
      Roadmap.findOne({ user: mentee._id, isActive: true }).lean(),
      Session.find({ mentee: mentee._id }).sort({ when: -1 }).limit(5).lean(),
    ]);

    res.json({
      ...formatMentee(mentee, assessment, roadmap),
      assessment: assessment
        ? {
          hollandCode: assessment.hollandCode,
          riasecScores: assessment.riasecScores,
          skillStrength: assessment.skillStrength,
          recommendations: (assessment.recommendations || []).slice(0, 3),
        }
        : null,
      roadmap: roadmap
        ? {
          careerTitle: roadmap.careerTitle,
          milestones: roadmap.milestones.map((m) => ({
            name: m.name,
            phase: m.phase,
            done: m.done,
          })),
          createdAt: roadmap.createdAt,
        }
        : null,
      recentSessions: recentSessions.map((s) => ({
        id: s._id,
        title: s.title,
        when: s.when,
        status: s.status,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// INSIGHTS (accepted only)
// ════════════════════════════════════════════════════════════════

export const getInsights = async (req, res, next) => {
  try {
    const menteeIds = await getAcceptedMenteeIds(req.user._id);

    const mentees = await User.find({
      _id: { $in: menteeIds },
      status: { $ne: 'disabled' },
    })
      .select('-password')
      .lean();

    const enriched = await Promise.all(
      mentees.map(async (m) => {
        const [assessment, roadmap] = await Promise.all([
          AssessmentResult.findOne({ user: m._id }).sort({ createdAt: -1 }).lean(),
          Roadmap.findOne({ user: m._id, isActive: true }).lean(),
        ]);
        return { user: m, assessment, roadmap };
      })
    );

    const noAssessment = enriched.filter((e) => !e.assessment).map((e) => formatInsight(e, 'no-assessment'));
    const noRoadmap = enriched.filter((e) => e.assessment && !e.roadmap).map((e) => formatInsight(e, 'no-roadmap'));

    const stalled = enriched
      .filter((e) => e.roadmap && e.roadmap.milestones?.length)
      .filter((e) => {
        const completed = e.roadmap.milestones.filter((m) => m.done && m.doneAt);
        if (completed.length === 0) {
          const age = (Date.now() - new Date(e.roadmap.createdAt).getTime()) / 86400000;
          return age >= 14;
        }
        const lastDone = Math.max(...completed.map((m) => new Date(m.doneAt).getTime()));
        return (Date.now() - lastDone) / 86400000 >= 14;
      })
      .map((e) => formatInsight(e, 'stalled'));

    const excelling = enriched
      .filter((e) => {
        if (!e.roadmap?.milestones?.length) return false;
        const done = e.roadmap.milestones.filter((m) => m.done).length;
        return done / e.roadmap.milestones.length >= 0.5;
      })
      .map((e) => formatInsight(e, 'excelling'));

    res.json({
      summary: {
        total: enriched.length,
        noAssessment: noAssessment.length,
        noRoadmap: noRoadmap.length,
        stalled: stalled.length,
        excelling: excelling.length,
      },
      buckets: { noAssessment, noRoadmap, stalled, excelling },
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// SESSIONS (unchanged from your version)
// ════════════════════════════════════════════════════════════════

export const listSessions = async (req, res, next) => {
  try {
    const filter = { mentor: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const sessions = await Session.find(filter)
      .populate('mentee', 'name email avatar')
      .sort({ when: 1 })
      .lean();
    res.json(sessions.map((s) => ({
      id: s._id, title: s.title, agenda: s.agenda, when: s.when,
      durationMinutes: s.durationMinutes, meetingLink: s.meetingLink,
      status: s.status, notes: s.notes,
      mentee: s.mentee ? { id: s.mentee._id, name: s.mentee.name, email: s.mentee.email, avatar: s.mentee.avatar } : null,
    })));
  } catch (err) { next(err); }
};

export const createSession = async (req, res, next) => {
  try {
    const { menteeId, title, agenda, when, durationMinutes, meetingLink } = req.body;
    if (!menteeId || !title || !when) {
      res.status(400); throw new Error('menteeId, title, and when are required');
    }
    const accepted = await MentorRequest.findOne({
      mentor: req.user._id, student: menteeId, status: 'accepted',
    });
    if (!accepted) {
      res.status(403); throw new Error('You can only schedule sessions with accepted mentees');
    }
    const session = await Session.create({
      mentor: req.user._id, mentee: menteeId, title: title.trim(),
      agenda: agenda || '', when: new Date(when),
      durationMinutes: durationMinutes || 30, meetingLink: meetingLink || '',
    });

    // Notify the mentee about the new session
    try {
      const { notify } = await import('../services/notificationService.js');
      await notify({
        userId: menteeId,
        type: 'event',
        text: `${req.user.name} scheduled a session: "${title.trim()}"`,
        link: '/student/dashboard',
      });
    } catch (e) { console.warn('[createSession] notify failed:', e.message); }

    const populated = await Session.findById(session._id).populate('mentee', 'name email avatar').lean();
    res.status(201).json({
      id: populated._id, title: populated.title, agenda: populated.agenda,
      when: populated.when, durationMinutes: populated.durationMinutes,
      meetingLink: populated.meetingLink, status: populated.status, notes: populated.notes,
      mentee: { id: populated.mentee._id, name: populated.mentee.name, email: populated.mentee.email, avatar: populated.mentee.avatar },
    });
  } catch (err) { next(err); }
};

export const updateSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) { res.status(404); throw new Error('Session not found'); }
    if (session.mentor.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not your session');
    }
    const allowed = ['title', 'agenda', 'when', 'durationMinutes', 'meetingLink', 'status', 'notes'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        session[key] = key === 'when' ? new Date(req.body[key]) : req.body[key];
      }
    }
    await session.save();
    const populated = await Session.findById(session._id).populate('mentee', 'name email avatar').lean();
    res.json({
      id: populated._id, title: populated.title, agenda: populated.agenda,
      when: populated.when, durationMinutes: populated.durationMinutes,
      meetingLink: populated.meetingLink, status: populated.status, notes: populated.notes,
      mentee: { id: populated.mentee._id, name: populated.mentee.name, email: populated.mentee.email, avatar: populated.mentee.avatar },
    });
  } catch (err) { next(err); }
};

export const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) { res.status(404); throw new Error('Session not found'); }
    if (session.mentor.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not your session');
    }
    await session.deleteOne();
    res.json({ id: req.params.id, deleted: true });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function formatMentee(user, assessment, roadmap) {
  const totalMilestones = roadmap?.milestones?.length || 0;
  const completedMilestones = roadmap?.milestones?.filter((m) => m.done).length || 0;
  const progress = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const lastAssessmentDays = assessment
    ? Math.floor((Date.now() - new Date(assessment.createdAt).getTime()) / 86400000) : null;

  let computedStatus = 'active';
  if (!assessment) computedStatus = 'onboarding';
  else if (!roadmap) computedStatus = 'needs-roadmap';
  else if (progress >= 50) computedStatus = 'excelling';
  else if (lastAssessmentDays > 30) computedStatus = 'inactive';

  return {
    id: user._id, name: user.name, email: user.email, avatar: user.avatar,
    university: user.university || 'Undeclared', program: user.university || 'Undeclared',
    joined: new Date(user.createdAt).toISOString().split('T')[0],
    progress, progressDisplay: `${progress}%`,
    status: computedStatus,
    statusDisplay: { active: 'Active', onboarding: 'Onboarding', 'needs-roadmap': 'Needs Roadmap', excelling: 'Excelling', inactive: 'Inactive' }[computedStatus] || 'Active',
    hollandCode: assessment?.hollandCode || null,
    careerTitle: roadmap?.careerTitle || null,
    totalMilestones, completedMilestones, lastAssessmentDays,
    lastActiveLabel: formatLastActive(user.updatedAt),
  };
}

function formatInsight(e, type) {
  const totalMilestones = e.roadmap?.milestones?.length || 0;
  const completedMilestones = e.roadmap?.milestones?.filter((m) => m.done).length || 0;
  const progress = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  return {
    id: e.user._id, name: e.user.name, email: e.user.email,
    university: e.user.university || 'Undeclared',
    progress, type,
    careerTitle: e.roadmap?.careerTitle || null,
    daysSinceJoin: Math.floor((Date.now() - new Date(e.user.createdAt).getTime()) / 86400000),
  };
}

function formatLastActive(date) {
  if (!date) return 'unknown';
  const diff = (Date.now() - new Date(date).getTime()) / 86400000;
  if (diff < 1) return 'Today';
  if (diff < 2) return 'Yesterday';
  if (diff < 7) return `${Math.floor(diff)}d ago`;
  return new Date(date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

function startOfWeek() {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d;
}
function endOfWeek() {
  const d = startOfWeek(); d.setDate(d.getDate() + 7); return d;
}