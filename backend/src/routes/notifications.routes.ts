/**
 * Routes de notifications
 */

import { Router } from 'express';
import {
  listNotifications,
  getNotification,
  markAsRead,
  deleteNotification,
  streamNotifications,
} from '../controllers/notifications.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// Stream SSE (pas d'auth stricte, juste un ID)
router.get('/stream', streamNotifications);

// Routes authentifiées
router.use(authMiddleware);

router.get('/', listNotifications);
router.get('/:id', getNotification);
router.post('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
