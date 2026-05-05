// backend/src/controllers/userController.js
import User from '../models/User.js';

export const getStudentDashboard = async (req, res, next) => {
  try {
    // req.user._id comes from your protect middleware!
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Construct dynamic data based on the user's database record
    const dashboardData = {
      assessmentProgress: user.careerInterests?.length > 0 ? 50 : 10, 
      stats: {
        match: 87,
        courses: 2,
        growth: "+12%"
      },
      skills: [
        { name: "Critical thinking", value: 78 },
        // Dynamically insert their university major as a skill!
        { name: user.university || "Core Subject", value: 64 }, 
        { name: "Communication", value: 52 }
      ],
      milestones: [
        { title: "Joined Career Chooser", meta: "Account Created", done: true },
        { title: "Selected Interests", meta: user.careerInterests?.join(', ') || "None yet", done: true },
        { title: "Career assessment", meta: "In progress", done: false },
      ],
      notifications: [
        { color: "#52a447", text: `Welcome to the platform, ${user.name}!`, time: "Just now" }
      ]
    };

    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
};