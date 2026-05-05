// backend/src/routes/assessmentRoutes.js
import express from 'express';
import {
  getActiveAssessment,
  submitAssessment,
  getRecommendations,
  getAssessmentHistory,
} from '../controllers/assessmentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/questions', protect, authorize('student'), getActiveAssessment);
router.post('/', protect, authorize('student'), submitAssessment);
router.get('/recommendations', protect, authorize('student'), getRecommendations);
router.get('/history', protect, authorize('student'), getAssessmentHistory);

export default router;