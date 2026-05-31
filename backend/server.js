// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

import { app, server } from './src/socket/socket.js';

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
import notificationRoutes from './src/routes/notificationRoutes.js';
import studentRoutes from './src/routes/studentRoutes.js'; 
import connectionRoutes from './src/routes/connectionRoutes.js';

dotenv.config();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/career-chooser')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Connection Failed:', err));

app.use((req, res, next) => {
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    console.log('--- INCOMING LOGIN REQUEST ---');
    console.log('Content-Type Header:', req.headers['content-type']);
    console.log('Raw Body:', req.body);
    console.log('------------------------------');
  }
  next();
});

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
app.use('/api/student', studentRoutes); // 🚨 MOUNTED HERE — fixes "Route not found: GET /api/student/mentors"
app.use('/api/notifications', notificationRoutes);
app.use('/api/connections', connectionRoutes); // 🚨 MOUNTED HERE — fixes "Route not found: GET /api/connections/browse"
// Static file serving — CV downloads, chat media, avatars all live under /uploads
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is running' });
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

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
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});