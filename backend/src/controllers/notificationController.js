// backend/src/controllers/notificationController.js

// Using an in-memory mock for FYP speed, or you can create a Notification model later
let globalNotifications = []; 

export const getNotifications = async (req, res, next) => {
  try {
    // Generate some starter notifications if none exist for this user
    const userNotifs = globalNotifications.filter(n => n.user.toString() === req.user._id.toString());
    
    if (userNotifs.length === 0) {
      const starters = [
        { _id: Date.now().toString() + '1', user: req.user._id, type: 'match', title: 'Welcome to Smart Career Chooser!', body: 'Take your RIASEC assessment to unlock your roadmap.', unread: true, createdAt: new Date() },
        { _id: Date.now().toString() + '2', user: req.user._id, type: 'event', title: 'New tech event in Pakistan', body: 'A new DevFest event matches your skill roadmap.', unread: true, createdAt: new Date(Date.now() - 86400000) }
      ];
      globalNotifications = [...globalNotifications, ...starters];
      return res.json(starters);
    }

    res.json(userNotifs.sort((a, b) => b.createdAt - a.createdAt));
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    globalNotifications = globalNotifications.map(n => 
      n.user.toString() === req.user._id.toString() ? { ...n, unread: false } : n
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    next(error);
  }
};

export const toggleReadStatus = async (req, res, next) => {
  try {
    globalNotifications = globalNotifications.map(n => 
      n._id === req.params.id && n.user.toString() === req.user._id.toString() 
        ? { ...n, unread: req.body.unread } 
        : n
    );
    res.json({ message: 'Status updated' });
  } catch (error) {
    next(error);
  }
};