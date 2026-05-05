import express from 'express';
import { submitAssessment, getRecommendations } from '../controllers/assessmentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('student'), submitAssessment);
router.get('/recommendations', protect, authorize('student'), getRecommendations);

export default router;