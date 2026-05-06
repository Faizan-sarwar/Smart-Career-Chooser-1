// backend/src/routes/communityRoutes.js
import express from 'express';
import {
  listEvents,
  toggleRsvp,
  listPosts,
  createPost,
  toggleLike,
  addComment
} from '../controllers/communityController.js';
import { fileReport } from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Events
router.get('/events', protect, listEvents);
router.post('/events/:id/rsvp', protect, toggleRsvp);

// Posts
router.get('/posts', protect, listPosts);
router.post('/posts', protect, createPost);
router.post('/posts/:id/like', protect, toggleLike);
router.post('/posts/:id/comment', protect, addComment);

// Report a post (any logged-in user can file)
router.post('/posts/:id/report', protect, (req, res, next) => {
  req.body.targetType = 'Post';
  req.body.targetId = req.params.id;
  return fileReport(req, res, next);
});

// Aliases
router.get('/feed', protect, listPosts);
router.post('/feed', protect, createPost);

export default router;