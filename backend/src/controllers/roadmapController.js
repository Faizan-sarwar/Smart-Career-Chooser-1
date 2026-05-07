// backend/src/controllers/roadmapController.js

import Roadmap from '../models/Roadmap.js';
import Career from '../models/Career.js';
import User from '../models/User.js';
import Groq from "groq-sdk";

// POST /api/roadmap/generate
// Body: { careerId }
// Uses Groq AI to generate a highly specific, customized 12-month roadmap!
export const generateUserRoadmap = async (req, res, next) => {
  try {
    const { careerId } = req.body;
    if (!careerId) {
      return res.status(400).json({ message: 'careerId is required' });
    }

    const [user, career] = await Promise.all([
      User.findById(req.user._id).lean(),
      Career.findById(careerId).lean(),
    ]);

    if (!career) return res.status(404).json({ message: 'Career not found' });
    
    // Safely get user's first name so the AI doesn't say "Undefined"
    const userName = user.name ? user.name.split(' ')[0] : "Student";

    // Initialize Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // 🚨 THE MASTER PROMPT: Forces the AI to tailor everything to the specific career!
    const prompt = `
      You are an expert career coach. Create a highly specific, professional 12-month learning roadmap for the career: "${career.title}".
      The student's name is ${userName}.
      
      Return ONLY a valid JSON object matching this exact structure perfectly:
      {
        "summary": "A 2-sentence motivational summary directly addressing ${userName} by name and explicitly mentioning the ${career.title} career path.",
        "milestones": [
          {
            "name": "Exact Skill/Concept Name (e.g., 'Advanced Excel & Data Modeling')",
            "description": "What they will learn specifically for a ${career.title} role.",
            "phase": "0-3-months", 
            "courses": [
              { "title": "Course Name", "provider": "Platform (e.g. YouTube/Coursera)", "hours": 15, "isFree": true, "url": "" }
            ]
          }
        ]
      }
      
      CRITICAL RULES:
      1. Generate EXACTLY 8 milestones.
      2. Distribute them across these exact phase strings: "0-3-months", "3-6-months", "6-12-months", "12+ months".
      3. DO NOT use generic "Intro to Programming" unless it is strictly required for ${career.title}. Tailor EVERY single milestone to ${career.title}. (e.g. A Business Analyst needs SQL, Excel, Tableau, Requirements Gathering, not Python Web Development).
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const generated = JSON.parse(chatCompletion.choices[0].message.content);

    // Deactivate old roadmaps for this user+career, then create new
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
    });

    // Set as user's selected career
    await User.findByIdAndUpdate(req.user._id, { selectedCareer: career._id });

    res.status(201).json(roadmap);
  } catch (err) {
    next(err);
  }
};

// GET /api/roadmap
// Returns the user's active roadmap, or null if none yet.
export const getUserRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ user: req.user._id, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    if (!roadmap) return res.json(null);
    res.json(roadmap);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/roadmap/:roadmapId/milestones/:milestoneId
// Body: { done: true|false }
export const toggleMilestone = async (req, res, next) => {
  try {
    const { roadmapId, milestoneId } = req.params;
    const { done } = req.body;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, user: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });

    const milestone = roadmap.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    milestone.done = !!done;
    milestone.doneAt = done ? new Date() : null;
    await roadmap.save();

    res.json({ milestoneId, done: milestone.done });
  } catch (err) {
    next(err);
  }
};

// POST /api/roadmap/verify
// Body: { milestoneName, studentAnswer }
// AI Anti-Cheat Verification using Groq
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
        "passed": true, // or false
        "feedback": "1 short sentence explaining why they passed or failed."
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a JSON-only API. You output strict JSON." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const verification = JSON.parse(chatCompletion.choices[0].message.content);

    res.json(verification);
  } catch (error) {
    next(error);
  }
};