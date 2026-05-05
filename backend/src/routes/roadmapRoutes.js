import express from 'express';
import { getRoadmap } from '../controllers/roadmapController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/', protect, getRoadmap);
export default router;