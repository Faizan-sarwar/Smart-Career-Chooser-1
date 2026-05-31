// backend/src/routes/studentRoutes.js

import express from 'express';
import {
  listAvailableMentors,
  listMyRequests,
  sendRequest,
  cancelRequest,
  generateAIAssistIntro,
} from '../controllers/mentorRequestController.js';
import {
  uploadCV,
  deleteCV,
  getMyCV,
  viewMyCV
} from '../controllers/cvController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { cvUpload } from '../middlewares/cvUploadMiddleware.js';

const router = express.Router();

router.use(protect, authorize('Student'));

// Mentor browse + requests
router.get('/mentors', listAvailableMentors);
router.get('/mentor-requests', listMyRequests);
router.post('/mentor-requests', sendRequest);
router.post('/mentor-requests/ai-assist', generateAIAssistIntro);
router.delete('/mentor-requests/:id', cancelRequest);

// CV upload/manage
router.get('/cv', getMyCV);
router.post('/cv', cvUpload.single('cv'), uploadCV);
router.get('/cv/view', viewMyCV); 
router.delete('/cv', deleteCV);

export default router;