export const getMarketInsights = async (req, res, next) => {
  try {
    // For an FYP, this realistic data is served dynamically from your backend.
    // Later, you could move this into a MongoDB 'MarketData' collection.
    const marketData = {
      ticker: ["Software Engineer +14%", "Data Analyst +22%", "UX Designer +8%", "Product Manager +11%"],
      stats: { openRoles: "48,210", avgSalary: "$118k", remoteShare: "41%", topGrowthField: "AI" },
      salaryYears: [
        { year: "2020", Software: 85, Data: 78, Design: 70, Cyber: 90, Cloud: 95 },
        { year: "2021", Software: 92, Data: 85, Design: 73, Cyber: 98, Cloud: 105 },
        { year: "2022", Software: 105, Data: 98, Design: 80, Cyber: 110, Cloud: 120 },
        { year: "2023", Software: 112, Data: 105, Design: 85, Cyber: 115, Cloud: 128 },
        { year: "2024", Software: 118, Data: 115, Design: 90, Cyber: 122, Cloud: 135 },
        { year: "2025", Software: 125, Data: 125, Design: 95, Cyber: 130, Cloud: 145 }
      ],
      topSkills: [
        { skill: "React/Node", demand: 95 },
        { skill: "Python", demand: 88 },
        { skill: "Cloud (AWS)", demand: 82 },
        { skill: "UI/UX", demand: 75 }
      ],
      trendingCareers: [
        { title: "AI Prompt Engineer", growth: "+400%", color: "#7c3aed" },
        { title: "Cloud Architect", growth: "+45%", color: "#0891b2" },
        { title: "Cybersecurity Analyst", growth: "+32%", color: "#dc2626" }
      ]
    };
    res.status(200).json(marketData);
  } catch (error) {
    next(error);
  }
};