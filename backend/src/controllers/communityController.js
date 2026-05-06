// backend/src/controllers/communityController.js
import Post from '../models/Post.js';
import Event from '../models/Event.js';

// ════════════════════════════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════════════════════════════

// @desc    List upcoming events
// @route   GET /api/community/events
// @access  Private
export const listEvents = async (req, res, next) => {
  try {
    const events = await Event.find({})
      .sort({ when: 1 })
      .lean({ virtuals: true });

    const userId = req.user._id.toString();

    res.json(
      events.map((e) => ({
        id: e._id,
        title: e.title,
        description: e.description,
        host: e.host,
        when: formatEventWhen(e.when),
        whenISO: e.when,
        attendees: e.rsvps?.length || 0,
        tag: e.tag,
        coverColor: e.coverColor,
        rsvpd: (e.rsvps || []).map(String).includes(userId),
      }))
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle RSVP on an event
// @route   POST /api/community/events/:id/rsvp
// @access  Private
export const toggleRsvp = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    const userId = req.user._id.toString();
    const idx = event.rsvps.findIndex((id) => id.toString() === userId);

    if (idx >= 0) {
      event.rsvps.splice(idx, 1);
    } else {
      event.rsvps.push(req.user._id);
    }
    await event.save();

    res.json({
      rsvpd: idx < 0,
      attendees: event.rsvps.length,
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// POSTS (community feed + discussion forum)
// ════════════════════════════════════════════════════════════════

// @desc    List feed posts (newest first)
// @route   GET /api/community/posts
// @access  Private
export const listPosts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const posts = await Post.find({})
      .populate('author', 'name role avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(posts.map(formatPost));
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new post
// @route   POST /api/community/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const { title, body, tag } = req.body;
    if (!body?.trim()) {
      res.status(400);
      throw new Error('Post body is required');
    }

    const post = await Post.create({
      author: req.user._id,
      title: title || '',
      body: body.trim(),
      tag: tag || 'Discussion',
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'name role avatar')
      .lean();

    res.status(201).json(formatPost(populated));
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle like on a post
// @route   POST /api/community/posts/:id/like
// @access  Private
export const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const userId = req.user._id.toString();
    const idx = post.likes.findIndex((id) => id.toString() === userId);

    if (idx >= 0) post.likes.splice(idx, 1);
    else post.likes.push(req.user._id);

    await post.save();
    res.json({ liked: idx < 0, likes: post.likes.length });
  } catch (err) {
    next(err);
  }
};

// ── Helpers ────────────────────────────────────────────────────────

function formatPost(p) {
  return {
    id: p._id,
    author: p.author?.name || 'Unknown',
    role: p.author?.role || 'Student',
    avatar: p.author?.avatar || null,
    time: timeAgo(p.createdAt),
    title: p.title || '',
    body: p.body,
    tag: p.tag,
    likes: p.likes?.length || 0,
    comments: p.comments?.length || 0,
  };
}

function timeAgo(date) {
  if (!date) return 'just now';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function formatEventWhen(date) {
  const d = new Date(date);
  return d.toLocaleString('en-PK', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}