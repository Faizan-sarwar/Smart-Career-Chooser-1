import User from '../models/User.js';

export const getMentees = async (req, res, next) => {
  try {
    // Fetch all users with the role 'student' from MongoDB
    const students = await User.find({ role: 'student' }).select('-password');
    
    // Format for the mentor dashboard UI
    const formattedStudents = students.map(s => ({
      id: s._id,
      name: s.name,
      program: s.university || "Undeclared", // Uses the major they selected at registration
      progress: s.careerInterests?.length > 0 ? 45 : 10,
      status: "Active",
      lastActive: "Today"
    }));

    res.status(200).json(formattedStudents);
  } catch (error) {
    next(error);
  }
};