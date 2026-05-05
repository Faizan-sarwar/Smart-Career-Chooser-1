import express from 'express';
import { getMentees } from '../controllers/mentorController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/mentees', protect, authorize('mentor', 'admin'), getMentees);
export default router;