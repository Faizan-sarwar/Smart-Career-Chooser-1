// backend/src/routes/messageRoutes.js
import express from 'express';
import {
    getContacts,
    getThread,
    sendMessage,
    getUnreadCount,
    editMessage, // 🚨 Now properly exported
    deleteMessage // 🚨 Now properly exported
} from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

// Fallback in case chatUploadMiddleware isn't available yet
import multer from 'multer';
const upload = multer({ dest: 'uploads/chat/' });

const router = express.Router();

// General Routes
router.get('/contacts', protect, getContacts);
router.get('/unread-count', protect, getUnreadCount);

// Advanced Chat Features (Instagram Style)
router.put('/:msgId/edit', protect, editMessage);
router.delete('/:msgId/delete', protect, deleteMessage);

// Thread Routes
router.get('/:userId', protect, getThread);
router.post('/:userId', protect, upload.single('media'), sendMessage);

export default router;