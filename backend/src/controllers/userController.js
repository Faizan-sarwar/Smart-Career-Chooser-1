// backend/src/controllers/userController.js
//
// User-related endpoints: dashboard data aggregation, profile.
// The dashboard endpoint pulls from multiple collections to give the
// frontend a single payload it can render without N+1 calls.

import User from '../models/User.js';
import AssessmentResult from '../models/AssessmentResult.js';
import Roadmap from '../models/Roadmap.js';
import Notification from '../models/Notification.js';

// @desc    Aggregated dashboard payload for student
// @route   GET /api/users/dashboard
// @access  Private
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Run queries in parallel for speed
    const [latestAssessment, activeRoadmap, notifications] = await Promise.all([
      AssessmentResult.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .lean(),
      Roadmap.findOne({ user: userId, isActive: true }).lean(),
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    // ── Derive stats from real data ────────────────────────────────
    const hasAssessment = !!latestAssessment?.hollandCode;
    const hasRoadmap = !!activeRoadmap?.milestones?.length;

    const topMatch = latestAssessment?.recommendations?.[0] || null;
    const matchPct = topMatch?.match || 0;

    const totalMilestones = activeRoadmap?.milestones?.length || 0;
    const completedMilestones =
      activeRoadmap?.milestones?.filter((m) => m.done).length || 0;
    const roadmapPct = totalMilestones
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

    const profileCompletion =
      (hasAssessment ? 50 : 0) + (hasRoadmap ? 50 : 0);

    // Top 4 self-rated skills from assessment
    const topSkills =
      latestAssessment?.skillStrength?.slice(0, 4).map((s) => ({
        name: s.skill,
        value: s.value,
      })) || [];

    // ── First 5 milestones for the timeline section ────────────────
    const milestonesPreview = (activeRoadmap?.milestones || [])
      .slice(0, 5)
      .map((m, i) => ({
        title: m.name,
        meta:
          m.phase?.replace('-months', ' mo').replace('+', '+ ') ||
          `Step ${i + 1}`,
        done: !!m.done,
      }));

    res.json({
      hasAssessment,
      hasRoadmap,
      assessmentProgress: profileCompletion,
      hollandCode: latestAssessment?.hollandCode || null,
      topMatch: topMatch
        ? {
            id: topMatch.id,
            title: topMatch.title,
            cluster: topMatch.cluster,
            match: topMatch.match,
            salary: topMatch.salary,
            reasoning: topMatch.reasoning,
          }
        : null,
      stats: {
        match: matchPct,
        courses: completedMilestones,
        growth: hasAssessment ? `+${matchPct}%` : '0%',
      },
      milestones: milestonesPreview,
      milestoneStats: {
        total: totalMilestones,
        completed: completedMilestones,
        pct: roadmapPct,
      },
      skills: topSkills,
      notifications: notifications.map((n) => ({
        text: n.text,
        time: timeAgo(n.createdAt),
        color: n.color,
        type: n.type,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/users/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── Helpers ────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return 'just now';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.university = req.body.university !== undefined ? req.body.university : user.university;
      user.location = req.body.location !== undefined ? req.body.location : user.location;
      
      if (req.body.avatar) {
        user.avatar = req.body.avatar;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        university: updatedUser.university,
        location: updatedUser.location,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    // We must explicitly select the password because we set `select: false` in the model
    const user = await User.findById(req.user._id).select('+password');

    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword; // The pre-save hook in User.js will hash this automatically!
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401);
      throw new Error('Incorrect current password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user preferences/settings
// @route   PUT /api/users/settings
// @access  Private
export const updateSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      // If preferences doesn't exist yet, initialize it
      user.preferences = { ...(user.preferences || {}), ...req.body };
      // Mongoose requires marking mixed objects as modified
      user.markModified('preferences'); 
      await user.save();
      res.json({ message: 'Settings updated successfully' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};