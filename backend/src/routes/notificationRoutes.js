// backend/src/routes/notificationRoutes.js
import express from 'express';
import { getNotifications, markAllAsRead, toggleReadStatus } from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, toggleReadStatus);

export default router;