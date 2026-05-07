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
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All mentor routes require Mentor role
router.use(protect, authorize('Mentor'));

router.get('/dashboard', getDashboard);

router.get('/mentees', listMentees);
router.get('/mentees/:id', getMenteeDetail);

router.get('/insights', getInsights);

router.get('/sessions', listSessions);
router.post('/sessions', createSession);
router.patch('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);

export default router;