// Simple in-memory storage for FYP demo
let messages = [];

export const getMessagesWithPresident = async (req, res, next) => {
  try {
    // Filter messages belonging to the logged-in user
    const userMessages = messages.filter(m => m.studentId === req.user.id.toString());
    res.status(200).json(userMessages);
  } catch (error) {
    next(error);
  }
};

export const sendMessageToPresident = async (req, res, next) => {
  try {
    const { text } = req.body;
    
    const newMessage = {
      _id: Date.now().toString(),
      studentId: req.user.id.toString(),
      from: "me",
      text: text,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    
    messages.push(newMessage);

    // FYP DEMO TRICK: Auto-reply from the President after 2 seconds
    setTimeout(() => {
      messages.push({
        _id: (Date.now() + 1).toString(),
        studentId: req.user.id.toString(),
        from: "president",
        text: "Thank you for reaching out. I will review this and get back to you.",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
    }, 2000);

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};