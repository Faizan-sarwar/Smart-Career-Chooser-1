// backend/src/routes/userRoutes.js
import express from 'express';
import { getStudentDashboard } from '../controllers/userController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// The user MUST be logged in (protect) and MUST be a student (authorize) to see this
router.get('/dashboard', protect, authorize('student'), getStudentDashboard);

export default router;