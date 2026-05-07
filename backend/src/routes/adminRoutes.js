import express from 'express';
import {
  getStats,
  listUsers,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  getMarket,
  updateMarket,
  generateMarketData,
  listCareers,
  createCareer,
  updateCareer,
  deleteCareer,
  listEventsAdmin,
  generateEventData,
  createEvent,
  updateEvent,
  deleteEvent,
  listReports,
  resolveReport,
  generateCareerData,
  listRoadmapsAdmin,
  deleteRoadmapAdmin,
  analyzeContentAI
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All admin routes require Admin role
router.use(protect, authorize('Admin'));

// Dashboard
router.get('/stats', getStats);

// Users
router.get('/users', listUsers);
router.put('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Market data
router.get('/market', getMarket);
router.post('/market/generate', generateMarketData);
router.put('/market', updateMarket);

// 🚨 CAREERS SECTION FIX 🚨
router.get('/careers', listCareers);
router.post('/careers/generate', generateCareerData);
router.post('/careers', createCareer);
router.put('/careers/:id', updateCareer);
router.delete('/careers/:id', deleteCareer);

// Events
router.get('/events', listEventsAdmin);
router.post('/events/generate', generateEventData);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

// Moderation
router.get('/reports', listReports);
router.post('/reports/analyze', analyzeContentAI);
router.post('/reports/:id/resolve', resolveReport);

// Roadmaps
router.get('/roadmaps', listRoadmapsAdmin);
router.delete('/roadmaps/:id', deleteRoadmapAdmin);

export default router;