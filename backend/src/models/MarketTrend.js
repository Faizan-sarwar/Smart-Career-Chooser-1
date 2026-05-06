// backend/src/models/MarketTrend.js
import mongoose from 'mongoose';

// One document holds a snapshot of the labor market — overwrite via seeder/admin
const marketTrendSchema = new mongoose.Schema(
  {
    snapshotDate: { type: Date, default: Date.now },

    // Top-line stats
    stats: {
      openRoles: String,        // "12.4K"
      avgSalary: String,        // "PKR 1.2M"
      remoteShare: String,      // "38%"
      topGrowthField: String,   // "AI Engineering"
    },

    // Scrolling ticker text
    ticker: [{ type: String }],

    // Salary trends — yearly per career cluster (PKR LPA)
    salaryYears: [
      {
        year: String,
        Software: Number,
        Data: Number,
        Design: Number,
        Cyber: Number,
        Cloud: Number,
      },
    ],

    // Top in-demand skills bar chart
    topSkills: [
      {
        skill: String,
        demand: Number, // 0-100
      },
    ],

    // Trending careers list
    trendingCareers: [
      {
        title: String,
        growth: String,
        color: String,
      },
    ],
  },
  { timestamps: true }
);

const MarketTrend = mongoose.model('MarketTrend', marketTrendSchema);
export default MarketTrend;