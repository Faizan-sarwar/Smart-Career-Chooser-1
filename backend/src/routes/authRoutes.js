// src/routes/authRoutes.js
import express from 'express';
import { registerUser, authUser } from '../controllers/authController.js';

const router = express.Router();

// Define routes and attach their controllers
router.post('/register', registerUser);
router.post('/login', authUser);

export default router;