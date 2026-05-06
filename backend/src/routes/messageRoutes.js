// backend/src/routes/messageRoutes.js
import express from 'express';
import {
    getPresidentThread,
    sendToPresident,
} from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/president', protect, getPresidentThread);
router.post('/president', protect, sendToPresident);

export default router;