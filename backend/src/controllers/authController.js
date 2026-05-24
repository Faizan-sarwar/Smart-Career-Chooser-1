import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, university, expertise, careerInterests, avatar } = req.body;
    const requestedRole = role.toLowerCase();

    // 1. Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // 🚨 2. CRITICAL SECURITY LOCK: Prevent unauthorized Admin creation 🚨
    if (requestedRole === 'admin') {
      // Check if ANY admin already exists in the entire database
      const existingAdmin = await User.findOne({ role: 'admin' });

      if (existingAdmin) {
        // If an admin exists, block this request completely with a 403 Forbidden status
        res.status(403);
        throw new Error('Access Denied: An administrator already exists. New admins must be created internally.');
      }
    }

    // 3. Get the CV file path (if uploaded)
    const cvPath = req.file ? req.file.path.replace(/\\/g, '/') : null;

    // 4. Create the user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: requestedRole,
      avatar: avatar || '👋',
      university: requestedRole === 'student' ? university : undefined,
      expertise: requestedRole === 'mentor' ? expertise : undefined,
      careerInterests: careerInterests ? JSON.parse(careerInterests) : [],
      cv: requestedRole === 'student' ? cvPath : undefined
    });

    // 5. Send success response
    if (user) {
      res.status(201).json({
        _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400); throw new Error('Invalid user data');
    }
  } catch (error) { next(error); }
};

export const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400); throw new Error('Please provide both email and password'); }

    const user = await User.findOne({ email }).select('+password');
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401); throw new Error('Invalid email or password');
    }
  } catch (error) { next(error); }
};