// backend/src/controllers/passwordResetController.js
//
// Three endpoints implement the full forgot-password flow:
//
//   POST /api/auth/forgot-password    { email }
//        Generates token + OTP, hashes both, stores them, emails the user.
//
//   POST /api/auth/verify-otp         { email, otp }
//        Verifies the OTP; returns the reset token if correct.
//
//   POST /api/auth/reset-password     { token OR (email + otp), newPassword }
//        Sets the new password if either credential checks out.

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const OTP_EXPIRY_MINUTES = 15;
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds between resends
const MAX_OTP_ATTEMPTS = 5;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ════════════════════════════════════════════════════════════════
// 1) REQUEST RESET — email link + OTP
// ════════════════════════════════════════════════════════════════
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400);
      throw new Error('Email is required');
    }

    const cleanEmail = email.trim().toLowerCase();

    // No user enumeration — always respond success.
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Same response so attackers can't probe for emails
      return res.json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Cooldown — block rapid resends
    const recent = await PasswordReset.findOne({
      user: user._id,
      used: false,
    }).sort({ createdAt: -1 });

    if (recent && Date.now() - new Date(recent.createdAt).getTime() < RESEND_COOLDOWN_MS) {
      res.status(429);
      throw new Error('Please wait 30 seconds before requesting another reset email.');
    }

    // Invalidate any pending resets for this user
    await PasswordReset.updateMany(
      { user: user._id, used: false },
      { $set: { used: true } }
    );

    // Generate token (long random) + OTP (6 digits)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const rawOtp = String(crypto.randomInt(100000, 1000000));

    const tokenHash = await bcrypt.hash(rawToken, 10);
    const otpHash = await bcrypt.hash(rawOtp, 10);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await PasswordReset.create({
      user: user._id,
      tokenHash,
      otpHash,
      expiresAt,
      requestIp: req.ip,
    });

    // Build the link the user can click in the email
    const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;

    // Send the email (fire-and-forget, but log failures)
    try {
      await sendPasswordResetEmail({
        to: cleanEmail,
        name: user.name,
        resetLink,
        otp: rawOtp,
      });
    } catch (mailErr) {
      console.error('[forgotPassword] email send failed:', mailErr.message);
      // Don't surface the error to the user — keep the response consistent
    }

    res.json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// 2) VERIFY OTP — confirm the code before showing the new-password screen
// ════════════════════════════════════════════════════════════════
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Email and OTP are required');
    }

    if (!/^\d{6}$/.test(otp)) {
      res.status(400);
      throw new Error('OTP must be 6 digits');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired code');
    }

    const record = await PasswordReset.findOne({
      user: user._id,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      res.status(400);
      throw new Error('Invalid or expired code');
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      res.status(429);
      throw new Error('Too many attempts. Please request a new code.');
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      res.status(400);
      throw new Error(
        `Invalid code. ${MAX_OTP_ATTEMPTS - record.attempts} attempts remaining.`
      );
    }

    // OTP correct → return verified=true. The frontend will show the
    // new-password form and send the OTP again with the reset request.
    res.json({
      verified: true,
      email: user.email,
      message: 'Code verified. You can now set a new password.',
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// 3) RESET PASSWORD — accepts EITHER token OR (email + OTP)
// ════════════════════════════════════════════════════════════════
export const resetPassword = async (req, res, next) => {
  try {
    const { token, email, otp, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters');
    }

    // We need either (token+email) OR (email+otp)
    if (!email || (!token && !otp)) {
      res.status(400);
      throw new Error('Provide either a reset link token, or your email + OTP');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      res.status(400);
      throw new Error('Invalid reset request');
    }

    const record = await PasswordReset.findOne({
      user: user._id,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      res.status(400);
      throw new Error('Reset request expired or already used. Please request a new one.');
    }

    // Match either token or OTP
    let credentialMatched = false;

    if (token) {
      credentialMatched = await bcrypt.compare(token, record.tokenHash);
    }
    if (!credentialMatched && otp) {
      if (!/^\d{6}$/.test(otp)) {
        res.status(400);
        throw new Error('OTP must be 6 digits');
      }
      credentialMatched = await bcrypt.compare(otp, record.otpHash);
    }

    if (!credentialMatched) {
      record.attempts += 1;
      await record.save();
      res.status(400);
      throw new Error('Invalid reset credentials');
    }

    // Update password — Users model has a `pre('save')` hook that hashes,
    // so we assign raw newPassword and let the hook handle it.
    user.password = newPassword;
    await user.save();

    // Mark this reset record as used
    record.used = true;
    await record.save();

    // Invalidate any other pending records for this user
    await PasswordReset.updateMany(
      { user: user._id, used: false },
      { $set: { used: true } }
    );

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (err) {
    next(err);
  }
};