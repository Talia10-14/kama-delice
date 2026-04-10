/**
 * Middleware de rate limiting
 */

import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/response.js';

/**
 * Limiter basé sur le nombre de requêtes par minute
 */
const limiterConfigs = {
  strict: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requêtes
    message: 'Trop de tentatives, veuillez réessayer plus tard',
  },
  normal: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requêtes
    message: 'Trop de requêtes, veuillez réessayer plus tard',
  },
  public: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requêtes
    message: 'Trop de requêtes, veuillez réessayer plus tard',
  },
};

/**
 * Créer un limiter strict
 */
export const strictLimiter = rateLimit({
  windowMs: limiterConfigs.strict.windowMs,
  max: limiterConfigs.strict.max,
  message: limiterConfigs.strict.message,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Ignorer pour les utilisateurs authentifiés (admin)
    return req.user?.role === 'admin';
  },
});

/**
 * Créer un limiter normal
 */
export const normalLimiter = rateLimit({
  windowMs: limiterConfigs.normal.windowMs,
  max: limiterConfigs.normal.max,
  message: limiterConfigs.normal.message,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Créer un limiter public
 */
export const publicLimiter = rateLimit({
  windowMs: limiterConfigs.public.windowMs,
  max: limiterConfigs.public.max,
  message: limiterConfigs.public.message,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware de rate limiting général
 */
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req: Request) => {
    // Admin: illimité
    if (req.user?.role === 'admin') return 10000;
    // Authentifié: 100 requêtes par minute
    if (req.user?.id) return 100;
    // Non authentifié: 30 requêtes par minute
    return 30;
  },
  keyGenerator: (req: Request) => {
    // Utiliser l'ID utilisateur s'il est authentifié, sinon l'IP
    return req.user?.id || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
  },
  skip: (req: Request) => {
    // Ne pas limiter les routes publiques spécifiques
    return req.path === '/health';
  },
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      errorResponse('Trop de requêtes, veuillez réessayer plus tard')
    );
  },
});
