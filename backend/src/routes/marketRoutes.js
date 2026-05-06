// backend/src/routes/marketRoutes.js
import express from 'express';
import { getInsights } from '../controllers/marketController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/insights', protect, getInsights);

export default router;