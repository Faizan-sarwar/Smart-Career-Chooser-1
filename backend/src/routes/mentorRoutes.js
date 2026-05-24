// backend/src/routes/mentorRoutes.js

import express from 'express';
import {
  getDashboard,
  listMentees,
  getMenteeDetail,
  getInsights,
  listSessions,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/mentorController.js';
import {
  listIncomingRequests,
  respondToRequest,
} from '../controllers/mentorRequestController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('Mentor'));

// Dashboard + roster
router.get('/dashboard', getDashboard);
router.get('/mentees', listMentees);
router.get('/mentees/:id', getMenteeDetail);
router.get('/insights', getInsights);

// Sessions
router.get('/sessions', listSessions);
router.post('/sessions', createSession);
router.patch('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);

// Mentor request inbox 
router.get('/requests', listIncomingRequests);
router.post('/requests/:id/respond', respondToRequest);

export default router;