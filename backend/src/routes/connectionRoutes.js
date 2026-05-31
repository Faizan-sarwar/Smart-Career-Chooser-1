// backend/src/routes/connectionRoutes.js
//
// Available to both students AND mentors. The controller enforces the
// cross-role-only rule based on the caller's role.

import express from 'express';
import {
  browseConnections,
  sendConnectionRequest,
} from '../controllers/connectionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/browse', browseConnections);
router.post('/request', sendConnectionRequest);

export default router;