// backend/src/routes/communityRoutes.js
import express from 'express';
import {
  listEvents,
  toggleRsvp,
  listPosts,
  createPost,
  toggleLike,
} from '../controllers/communityController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Events
router.get('/events', protect, listEvents);
router.post('/events/:id/rsvp', protect, toggleRsvp);

// Posts
router.get('/posts', protect, listPosts);
router.post('/posts', protect, createPost);
router.post('/posts/:id/like', protect, toggleLike);

// Aliases the existing frontend may call
router.get('/feed', protect, listPosts);
router.post('/feed', protect, createPost);

export default router;