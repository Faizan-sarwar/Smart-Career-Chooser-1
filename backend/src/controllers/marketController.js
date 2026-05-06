// backend/src/controllers/marketController.js
import MarketTrend from '../models/MarketTrend.js';

// @desc    Get the latest market insights snapshot
// @route   GET /api/market/insights
// @access  Private
export const getInsights = async (req, res, next) => {
  try {
    // Always grab the most recent snapshot
    const trend = await MarketTrend.findOne({})
      .sort({ snapshotDate: -1 })
      .lean();

    if (!trend) {
      res.status(404);
      throw new Error(
        'No market data available. Run `npm run seed` to populate.'
      );
    }

    res.json({
      snapshotDate: trend.snapshotDate,
      stats: trend.stats,
      ticker: trend.ticker,
      salaryYears: trend.salaryYears,
      topSkills: trend.topSkills,
      trendingCareers: trend.trendingCareers,
    });
  } catch (err) {
    next(err);
  }
};