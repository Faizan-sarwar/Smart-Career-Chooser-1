import express from 'express';
import { getMessagesWithPresident, sendMessageToPresident } from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.route('/president').get(protect, getMessagesWithPresident).post(protect, sendMessageToPresident);
export default router;