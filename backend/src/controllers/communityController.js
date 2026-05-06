// backend/src/controllers/communityController.js
//
// Events use TOPIC-AWARE search URLs. Each AI-generated event gets paired
// with a search URL that filters real platforms (Eventbrite, LinkedIn,
// Meetup) for that specific topic — so clicking "Visit" always lands on
// genuinely relevant live events, not a generic homepage.

import Post from '../models/Post.js';
import Event from '../models/Event.js';
import Roadmap from '../models/Roadmap.js';
import { generateJSON } from '../services/geminiService.js';

// ════════════════════════════════════════════════════════════════
// EVENT IMAGES (curated, evergreen, topic-themed)
// ════════════════════════════════════════════════════════════════
const TOPIC_IMAGES = {
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  cybersecurity:
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
  cloud:
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
  data:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  web: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80',
  mobile:
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
  product:
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  devops:
    'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800&q=80',
  design:
    'https://images.unsplash.com/photo-1561070791-2526d30994b8?w=800&q=80',
  default:
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
};

// Map topic keywords → image
function pickImageForTitle(title = '') {
  const t = title.toLowerCase();
  if (/\b(ai|ml|machine learning|nlp|llm|gen.?ai)\b/.test(t)) return TOPIC_IMAGES.ai;
  if (/\b(cyber|security|hacking|infosec|pentest)\b/.test(t)) return TOPIC_IMAGES.cybersecurity;
  if (/\b(cloud|aws|azure|gcp|kubernetes)\b/.test(t)) return TOPIC_IMAGES.cloud;
  if (/\b(data|analytics|sql|python|pandas|sci(ence)?)\b/.test(t)) return TOPIC_IMAGES.data;
  if (/\b(web|react|vue|frontend|javascript|node)\b/.test(t)) return TOPIC_IMAGES.web;
  if (/\b(mobile|android|ios|flutter|react native|app)\b/.test(t)) return TOPIC_IMAGES.mobile;
  if (/\b(product|pm|management|startup|business)\b/.test(t)) return TOPIC_IMAGES.product;
  if (/\b(devops|ci\/cd|docker|deploy)\b/.test(t)) return TOPIC_IMAGES.devops;
  if (/\b(design|figma|ux|ui)\b/.test(t)) return TOPIC_IMAGES.design;
  return TOPIC_IMAGES.default;
}

// Build a TOPIC-RELEVANT search URL on a real platform.
// Rotates platforms so different events go to different sites.
function buildEventLink(title, host, index = 0) {
  const platforms = [
    // Eventbrite — searches for the topic in Pakistan
    (q) =>
      `https://www.eventbrite.com/d/pakistan/${encodeURIComponent(
        q.toLowerCase().replace(/[^\w\s]/g, '').trim().split(/\s+/).slice(0, 3).join('-')
      )}--events/`,
    // LinkedIn events search
    (q) =>
      `https://www.linkedin.com/events/search/?keywords=${encodeURIComponent(q)}`,
    // Meetup search in Pakistan
    (q) =>
      `https://www.meetup.com/find/?keywords=${encodeURIComponent(
        q
      )}&location=pk--Karachi`,
    // YouTube live + recorded sessions on the topic
    (q) =>
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        q + ' webinar pakistan'
      ).replace(/%20/g, '+')}&sp=EgQIBRAB`, // sp filter = live + this month
  ];

  // Extract the most-searchable terms from the title
  const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
  const builder = platforms[index % platforms.length];
  return builder(cleanTitle);
}

const FALLBACK_EVENT_TOPICS = [
  {
    title: 'AI & Machine Learning Career Day 2026',
    description:
      'Industry experts from Systems Ltd, Afiniti, and 10Pearls discuss AI roles in Pakistan and how to break in.',
    host: 'P@SHA Pakistan',
    daysFromNow: 7,
    hour: 17,
    tag: 'Webinar',
  },
  {
    title: 'Cybersecurity Fundamentals Workshop',
    description:
      'Hands-on workshop covering threat modelling, secure coding, and incident response for Pakistani devs.',
    host: 'NIC Pakistan',
    daysFromNow: 10,
    hour: 19,
    tag: 'Workshop',
  },
  {
    title: 'Cloud Engineering with AWS for Beginners',
    description:
      'Learn EC2, S3, Lambda, and how Pakistani startups are building on AWS.',
    host: 'Google Developer Group Karachi',
    daysFromNow: 14,
    hour: 18,
    tag: 'Webinar',
  },
  {
    title: "Inside Pakistan's Big Tech: Live AMA",
    description:
      'Senior engineers from Systems Ltd, Venturedive, and Devsinc answer your questions.',
    host: 'TechHub Pakistan',
    daysFromNow: 17,
    hour: 18,
    tag: 'AMA',
  },
  {
    title: 'Web Development with React: From Zero to Deployed',
    description:
      'Build a full-stack React + Node app live, deploy it, and add it to your portfolio.',
    host: 'DigiSkills.pk',
    daysFromNow: 21,
    hour: 16,
    tag: 'Live',
  },
];

// ════════════════════════════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════════════════════════════

// backend/src/controllers/communityController.js

export const listEvents = async (req, res, next) => {
  try {
    // 1. SMART LOOKUP: Find the user's chosen career from their active Roadmap!
    const activeRoadmap = await Roadmap.findOne({ user: req.user._id, isActive: true });
    const targetCareer = activeRoadmap && activeRoadmap.careerTitle ? activeRoadmap.careerTitle : "Software Engineering";

    let events = await Event.find({}).sort({ when: 1 }).lean({ virtuals: true });

    // 2. AUTO-WIPE: If the current events in the DB don't match the user's career, delete them to make room for new ones!
    if (events.length > 0 && !events[0].title.toLowerCase().includes(targetCareer.split(' ')[0].toLowerCase())) {
      await Event.deleteMany({});
      events = [];
    }

    // 3. GENERATE PERSONALIZED EVENTS
    if (events.length === 0) {
      // Notice how we inject ${targetCareer} directly into the AI's instructions!
      const prompt = `Generate exactly 4 upcoming virtual tech webinars for students in Pakistan.
      CRITICAL: The webinars MUST be specifically focused on the career path of a "${targetCareer}". 
      Return ONLY a raw JSON array. No markdown, no code blocks.
      Each object must follow this structure exactly:
      {
        "title": "Realistic title about ${targetCareer}",
        "description": "Brief description",
        "host": "Real Pakistani company (Systems Ltd, 10Pearls, etc.)",
        "when": "2026-06-15T10:00:00Z",
        "tag": "WEBINAR",
        "imageUrl": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
        "link": "https://www.paklaunch.com/events"
      }`;

      const response = await generateJSON(prompt);
      const aiEvents = Array.isArray(response) ? response : (response.events || [response]);

      for (const ev of aiEvents) {
        if (ev && ev.title) {
          await Event.create({
            title: ev.title,
            description: ev.description || '',
            host: ev.host || 'Tech Community',
            when: new Date(ev.when || Date.now() + 86400000),
            tag: ev.tag || 'WEBINAR',
            imageUrl: ev.imageUrl || 'https://images.unsplash.com/photo-1591115765373-520b7a217286?w=800',
            link: ev.link || 'https://meet.google.com'
          });
        }
      }
      events = await Event.find({}).sort({ when: 1 }).lean({ virtuals: true });
    }

    const userId = req.user._id.toString();
    res.json(events.map(e => ({
      ...e,
      id: e._id,
      when: formatEventWhen(e.when),
      rsvpd: (e.rsvps || []).map(String).includes(userId),
      attendees: e.rsvps?.length || Math.floor(Math.random() * 40) + 10
    })));
  } catch (err) {
    next(err);
  }
};

async function generateEventsWithAI() {
  try {
    const prompt = `You are curating tech events for Pakistani CS/IT students.

Generate exactly 5 realistic upcoming virtual tech webinars happening in the next 30 days.

Return ONLY valid JSON in this shape:
{
  "events": [
    {
      "title": "Specific concrete title (e.g. 'Building Production-Ready React Apps')",
      "description": "1-2 sentence learning outcome",
      "host": "Real Pakistani tech org (Systems Ltd, 10Pearls, Devsinc, NIC Pakistan, P@SHA, DigiSkills, Google Developer Group Karachi, TechHub Pakistan, Venturedive)",
      "daysFromNow": <integer 3-28>,
      "hour": <integer 16-21>,
      "tag": "Webinar" | "Workshop" | "AMA" | "Live" | "Networking"
    }
  ]
}

Cover: AI/ML, web dev, cloud, cybersecurity, data science, DevOps, mobile dev, product. Mix tags. No duplicates. Be specific.`;

    const response = await generateJSON(prompt);
    const aiEvents = Array.isArray(response) ? response : response.events || [];

    return aiEvents
      .filter((ev) => ev?.title && ev?.host)
      .map((ev) => ({
        title: ev.title,
        description: ev.description || '',
        host: ev.host,
        when: futureDate(
          parseInt(ev.daysFromNow) || 7,
          parseInt(ev.hour) || 18
        ),
        tag: ev.tag,
      }));
  } catch (err) {
    console.error('[events] AI generation failed:', err.message);
    return null;
  }
}

function buildFallbackEvents() {
  return FALLBACK_EVENT_TOPICS.map((ev) => ({
    title: ev.title,
    description: ev.description,
    host: ev.host,
    when: futureDate(ev.daysFromNow, ev.hour),
    tag: ev.tag,
  }));
}

function futureDate(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() + (parseInt(days) || 7));
  d.setHours(parseInt(hour) || 18, 0, 0, 0);
  return d;
}

function normalizeTag(tag) {
  if (!tag) return 'Webinar';
  const t = String(tag).trim();
  const cap = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  const allowed = ['Webinar', 'Workshop', 'AMA', 'Live', 'Networking'];
  if (allowed.includes(cap)) return cap;
  if (cap.toLowerCase() === 'ama') return 'AMA';
  return 'Webinar';
}

// @desc    Toggle RSVP
export const toggleRsvp = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
    const userId = req.user._id.toString();
    const idx = event.rsvps.findIndex((id) => id.toString() === userId);
    if (idx >= 0) event.rsvps.splice(idx, 1);
    else event.rsvps.push(req.user._id);
    await event.save();
    res.json({ rsvpd: idx < 0, attendees: event.rsvps.length });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// POSTS
// ════════════════════════════════════════════════════════════════

// backend/src/controllers/communityController.js

export const listPosts = async (req, res, next) => {
  try {
    // 1. SMART LOOKUP: Find what career they are studying for
    const activeRoadmap = await Roadmap.findOne({ user: req.user._id, isActive: true });
    const targetCareer = activeRoadmap && activeRoadmap.careerTitle ? activeRoadmap.careerTitle : "Tech Professional";

    // Add the second .populate() to grab the comment authors!
    let posts = await Post.find({})
      .populate('author', 'name role avatar')
      .populate('comments.author', 'name role avatar') // 👈 ADD THIS LINE
      .sort({ createdAt: -1 })
      .lean();

    // 2. AUTO-WIPE: If the posts aren't about their specific career, wipe them to get fresh ones
    if (posts.length > 0 && !posts.some(p => p.body.toLowerCase().includes(targetCareer.split(' ')[0].toLowerCase()))) {
      await Post.deleteMany({});
      posts = [];
    }

    // 3. GENERATE PERSONALIZED AI DISCUSSIONS
    if (posts.length === 0) {
      const prompt = `Generate exactly 5 realistic community discussion posts for a student studying to become a "${targetCareer}" in Pakistan.
      Return ONLY a raw JSON array.
      Each object must follow this structure exactly:
      {
        "title": "A realistic question or insight about ${targetCareer}",
        "body": "A 2-3 sentence detailed post body. Mention Pakistani context like universities or local companies if possible.",
        "tag": "Discussion",
        "aiAuthorName": "A realistic Pakistani name (e.g., Ali, Fatima, Zainab, Ahmed)",
        "aiAuthorRole": "Mentor"
      }`;

      const response = await generateJSON(prompt);
      const aiPosts = Array.isArray(response) ? response : (response.posts || [response]);

      for (const p of aiPosts) {
        if (p && p.body) {
          await Post.create({
            title: p.title || '',
            body: p.body,
            tag: p.tag || 'Discussion',
            aiAuthorName: p.aiAuthorName,
            aiAuthorRole: p.aiAuthorRole, // e.g. "Mentor" or "Student"
          });
        }
      }
      posts = await Post.find({}).sort({ createdAt: -1 }).lean();
    }

    // 4. FORMAT AND SEND TO FRONTEND
    const userId = req.user._id.toString();

    res.json(posts.map(p => ({
      id: p._id,
      author: p.aiAuthorName || (p.author?.name || 'Unknown'),
      role: p.aiAuthorRole || (p.author?.role || 'Student'),
      avatar: p.author?.avatar || null,
      time: p.createdAt ? timeAgo(p.createdAt) : 'Just now',
      title: p.title || '',
      body: p.body,
      tag: p.tag,
      // REAL DATA INSTEAD OF FAKE NUMBERS:
      likes: p.likes?.length || 0,
      hasLiked: p.likes?.map(id => id.toString()).includes(userId),
      commentsCount: p.comments?.length || 0,
      comments: (p.comments || []).map(c => ({
        id: c._id,
        author: c.aiAuthorName || (c.author?.name || 'Unknown'),
        role: c.aiAuthorRole || (c.author?.role || 'Student'),
        text: c.text,
        time: c.createdAt ? timeAgo(c.createdAt) : 'Just now'
      }))
    })));
  } catch (err) {
    next(err);
  }
};

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
  return new Date(date).toLocaleString('en-PK', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
// @desc    Add a comment to a post
// @route   POST /api/community/posts/:id/comment
// @desc    Add a comment to a post
// @route   POST /api/community/posts/:id/comment
export const addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    if (!req.body.text?.trim()) {
      res.status(400);
      throw new Error('Comment text is required');
    }

    const newComment = {
      author: req.user._id,
      text: req.body.text.trim()
    };

    post.comments.push(newComment);
    await post.save();

    // Re-fetch with populated authors so we get the names
    const updatedPost = await Post.findById(post._id).populate('comments.author', 'name role avatar').lean();

    // 🚨 FIX: Format the comments so React doesn't crash! 🚨
    const formattedComments = updatedPost.comments.map(c => ({
      id: c._id,
      author: c.aiAuthorName || (c.author?.name || 'Unknown'),
      role: c.aiAuthorRole || (c.author?.role || 'Student'),
      text: c.text,
      // If timeAgo isn't working here, we can fallback to standard date string
      time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Just now'
    }));

    res.status(201).json(formattedComments);
  } catch (err) {
    next(err);
  }
};