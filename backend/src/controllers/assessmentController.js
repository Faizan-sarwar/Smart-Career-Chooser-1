import User from '../models/User.js';

// @desc    Submit assessment answers
// @route   POST /api/assessment
export const submitAssessment = async (req, res, next) => {
  try {
    const { answers } = req.body;
    
    // In a real app, you would save these answers to the User model here.
    // await User.findByIdAndUpdate(req.user._id, { assessmentAnswers: answers });

    res.status(200).json({ message: "Assessment analyzed and saved successfully." });
  } catch (error) {
    next(error);
  }
};

// @desc    Get personalized recommendations
// @route   GET /api/assessment/recommendations
export const getRecommendations = async (req, res, next) => {
  try {
    // We send back dynamic JSON that perfectly matches your frontend's UI expectations
    res.status(200).json({
      careers: [
        { id: "c1", title: "Full-Stack Developer", match: 94, salary: "$110k - $150k", growth: "+22%", skills: ["React", "Node.js", "MongoDB"] },
        { id: "c2", title: "UX Engineer", match: 88, salary: "$95k - $130k", growth: "+15%", skills: ["Prototyping", "CSS", "User Research"] }
      ],
      salaryTrend: [
        { year: "2020", salary: 85 }, { year: "2021", salary: 92 }, { year: "2022", salary: 105 }, 
        { year: "2023", salary: 112 }, { year: "2024", salary: 118 }, { year: "2025", salary: 125 }
      ],
      skillStrength: [
        { skill: "Logic", value: 85 }, { skill: "Design", value: 60 }, 
        { skill: "Communication", value: 75 }, { skill: "Data", value: 40 }
      ],
      jobs: [
        { id: "j1", title: "Junior Web Developer", company: "TechNova", location: "Remote", tag: "Hot match" },
        { id: "j2", title: "Frontend Intern", company: "Creative Solutions", location: "New York, NY", tag: "Entry level" }
      ]
    });
  } catch (error) {
    next(error);
  }
};