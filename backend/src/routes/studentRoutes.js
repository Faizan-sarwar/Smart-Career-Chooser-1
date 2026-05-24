// backend/src/routes/studentRoutes.js
//
// Student-facing endpoints related to mentor connections.
// Mount with: app.use('/api/student', studentRoutes);

import express from 'express';
import {
  listAvailableMentors,
  listMyRequests,
  sendRequest,
  cancelRequest,
  generateAIAssistIntro // 🚨 ADDED
} from '../controllers/mentorRequestController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('Student'));

router.get('/mentors', listAvailableMentors);
router.get('/mentor-requests', listMyRequests);
router.post('/mentor-requests', sendRequest);
router.post('/mentor-requests/ai-assist', generateAIAssistIntro); // 🚨 AI ROUTE ADDED
router.delete('/mentor-requests/:id', cancelRequest);

export default router;