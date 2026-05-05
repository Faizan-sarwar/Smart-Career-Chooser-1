import express from 'express';
import { getAllUsers, toggleUserStatus, deleteUser, getDashboardStats } from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Only admins can hit these routes
router.use(protect, authorize('admin'));

router.route('/users').get(getAllUsers);
router.route('/users/:id/status').put(toggleUserStatus);
router.route('/users/:id').delete(deleteUser);
router.route('/stats').get(getDashboardStats);

export default router;