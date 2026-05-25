// backend/src/routes/messageRoutes.js
import express from 'express';
import {
    getContacts,
    getThread,
    sendMessage,
    markThreadRead,
    reactToMessage,
    editMessage,
    deleteMessage,
    getUnreadCount,
} from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { chatUpload } from '../middlewares/chatUploadMiddleware.js';

const router = express.Router();

router.get('/contacts', protect, getContacts);
router.get('/unread-count', protect, getUnreadCount);

// Per-message ops (must come before /:userId so msgId doesn't conflict)
router.put('/:msgId/edit', protect, editMessage);
router.delete('/:msgId/delete', protect, deleteMessage);
router.post('/:msgId/react', protect, reactToMessage);

// Thread ops
router.get('/:userId', protect, getThread);
router.post('/:userId', protect, chatUpload.single('media'), sendMessage);
router.put('/:userId/read', protect, markThreadRead);

export default router;