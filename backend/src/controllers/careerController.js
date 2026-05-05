// backend/src/controllers/careerController.js

import Career from '../models/Career.js';

// GET /api/careers?cluster=technology&demand=high&limit=20
export const listCareers = async (req, res, next) => {
  try {
    const { cluster, demand, search } = req.query;
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));

    const filter = { isActive: true };
    if (cluster) filter.cluster = cluster;
    if (demand) filter.demand = demand;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const careers = await Career.find(filter)
      .sort({ demand: -1, title: 1 })
      .limit(limit)
      .lean();

    res.json(careers);
  } catch (err) {
    next(err);
  }
};

// GET /api/careers/:slug
export const getCareerBySlug = async (req, res, next) => {
  try {
    const career = await Career.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!career) return res.status(404).json({ message: 'Career not found' });
    res.json(career);
  } catch (err) {
    next(err);
  }
};