// backend/src/routes/messageRoutes.js
import express from 'express';
import {
  getContacts,
  getThread,
  sendMessage,
  getUnreadCount,
} from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/contacts', protect, getContacts);
router.get('/unread-count', protect, getUnreadCount);
// Dynamic routes must go last
router.get('/:userId', protect, getThread);
router.post('/:userId', protect, sendMessage);

export default router;