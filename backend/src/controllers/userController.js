// backend/src/controllers/userController.js
import User from '../models/User.js';
import AssessmentResult from '../models/AssessmentResult.js';
import Roadmap from '../models/Roadmap.js';
import Notification from '../models/Notification.js';
import Session from '../models/Session.js'; // 🚨 IMPORT SESSION MODEL

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 🚨 Run queries in parallel, NOW INCLUDING THE NEXT UPCOMING SESSION 🚨
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
    const completedMilestones = activeRoadmap?.milestones?.filter((m) => m.done).length || 0;
    const roadmapProgress = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);

    const mappedNotifs = notifications.map(n => ({
      id: n._id, text: n.text, type: n.type, color: n.color, link: n.link, read: n.read,
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
        mentor: nextSession.mentor ? { name: nextSession.mentor.name, email: nextSession.mentor.email } : null
      } : null // 🚨 ADDED TO PAYLOAD
    });
  } catch (error) { next(error); }
};

// 🚨 NEW ENDPOINT: Fetch all sessions for the student's dedicated "My Sessions" page
export const getStudentSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ mentee: req.user._id })
      .populate('mentor', 'name avatar email')
      .sort({ when: 1 })
      .lean();
    res.json(sessions);
  } catch (error) { next(error); }
};
export const getMe = async (req, res, next) => { /* existing code */ };
export const updateProfile = async (req, res, next) => { /* existing code */ };
export const updatePassword = async (req, res, next) => { /* existing code */ };
export const updateSettings = async (req, res, next) => { /* existing code */ };