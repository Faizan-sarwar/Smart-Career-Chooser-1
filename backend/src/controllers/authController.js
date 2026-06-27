import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js"; // Ensure you created this utility

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      university,
      expertise,
      careerInterests,
      avatar,
    } = req.body;
    const requestedRole = role.toLowerCase();

    // 1. Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    // 🚨 2. CRITICAL SECURITY LOCK: Prevent unauthorized Admin creation 🚨
    if (requestedRole === "admin") {
      // Check if ANY admin already exists in the entire database
      const existingAdmin = await User.findOne({ role: "admin" });

      if (existingAdmin) {
        // If an admin exists, block this request completely with a 403 Forbidden status
        res.status(403);
        throw new Error(
          "Access Denied: An administrator already exists. New admins must be created internally.",
        );
      }
    }

    // 3. Get the CV file path (if uploaded)
    const cvPath = req.file ? req.file.path.replace(/\\/g, "/") : null;

    // 4. Create the user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: requestedRole,
      avatar: avatar || "👋",
      university: requestedRole === "student" ? university : undefined,
      expertise: requestedRole === "mentor" ? expertise : undefined,
      careerInterests: careerInterests ? JSON.parse(careerInterests) : [],
      cv: requestedRole === "student" ? cvPath : undefined,
    });

    // 5. Send success response
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
      throw new Error("Invalid user data");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide both email and password");
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
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
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to user email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Standard security practice: return success even if user isn't found to prevent email enumeration
      return res
        .status(200)
        .json({ message: "If an account exists, an email was sent." });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP and expiration (15 minutes from now)
    user.resetPasswordOtp = otp;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    // Save without validating the whole model
    await user.save({ validateBeforeSave: false });

    // Send the email
    const message = `Your password reset code is: ${otp}\n\nThis code is valid for 15 minutes. If you did not request this, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Code - Smart Career Chooser",
        message: message,
      });

      res.status(200).json({ message: "Check your email for the reset code." });
    } catch (error) {
      // If email fails, clear the OTP fields so they aren't stuck in the DB
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500);
      throw new Error("Email could not be sent. Please try again later.");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify the 6-digit OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Find user with matching email, OTP, AND where expiration is in the future
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOtp: otp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired code.");
    }

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password after OTP verification
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Verify OTP again just in case someone hits this endpoint directly
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOtp: otp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error(
        "Invalid or expired reset session. Please request a new code.",
      );
    }

    // Set new password (your pre-save hook in User.js will automatically hash it)
    user.password = newPassword;

    // Clear the OTP fields so they can't be reused
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    next(error);
  }
};
