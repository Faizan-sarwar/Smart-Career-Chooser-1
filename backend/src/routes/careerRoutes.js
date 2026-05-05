// backend/src/routes/careerRoutes.js
import express from 'express';
import { listCareers, getCareerBySlug } from '../controllers/careerController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, listCareers);
router.get('/:slug', protect, getCareerBySlug);

export default router;