// backend/src/routes/userRoutes.js
import express from 'express';
import { 
  getDashboard, 
  getMe, 
  updateProfile, 
  updatePassword, 
  updateSettings 
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboard);
router.get('/me', protect, getMe);

// NEW ROUTES FOR PROFILE & SETTINGS
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.put('/settings', protect, updateSettings);

export default router;