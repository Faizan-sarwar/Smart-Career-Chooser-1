// backend/src/routes/notificationRoutes.js
import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  toggleReadStatus,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, toggleReadStatus);
router.delete('/:id', protect, deleteNotification);

export default router;