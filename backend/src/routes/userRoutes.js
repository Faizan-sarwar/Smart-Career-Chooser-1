// backend/src/routes/userRoutes.js
import express from 'express';
import { getDashboard, getMe } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboard);
router.get('/me', protect, getMe);

export default router;