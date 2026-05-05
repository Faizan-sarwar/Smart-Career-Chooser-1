// backend/src/routes/roadmapRoutes.js
import express from 'express';
import {
  generateUserRoadmap,
  getUserRoadmap,
  toggleMilestone,
} from '../controllers/roadmapController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('student'), getUserRoadmap);
router.post('/generate', protect, authorize('student'), generateUserRoadmap);
router.patch(
  '/:roadmapId/milestones/:milestoneId',
  protect,
  authorize('student'),
  toggleMilestone
);

export default router;