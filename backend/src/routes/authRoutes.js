// backend/src/routes/authRoutes.js
import express from 'express';
import { registerUser, authUser } from '../controllers/authController.js';
import upload from '../middlewares/uploadMiddleware.js'; // 🚨 IMPORT MIDDLEWARE

const router = express.Router();

// 🚨 ADD upload.single('cv') TO INTERCEPT THE FILE 🚨
router.post('/register', upload.single('cv'), registerUser);
router.post('/login', authUser);

export default router;