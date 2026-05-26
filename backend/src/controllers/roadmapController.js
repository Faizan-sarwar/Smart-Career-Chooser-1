// backend/src/controllers/roadmapController.js
//
// FIXED — the controller was calling Groq directly and trusting whatever
// URLs the AI returned (which were usually fake course slugs that 404).
// Now it delegates roadmap generation to `roadmapService.generateRoadmap()`
// which post-processes every course URL through `buildFallbackUrl()` so
// every link always lands on a real, working platform search page.

import Roadmap from '../models/Roadmap.js';
import Career from '../models/Career.js';
import User from '../models/User.js';
import AssessmentResult from '../models/AssessmentResult.js';
import Groq from 'groq-sdk';
import { generateRoadmap } from '../services/roadmapService.js';

// POST /api/roadmap/generate
// Body: { careerId }
export const generateUserRoadmap = async (req, res, next) => {
  try {
    const { careerId } = req.body;
    if (!careerId) {
      return res.status(400).json({ message: 'careerId is required' });
    }

    const [user, career, assessment] = await Promise.all([
      User.findById(req.user._id).lean(),
      Career.findById(careerId).lean(),
      AssessmentResult.findOne({ user: req.user._id })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!career) return res.status(404).json({ message: 'Career not found' });

    const studentName = user.name ? user.name.split(' ')[0] : 'Student';

    // 🚨 THE FIX: delegate to the service which enforces URL normalization
    const generated = await generateRoadmap({
      studentName,
      careerTitle: career.title,
      hollandCode: assessment?.hollandCode || null,
      skillStrength: assessment?.skillStrength || [],
    });

    // Deactivate old roadmaps for this user+career
    await Roadmap.updateMany(
      { user: req.user._id, career: career._id, isActive: true },
      { isActive: false }
    );

    const roadmap = await Roadmap.create({
      user: req.user._id,
      career: career._id,
      careerTitle: career.title,
      summary: generated.summary,
      milestones: generated.milestones,
      generatedBy: generated.promptVersion || 'groq-llama-3.3-70b',
    });

    await User.findByIdAndUpdate(req.user._id, { selectedCareer: career._id });

    res.status(201).json(roadmap);
  } catch (err) {
    next(err);
  }
};

// GET /api/roadmap
export const getUserRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      user: req.user._id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!roadmap) return res.json(null);
    res.json(roadmap);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/roadmap/:roadmapId/milestones/:milestoneId
export const toggleMilestone = async (req, res, next) => {
  try {
    const { roadmapId, milestoneId } = req.params;
    const { done } = req.body;

    const roadmap = await Roadmap.findOne({
      _id: roadmapId,
      user: req.user._id,
    });
    if (!roadmap)
      return res.status(404).json({ message: 'Roadmap not found' });

    const milestone = roadmap.milestones.id(milestoneId);
    if (!milestone)
      return res.status(404).json({ message: 'Milestone not found' });

    milestone.done = !!done;
    milestone.doneAt = done ? new Date() : null;
    await roadmap.save();

    res.json({ milestoneId, done: milestone.done });
  } catch (err) {
    next(err);
  }
};

// POST /api/roadmap/verify
// (Unchanged — anti-cheat verification via Groq)
export const verifyMilestone = async (req, res, next) => {
  try {
    const { milestoneName, studentAnswer } = req.body;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
      A student is trying to pass the learning milestone: "${milestoneName}".
      They submitted this proof of knowledge: "${studentAnswer}".
      
      Does this answer prove they actually understand the core, basic concepts of ${milestoneName}? 
      Be encouraging but strict. If it is gibberish (e.g. 'asdf'), too short, or completely wrong, fail them.
      
      Return ONLY a valid JSON object matching this exact structure perfectly:
      {
        "passed": true,
        "feedback": "1 short sentence explaining why they passed or failed."
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a JSON-only API. You output strict JSON.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const verification = JSON.parse(chatCompletion.choices[0].message.content);
    res.json(verification);
  } catch (error) {
    next(error);
  }
};