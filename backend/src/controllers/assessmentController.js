// backend/src/controllers/assessmentController.js

import Assessment from '../models/Assessment.js';
import AssessmentResult from '../models/AssessmentResult.js';
import User from '../models/User.js';
import Career from '../models/Career.js';
import { scoreAnswers } from '../services/scoringService.js';
import { generateRecommendations } from '../services/recommendationService.js';

// GET /api/assessment/questions
// Returns the active assessment definition (questions only, no scoring metadata exposed).
export const getActiveAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    if (!assessment) {
      return res.status(404).json({ message: 'No active assessment found. Run seeders.' });
    }

    // Strip dimension info from questions sent to client (don't reveal scoring)
    const sanitized = {
      version: assessment.version,
      title: assessment.title,
      description: assessment.description,
      questions: assessment.questions.map((q) => ({
        questionId: q.questionId,
        text: q.text,
        section: q.section,
        type: q.type,
        options: q.options,
        order: q.order,
      })),
    };

    res.json(sanitized);
  } catch (err) {
    next(err);
  }
};

// POST /api/assessment
// Body: { answers: [{ questionId, value }, ...] }
// Scores answers, saves result, triggers async recommendation generation.
export const submitAssessment = async (req, res, next) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'answers must be a non-empty array' });
    }

    const assessment = await Assessment.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    if (!assessment) {
      return res.status(404).json({ message: 'No active assessment to submit against.' });
    }

    // Validate every answer references a real question
    const validQids = new Set(assessment.questions.map((q) => q.questionId));
    const filtered = answers.filter(
      (a) => validQids.has(a.questionId) && Number.isFinite(a.value)
    );

    if (filtered.length === 0) {
      return res.status(400).json({ message: 'No valid answers in submission.' });
    }

    // Score
    const scored = scoreAnswers(assessment, filtered);

    // Persist result
    const result = await AssessmentResult.create({
      user: req.user._id,
      assessmentVersion: assessment.version,
      answers: filtered,
      ...scored,
    });

    // Update user pointer
    await User.findByIdAndUpdate(req.user._id, { latestAssessmentResult: result._id });

    res.status(201).json({
      message: 'Assessment submitted and scored.',
      resultId: result._id,
      hollandCode: scored.hollandCode,
      riasecScores: scored.riasecScores,
      skillScores: scored.skillScores,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/assessment/recommendations
// Returns cached recommendations or generates fresh ones via LLM.
// Query: ?refresh=true forces regeneration.
export const getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user || !user.latestAssessmentResult) {
      return res
        .status(404)
        .json({ message: 'Complete the assessment first to see recommendations.' });
    }

    const result = await AssessmentResult.findById(user.latestAssessmentResult);
    if (!result) {
      return res.status(404).json({ message: 'Assessment result not found.' });
    }

    const refresh = req.query.refresh === 'true';
    const cacheAge = result.cachedRecommendations?.generatedAt
      ? Date.now() - new Date(result.cachedRecommendations.generatedAt).getTime()
      : Infinity;
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

    let careers;
    if (!refresh && result.cachedRecommendations?.careers?.length && cacheAge < CACHE_TTL_MS) {
      careers = result.cachedRecommendations.careers;
    } else {
      careers = await generateRecommendations({
        user,
        scores: {
          hollandCode: result.hollandCode,
          riasecScores: result.riasecScores,
          skillScores: result.skillScores,
          interestAreas: result.interestAreas,
        },
      });
      result.cachedRecommendations = { generatedAt: new Date(), careers };
      await result.save();
    }

    // Hydrate full career details for the frontend
    const careerIds = careers.map((c) => c.careerId).filter(Boolean);
    const fullCareers = await Career.find({ _id: { $in: careerIds } }).lean();
    const byId = new Map(fullCareers.map((c) => [String(c._id), c]));

    const enriched = careers.map((rec) => {
      const full = byId.get(String(rec.careerId));
      return {
        id: rec.careerId,
        title: rec.title,
        match: rec.matchScore,
        reasoning: rec.reasoning,
        strengthsMatch: rec.strengthsMatch,
        gapsToAddress: rec.gapsToAddress,
        cluster: full?.cluster,
        salary: full
          ? `PKR ${full.salaryPKR.entry.toLocaleString()} – ${full.salaryPKR.senior.toLocaleString()}/mo`
          : null,
        growth: full?.growthOutlook || null,
        demand: full?.demand,
        skills: full?.coreSkills?.slice(0, 6) || [],
        educationPaths: full?.educationPaths || [],
      };
    });

    res.json({
      generatedAt: result.cachedRecommendations.generatedAt,
      hollandCode: result.hollandCode,
      careers: enriched,
      skillStrength: Object.entries(result.skillScores).map(([skill, value]) => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        value,
      })),
      riasecScores: result.riasecScores,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/assessment/history
export const getAssessmentHistory = async (req, res, next) => {
  try {
    const history = await AssessmentResult.find({ user: req.user._id })
      .select('hollandCode riasecScores skillScores createdAt assessmentVersion')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(history);
  } catch (err) {
    next(err);
  }
};