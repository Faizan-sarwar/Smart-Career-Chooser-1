// backend/src/controllers/mentorRequestController.js
//
// SAME logic, but VERY loud logging around notification calls so we can
// see in the terminal exactly when notifications fire (or don't).

import mongoose from 'mongoose';
import User from '../models/User.js';
import MentorRequest from '../models/MentorRequest.js';
import AssessmentResult from '../models/AssessmentResult.js';
import { notify } from '../services/notificationService.js';

export const listAvailableMentors = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const [mentors, myRequests] = await Promise.all([
      User.find({ role: /^mentor$/i, status: { $ne: 'disabled' } })
        .select('-password').sort({ createdAt: -1 }).lean(),
      MentorRequest.find({ student: studentId }).sort({ createdAt: -1 }).lean(),
    ]);

    const statusByMentor = new Map();
    for (const r of myRequests) {
      const key = r.mentor.toString();
      if (!statusByMentor.has(key)) {
        statusByMentor.set(key, {
          status: r.status, requestId: r._id, createdAt: r.createdAt,
          rejectionReason: r.rejectionReason,
        });
      }
    }

    res.json(mentors.map((m) => ({
      id: m._id.toString(), name: m.name, email: m.email, avatar: m.avatar,
      expertise: m.expertise || 'General career guidance',
      university: m.university || '', joined: m.createdAt,
      relationship: statusByMentor.get(m._id.toString()) || { status: 'none' },
    })));
  } catch (err) { next(err); }
};

export const listMyRequests = async (req, res, next) => {
  try {
    const requests = await MentorRequest.find({ student: req.user._id })
      .populate('mentor', 'name email avatar expertise university')
      .sort({ createdAt: -1 }).lean();
    res.json(requests.map(formatRequestForStudent));
  } catch (err) { next(err); }
};

export const sendRequest = async (req, res, next) => {
  try {
    const { mentorId, intro } = req.body;

    if (!mentorId || !mongoose.Types.ObjectId.isValid(mentorId)) {
      res.status(400);
      throw new Error(`Invalid mentorId: "${mentorId}"`);
    }

    const mentor = await User.findById(mentorId);
    if (!mentor) {
      res.status(404);
      throw new Error(`No user exists with ID ${mentorId}`);
    }

    const role = String(mentor.role || '').toLowerCase();
    if (role !== 'mentor') {
      res.status(400);
      throw new Error(`User "${mentor.name}" has role "${mentor.role}", not Mentor`);
    }

    if (mentor.status === 'disabled') {
      res.status(400);
      throw new Error('This mentor is not currently accepting requests');
    }

    const existing = await MentorRequest.findOne({
      student: req.user._id, mentor: mentorId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existing) {
      res.status(400);
      throw new Error(
        existing.status === 'pending'
          ? 'You already have a pending request with this mentor'
          : 'You are already connected with this mentor'
      );
    }

    const request = await MentorRequest.create({
      student: req.user._id, mentor: mentorId,
      intro: (intro || '').trim(),
    });

    // 🔔 NOTIFY MENTOR — with very loud logging
    console.log('═══════════════════════════════════════════');
    console.log('[sendRequest] Request created. Firing notification...');
    console.log('  → recipient (mentor) id:', mentorId);
    console.log('  → sender (student) name:', req.user.name);
    const notifResult = await notify({
      userId: mentorId,
      type: 'info',
      text: `${req.user.name} sent you a mentorship request.`,
      link: '/mentor/requests',
    });
    console.log('  → notify() returned:', notifResult ? `OK (id ${notifResult._id})` : 'NULL/FAILED');
    console.log('═══════════════════════════════════════════');

    const populated = await MentorRequest.findById(request._id)
      .populate('mentor', 'name email avatar expertise university')
      .lean();

    res.status(201).json(formatRequestForStudent(populated));
  } catch (err) { next(err); }
};

export const cancelRequest = async (req, res, next) => {
  try {
    const request = await MentorRequest.findById(req.params.id);
    if (!request) { res.status(404); throw new Error('Request not found'); }
    if (request.student.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not your request');
    }
    if (request.status !== 'pending') {
      res.status(400); throw new Error(`Cannot cancel a ${request.status} request`);
    }
    request.status = 'cancelled';
    request.respondedAt = new Date();
    await request.save();
    res.json({ id: request._id, status: request.status });
  } catch (err) { next(err); }
};

export const generateAIAssistIntro = async (req, res, next) => {
  try {
    const { mentorName, mentorExpertise } = req.body;
    const student = await User.findById(req.user._id);
    const assessment = await AssessmentResult.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    const studentName = student.name.split(' ')[0];
    const mName = mentorName ? mentorName.split(' ')[0] : 'Mentor';
    const expertise = mentorExpertise || 'your field';
    const topInterest = assessment?.recommendations?.[0]?.title || 'my career development';
    const uni = student.university ? ` at ${student.university}` : '';

    const templates = [
      `Hi ${mName}, I'm ${studentName}, a student${uni} highly interested in ${topInterest}. I deeply admire your expertise in ${expertise} and would be honored to receive your guidance.`,
      `Dear ${mName}, my name is ${studentName}. I am focusing my studies on ${topInterest}. Your background in ${expertise} really stands out. I would love the opportunity to be mentored by you.`,
      `Hello ${mName}! As an aspiring professional in ${topInterest}, your experience in ${expertise} aligns perfectly with my goals. I'd be grateful for any mentorship you could provide.`
    ];

    setTimeout(() => res.json({ suggestion: templates[Math.floor(Math.random() * templates.length)] }), 600);
  } catch (err) { next(err); }
};

export const listIncomingRequests = async (req, res, next) => {
  try {
    const filter = { mentor: req.user._id };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

    const requests = await MentorRequest.find(filter)
      .populate('student', 'name email avatar university')
      .sort({ createdAt: -1 }).lean();

    const enriched = await Promise.all(requests.map(async (r) => {
      if (!r.student) return formatRequestForMentor(r, null);
      const assessment = await AssessmentResult.findOne({ user: r.student._id })
        .sort({ createdAt: -1 }).lean();
      return formatRequestForMentor(r, assessment);
    }));

    res.json(enriched);
  } catch (err) { next(err); }
};

export const respondToRequest = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;
    if (!['accept', 'reject'].includes(action)) {
      res.status(400); throw new Error('action must be "accept" or "reject"');
    }
    const request = await MentorRequest.findById(req.params.id);
    if (!request) { res.status(404); throw new Error('Request not found'); }
    if (request.mentor.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not your request to respond to');
    }
    if (request.status !== 'pending') {
      res.status(400); throw new Error(`Request is already ${request.status}`);
    }

    request.status = action === 'accept' ? 'accepted' : 'rejected';
    request.respondedAt = new Date();
    if (action === 'reject' && rejectionReason) {
      request.rejectionReason = rejectionReason.trim().slice(0, 300);
    }
    await request.save();

    // 🔔 Notify the student
    console.log('═══════════════════════════════════════════');
    console.log(`[respondToRequest] ${action.toUpperCase()}ED — notifying student`);
    console.log('  → recipient (student) id:', request.student);
    const notifResult = await notify({
      userId: request.student,
      type: action === 'accept' ? 'success' : 'info',
      text: action === 'accept'
        ? `${req.user.name} accepted your mentorship request!`
        : `${req.user.name} declined your mentorship request.`,
      link: '/student/mentors',
    });
    console.log('  → notify() returned:', notifResult ? `OK (id ${notifResult._id})` : 'NULL/FAILED');
    console.log('═══════════════════════════════════════════');

    const populated = await MentorRequest.findById(request._id)
      .populate('student', 'name email avatar university')
      .lean();

    res.json(formatRequestForMentor(populated, null));
  } catch (err) { next(err); }
};

function formatRequestForStudent(r) {
  return {
    id: r._id, status: r.status, intro: r.intro,
    rejectionReason: r.rejectionReason, createdAt: r.createdAt,
    respondedAt: r.respondedAt, timeAgo: timeAgo(r.createdAt),
    mentor: r.mentor ? {
      id: r.mentor._id, name: r.mentor.name, email: r.mentor.email,
      avatar: r.mentor.avatar,
      expertise: r.mentor.expertise || 'General career guidance',
      university: r.mentor.university || '',
    } : null,
  };
}

function formatRequestForMentor(r, assessment) {
  return {
    id: r._id, status: r.status, intro: r.intro,
    rejectionReason: r.rejectionReason, createdAt: r.createdAt,
    respondedAt: r.respondedAt, timeAgo: timeAgo(r.createdAt),
    student: r.student ? {
      id: r.student._id, name: r.student.name, email: r.student.email,
      avatar: r.student.avatar,
      university: r.student.university || 'Undeclared',
      hollandCode: assessment?.hollandCode || null,
      topInterest: assessment?.recommendations?.[0]?.title || null,
      hasAssessment: !!assessment,
    } : null,
  };
}

function timeAgo(date) {
  if (!date) return 'just now';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-PK');
}