// backend/src/controllers/connectionController.js
//
// Unified browsing + connection requests for the "+" button in Messages.
// Reuses the MentorRequest model so we don't duplicate the accept/reject
// flow — we just generalize who can initiate.
//
// Endpoints:
//   GET  /api/connections/browse           — list users of OPPOSITE role
//                                            with connection status for each
//   POST /api/connections/request          — send connection request
//   GET  /api/connections/incoming         — list incoming requests for me
//                                            (works for both students & mentors)

import mongoose from 'mongoose';
import User from '../models/User.js';
import MentorRequest from '../models/MentorRequest.js';
import { notify } from '../services/notificationService.js';

const lc = (v) => String(v || '').toLowerCase();

// ────────────────────────────────────────────────────────────────────
// GET /api/connections/browse?q=search&role=mentor|student
//   Returns users of the OPPOSITE role, with each user's connection
//   status relative to the requester:
//     - none           : no request exists
//     - pending_sent   : I sent them a request, awaiting response
//     - pending_recv   : They sent me a request, awaiting my response
//     - accepted       : we're connected
//     - rejected_sent  : I sent, they rejected
//     - rejected_recv  : They sent, I rejected
// ────────────────────────────────────────────────────────────────────
export const browseConnections = async (req, res, next) => {
  try {
    const myRole = lc(req.user.role);
    const oppositeRole = myRole === 'student' ? 'Mentor' : 'Student';

    // Optional role filter from the client (mentor/student) — but
    // we ignore anything that isn't the opposite role (cross-role rule).
    const roleParam = lc(req.query.role || '');
    if (roleParam && roleParam !== lc(oppositeRole)) {
      // Client explicitly asked for same-role results — disallowed
      return res.json([]);
    }

    const q = (req.query.q || '').trim();

    const filter = {
      role: oppositeRole,
      status: { $ne: 'disabled' },
      _id: { $ne: req.user._id }, // never include self
    };

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { university: regex }];
    }

    const users = await User.find(filter)
      .select('name email avatar university role')
      .limit(60)
      .lean();

    // Pull all my MentorRequest records that involve any of these users
    const userIds = users.map((u) => u._id);

    const requests = await MentorRequest.find({
      $or: [
        // I sent
        {
          ...(myRole === 'student'
            ? { student: req.user._id, mentor: { $in: userIds } }
            : { mentor: req.user._id, student: { $in: userIds } }),
        },
        // They sent (this works because mentor↔student is symmetric in the model;
        // we just check both directions)
        {
          ...(myRole === 'student'
            ? { mentor: req.user._id, student: { $in: userIds } }
            : { student: req.user._id, mentor: { $in: userIds } }),
        },
      ],
    }).lean();

    const statusByUserId = {};
    for (const r of requests) {
      // Identify the "other party"
      const studentId = String(r.student);
      const mentorId = String(r.mentor);
      const otherId = String(req.user._id) === studentId ? mentorId : studentId;
      const iAmSender =
        (myRole === 'student' && String(r.student) === String(req.user._id)) ||
        (myRole === 'mentor' && String(r.mentor) === String(req.user._id) && r.initiator === 'mentor');

      // Most accurate: use the `initiator` field if set on the model.
      // Default to "student initiated" if missing (legacy records).
      const initiator = r.initiator || 'student';
      const iInitiated =
        (initiator === 'student' && myRole === 'student') ||
        (initiator === 'mentor' && myRole === 'mentor');

      let status;
      if (r.status === 'accepted') status = 'accepted';
      else if (r.status === 'pending') status = iInitiated ? 'pending_sent' : 'pending_recv';
      else if (r.status === 'rejected') status = iInitiated ? 'rejected_sent' : 'rejected_recv';
      else status = 'none';

      // Keep the most recent / most advanced status if multiple records exist
      const priority = { accepted: 4, pending_recv: 3, pending_sent: 2, rejected_recv: 1, rejected_sent: 1, none: 0 };
      if (!statusByUserId[otherId] || priority[status] > priority[statusByUserId[otherId].connectionStatus]) {
        statusByUserId[otherId] = {
          connectionStatus: status,
          requestId: r._id,
        };
      }
    }

    // Privacy: only return safe public fields
    const safe = users.map((u) => ({
      id: u._id,
      name: u.name,
      avatar: u.avatar || '',
      university: u.university || '',
      role: u.role,
      // NEVER include: email, phone, location, bio, etc.
      ...(statusByUserId[String(u._id)] || { connectionStatus: 'none' }),
    }));

    res.json(safe);
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────────────
// POST /api/connections/request
//   Body: { targetId, intro? }
//   Creates a MentorRequest between me and the target user.
//   Target's role must be opposite to mine (cross-role-only rule).
// ────────────────────────────────────────────────────────────────────
export const sendConnectionRequest = async (req, res, next) => {
  try {
    const { targetId, intro } = req.body;

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      res.status(400);
      throw new Error('Invalid target user');
    }

    const target = await User.findById(targetId);
    if (!target) {
      res.status(404);
      throw new Error('User not found');
    }

    const myRole = lc(req.user.role);
    const theirRole = lc(target.role);

    // Cross-role only
    if (myRole === theirRole) {
      res.status(400);
      throw new Error('You can only connect with users of the opposite role.');
    }

    if (myRole !== 'student' && myRole !== 'mentor') {
      res.status(403);
      throw new Error('Only students and mentors can send connection requests.');
    }

    // Identify who's the student and who's the mentor in this pair
    const studentId = myRole === 'student' ? req.user._id : target._id;
    const mentorId = myRole === 'student' ? target._id : req.user._id;
    const initiator = myRole; // 'student' or 'mentor'

    // Check for existing live request
    const existing = await MentorRequest.findOne({
      student: studentId,
      mentor: mentorId,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existing) {
      if (existing.status === 'accepted') {
        res.status(409);
        throw new Error('You are already connected with this user.');
      }
      res.status(409);
      throw new Error('A pending request already exists between you.');
    }

    const request = await MentorRequest.create({
      student: studentId,
      mentor: mentorId,
      initiator,
      intro: (intro || '').trim().slice(0, 600),
      status: 'pending',
    });

    // Notify the recipient
    const senderName = req.user.name;
    await notify({
      userId: target._id,
      type: 'info',
      text: `${senderName} wants to connect with you.`,
      link: myRole === 'student' ? '/mentor/requests' : '/student/mentors',
    });

    console.log(
      `[connectionRequest] ${myRole} ${senderName} → ${theirRole} ${target.name}`
    );

    res.status(201).json({
      id: request._id,
      status: request.status,
      message: 'Connection request sent.',
    });
  } catch (err) {
    next(err);
  }
};