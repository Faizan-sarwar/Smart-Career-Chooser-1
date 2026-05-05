import express from 'express';
import { getMarketInsights } from '../controllers/marketController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/insights', protect, getMarketInsights);
export default router;