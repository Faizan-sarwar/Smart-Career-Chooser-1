import express from 'express';
import { getFeed, createPost } from '../controllers/communityController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.route('/feed').get(protect, getFeed).post(protect, createPost);
export default router;