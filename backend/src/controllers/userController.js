// backend/src/controllers/userController.js
import User from '../models/User.js';
import AssessmentResult from '../models/AssessmentResult.js';
import Roadmap from '../models/Roadmap.js';
import Notification from '../models/Notification.js';
import Session from '../models/Session.js';

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [latestAssessment, activeRoadmap, notifications, nextSession] = await Promise.all([
      AssessmentResult.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
      Roadmap.findOne({ user: userId, isActive: true }).lean(),
      Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(8).lean(),
      Session.findOne({
        mentee: userId,
        status: 'scheduled',
        when: { $gte: new Date() }
      }).sort({ when: 1 }).populate('mentor', 'name avatar email').lean()
    ]);

    const hasAssessment = !!latestAssessment?.hollandCode;
    const hasRoadmap = !!activeRoadmap?.milestones?.length;

    const topMatch = latestAssessment?.recommendations?.[0] || null;
    const matchPct = topMatch?.match || 0;

    const totalMilestones = activeRoadmap?.milestones?.length || 0;
    const completedMilestones = activeRoadmap?.milestones?.filter(m => m.done).length || 0;
    const roadmapProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    const mappedNotifs = notifications.map(n => ({
      id: n._id,
      text: n.message,
      color: n.type === 'milestone' ? 'var(--color-success)' : n.type === 'message' ? 'var(--color-primary)' : 'var(--color-warning)',
      read: n.read,
      time: new Date(n.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
    }));

    res.json({
      hasAssessment, hasRoadmap,
      stats: { matchPct, completedMilestones, totalMilestones, roadmapProgress },
      careerTitle: activeRoadmap?.careerTitle || "Not selected",
      topMatchTitle: topMatch?.title || "Take assessment",
      notifications: mappedNotifs,
      nextSession: nextSession ? {
        id: nextSession._id,
        title: nextSession.title,
        when: nextSession.when,
        meetingLink: nextSession.meetingLink,
        // 🚨 PASSING GOOGLE AVATAR TO THE FRONTEND
        mentor: nextSession.mentor ? { name: nextSession.mentor.name, email: nextSession.mentor.email, avatar: nextSession.mentor.avatar } : null
      } : null
    });
  } catch (error) { next(error); }
};

export const getStudentSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ mentee: req.user._id })
      .populate('mentor', 'name avatar email')
      .sort({ when: 1 })
      .lean();
    res.json(sessions);
  } catch (error) { next(error); }
};

export const getMe = async (req, res, next) => {
  try {
    // Selects avatar automatically natively
    const user = await User.findById(req.user._id).select('-password').lean();
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json(user);
  } catch (err) { next(err); }
};

// ───────────────────────────────────────────────────────────────
// REPLACE the updateProfile function in your backend/src/controllers/
// userController.js with this version. It logs every save so you can
// see in the terminal exactly what's being saved.
// ───────────────────────────────────────────────────────────────

// Allowlist of fields the user can update on themselves via PUT /users/profile.
// NEVER include email, role, password, googleId, _id here.
const PROFILE_FIELDS = [
  'name', 'bio', 'avatar',
  // student fields
  'university', 'location',
  // mentor fields
  'headline', 'employer', 'yearsExperience', 'expertise',
];

// @desc    Update logged-in user's profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    console.log('═══════════════════════════════════════════════');
    console.log('[updateProfile] User:', user.email);
    console.log('[updateProfile] Incoming body keys:', Object.keys(req.body));

    const changes = {};
    for (const field of PROFILE_FIELDS) {
      if (req.body[field] !== undefined) {
        // Special handling for arrays (expertise)
        if (field === 'expertise') {
          user.expertise = Array.isArray(req.body.expertise)
            ? req.body.expertise.map(String).slice(0, 8)
            : [];
        } else {
          user[field] = req.body[field];
        }
        changes[field] = field === 'avatar'
          ? `${String(req.body[field]).slice(0, 60)}…` // truncate base64 in logs
          : req.body[field];
      }
    }

    console.log('[updateProfile] Applying changes:', changes);

    await user.save();
    console.log('[updateProfile] ✓ Saved to MongoDB');

    // Return the FULL updated user object (frontend uses this to sync state)
    const safe = user.toObject();
    delete safe.password;
    console.log('[updateProfile] Returning user with university:', safe.university, '| avatar length:', safe.avatar?.length);
    console.log('═══════════════════════════════════════════════');

    res.json(safe);
  } catch (err) {
    console.error('[updateProfile] FAILED:', err.message);
    next(err);
  }
};

// ───────────────────────────────────────────────────────────────
// ADD this new endpoint for the student to VIEW their own CV.
// Add to studentRoutes.js: router.get('/cv/view', viewMyCV);
// ───────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';

export const viewMyCV = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('cv name').lean();
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // cv may be stored as string path OR as object {filePath, fileName}
    const cvPath = typeof user.cv === 'string'
      ? user.cv.trim()
      : (user.cv?.filePath || '').trim();

    if (!cvPath) {
      res.status(404);
      throw new Error('You have not uploaded a CV yet');
    }

    const absolute = path.resolve(cvPath);
    if (!fs.existsSync(absolute)) {
      res.status(404);
      throw new Error('CV file is missing from server');
    }

    const fileName = (typeof user.cv === 'object' && user.cv?.fileName)
      || cvPath.split('/').pop()
      || 'cv.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.sendFile(absolute);
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error('Incorrect current password');
    }
    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
};

export const updateSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.settings = { ...user.settings, ...req.body };
    await user.save();
    res.json({ message: 'Settings updated successfully' });
  } catch (err) { next(err); }
};