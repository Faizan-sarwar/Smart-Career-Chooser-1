import express from 'express';
// 🚨 FIX: Changed 'getInsights' to 'getMarketInsights' to match the new controller
import { getMarketInsights } from '../controllers/marketController.js';
import { protect } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

// Route to fetch the live Groq AI data
router.get('/insights', protect, getMarketInsights);

export default router;