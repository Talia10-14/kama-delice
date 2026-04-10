/**
 * Routes de tâches Cron
 */

import { Router } from 'express';
import {
  dailyReport,
  weeklyReport,
  monthlyReport,
  traineeAlerts,
} from '../controllers/cron.controller.js';

const router = Router();

router.post('/rapport-journalier', dailyReport);
router.post('/rapport-hebdomadaire', weeklyReport);
router.post('/rapport-mensuel', monthlyReport);
router.post('/alerte-stagiaires', traineeAlerts);

export default router;
