/**
 * Routes de paramètres
 */

import { Router } from 'express';
import {
  getAccountSettings,
  updateAccountSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getRestaurantSettings,
  updateRestaurantSettings,
} from '../controllers/settings.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

router.get('/account', getAccountSettings);
router.put('/account', updateAccountSettings);
router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);
router.get('/restaurant', getRestaurantSettings);
router.put('/restaurant', updateRestaurantSettings);

export default router;
