/**
 * Routes de pointage
 */

import { Router } from 'express';
import { listAttendance, getAttendance, checkIn, checkOut } from '../controllers/attendance.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', listAttendance);
router.get('/:id', getAttendance);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

export default router;
