// backend/src/routes/authRoutes.js
import express from 'express';
import { registerUser, authUser } from '../controllers/authController.js';
import { forgotPassword, verifyOtp, resetPassword } from '../controllers/passwordResetController.js';
import { googleAuth } from '../controllers/googleAuthController.js'; 
import upload from '../middlewares/uploadMiddleware.js'; // 🚨 IMPORT MIDDLEWARE

const router = express.Router();

// 🚨 Standard Auth (Kept your exact logic and CV upload) 🚨
router.post('/register', upload.single('cv'), registerUser);
router.post('/login', authUser);

// Password Reset Flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Google Auth
router.post('/google', googleAuth);

export default router;