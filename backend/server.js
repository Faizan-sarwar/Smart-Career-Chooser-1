// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

// 1. Route Imports
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import assessmentRoutes from './src/routes/assessmentRoutes.js';
import roadmapRoutes from './src/routes/roadmapRoutes.js';
import marketRoutes from './src/routes/marketRoutes.js';
import communityRoutes from './src/routes/communityRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import mentorRoutes from './src/routes/mentorRoutes.js';

// 2. Setup Environment Variables
dotenv.config();

// 3. Initialize the Express App (THIS MUST COME BEFORE app.use)
const app = express();

// 4. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/career-chooser')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Connection Failed:', err));

// 5. Global Middleware
app.use(cors());
app.use(express.json()); // Allows us to read req.body

// 6. Mount Routes (Now 'app' is safely defined!)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mentor', mentorRoutes);
// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is running' });
});

// 7. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});