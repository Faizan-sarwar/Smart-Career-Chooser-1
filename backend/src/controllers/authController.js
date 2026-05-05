// src/controllers/authController.js
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, university, careerInterests, avatar } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // 2. Create the user
    const user = await User.create({
      name,
      email,
      password,
      role: role.toLowerCase(), // Ensures 'Admin' becomes 'admin'
      avatar: avatar || '👋',
      // Safely handle role-specific data:
      university: role === 'student' ? university : undefined,
      expertise: role === 'mentor' ? university : undefined, // Reusing the frontend variable
      careerInterests: careerInterests || [] // If empty, save an empty array, not undefined
    });

    // 3. Send success response with token
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error); // Passes error to your global error handler in server.js
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email and explicitly select the password field
    const user = await User.findOne({ email }).select('+password');

    // 2. Check if user exists AND password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};