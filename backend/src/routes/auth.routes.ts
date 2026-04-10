/**
 * Routes d'authentification
 */

import { Router } from 'express';
import { login, register, refreshToken, logout, getProfile, changePassword } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validateBody.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sanitizeMiddleware } from '../middlewares/sanitize.js';
import { strictLimiter } from '../middlewares/rateLimiter.js';
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema } from '../validators/auth.validator.js';

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
