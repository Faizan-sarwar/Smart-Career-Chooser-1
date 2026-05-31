// backend/src/controllers/googleAuthController.js
//
// FIXED — the previous version called `verifyIdToken()` on what the frontend
// sends (an `access_token` from `useGoogleLogin`'s implicit flow). Those
// two are different things, and `verifyIdToken` would fail silently for
// access tokens.
//
// This version:
//   1. Calls Google's userinfo endpoint with the access_token to fetch
//      the user's profile (more reliable than trying to verify an
//      access token as an ID token)
//   2. Securely creates or signs in the user
//   3. Returns the same auth payload as /auth/login

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc    Auth user with Google (Login or Signup)
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  try {
    const { token, role } = req.body;

    if (!token) {
      res.status(400);
      throw new Error('No Google token provided');
    }

    console.log('[googleAuth] Verifying access token with Google…');

    // Use the access token to fetch user profile from Google's userinfo endpoint.
    // This is what Google recommends for the implicit flow that @react-oauth/google
    // uses with `useGoogleLogin`.
    const userinfoRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!userinfoRes.ok) {
      console.error('[googleAuth] Google rejected the access token:', userinfoRes.status);
      res.status(401);
      throw new Error('Google access token is invalid or expired');
    }

    const profile = await userinfoRes.json();
    const { email, name, picture, sub: googleId } = profile;

    if (!email || !googleId) {
      console.error('[googleAuth] Userinfo missing email or sub:', profile);
      res.status(400);
      throw new Error('Google did not return a valid email');
    }

    console.log(`[googleAuth] ✓ Verified Google user: ${email}`);

    // ── Look up existing user by email ────────────────────────
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Existing account — log them in regardless of how they originally signed up
      if (user.status === 'disabled') {
        res.status(403);
        throw new Error('This account has been disabled.');
      }

      // If they originally signed up with email/password and now log in via
      // Google, attach their googleId so we can recognize them faster next time
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (!user.authProvider) {
        user.authProvider = 'google';
        needsSave = true;
      }
      // Update avatar from Google if they don't have one yet
      if (!user.avatar && picture) {
        user.avatar = picture;
        needsSave = true;
      }
      if (needsSave) await user.save();

      console.log(`[googleAuth] ✓ Existing user logged in: ${user.name}`);
    } else {
      // ── New user — create the account ─────────────────────────
      // User model requires a password — generate a random one they'll never use
      const randomPassword = crypto.randomBytes(24).toString('hex') + 'A1!';

      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: randomPassword,
        role: role || 'student',
        avatar: picture || '',
        authProvider: 'google',
        googleId,
      });

      console.log(`[googleAuth] ✓ New user created via Google: ${user.name}`);
    }

    // Same auth payload shape as /auth/login — frontend handles both identically
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      university: user.university,
      authProvider: user.authProvider,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error('[googleAuth] Error:', err.message);
    next(err);
  }
};