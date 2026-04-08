/**
 * Routes d'authentification
 */

import { Router } from 'express';
import { login, register, refreshToken, logout, getProfile, changePassword } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validateBody';
import { authMiddleware } from '../middlewares/auth';
import { sanitizeMiddleware } from '../middlewares/sanitize';
import { strictLimiter } from '../middlewares/rateLimiter';
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema } from '../validators/auth.validator';

const router = Router();

// Appliquer la sanitisation et les limiters stricts
router.use(sanitizeMiddleware);
router.post('/login', strictLimiter, validateBody(loginSchema), login);
router.post('/register', strictLimiter, validateBody(registerSchema), register);
router.post('/refresh', validateBody(refreshTokenSchema), refreshToken);
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getProfile);
router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), changePassword);

export default router;
