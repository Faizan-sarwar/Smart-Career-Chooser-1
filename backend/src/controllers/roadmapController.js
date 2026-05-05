export const getRoadmap = async (req, res, next) => {
  try {
    res.status(200).json([
      { id: "r1", name: "Programming Fundamentals", done: true, courses: [] },
      { id: "r2", name: "Frontend Development (React)", done: false, courses: [
          { title: "React for Beginners", provider: "Coursera", hours: 12 },
          { title: "Advanced Hooks", provider: "Udemy", hours: 5 }
      ]},
      { id: "r3", name: "Backend APIs (Node.js)", done: false, courses: [
          { title: "Express.js Masterclass", provider: "edX", hours: 20 }
      ]}
    ]);
  } catch (error) {
    next(error);
  }
};