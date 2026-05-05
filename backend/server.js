// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import assessmentRoutes from './src/routes/assessmentRoutes.js';
import roadmapRoutes from './src/routes/roadmapRoutes.js';
import careerRoutes from './src/routes/careerRoutes.js';
import marketRoutes from './src/routes/marketRoutes.js';
import communityRoutes from './src/routes/communityRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import mentorRoutes from './src/routes/mentorRoutes.js';

dotenv.config();

const app = express();

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/career-chooser')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Connection Failed:', err));

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mentor', mentorRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is running' });
});

// 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler — works with `next(error)` patterns in controllers
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  console.error(`[${req.method} ${req.originalUrl}]`, err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});