/**
 * Routes de statistiques
 */

import { Router } from 'express';
import {
  getDailyStats,
  getMonthlyStats,
  getWeeklyStats,
  getTopDishes,
  getOrdersByStatus,
  getDailyCmrcials,
} from '../controllers/stats.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

router.get('/daily', getDailyStats);
router.get('/monthly', getMonthlyStats);
router.get('/weekly', getWeeklyStats);
router.get('/top-dishes', getTopDishes);
router.get('/orders-status', getOrdersByStatus);
router.get('/daily-commercial', getDailyCmrcials);

export default router;
