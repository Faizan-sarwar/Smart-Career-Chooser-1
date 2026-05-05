// backend/src/controllers/roadmapController.js

import Roadmap from '../models/Roadmap.js';
import Career from '../models/Career.js';
import User from '../models/User.js';
import AssessmentResult from '../models/AssessmentResult.js';
import { generateRoadmap } from '../services/roadmapService.js';

// POST /api/roadmap/generate
// Body: { careerId }
// Generates and saves a personalized roadmap for the given career.
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
    if (!user.latestAssessmentResult) {
      return res.status(400).json({ message: 'Complete the assessment first.' });
    }

    const result = await AssessmentResult.findById(user.latestAssessmentResult).lean();
    if (!result) return res.status(404).json({ message: 'Assessment result missing.' });

    const generated = await generateRoadmap({
      user,
      scores: {
        riasecScores: result.riasecScores,
        skillScores: result.skillScores,
        hollandCode: result.hollandCode,
        interestAreas: result.interestAreas,
      },
      career,
    });

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