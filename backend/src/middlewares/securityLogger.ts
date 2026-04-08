/**
 * Middleware de logging de sécurité
 */

import { Request, Response, NextFunction } from 'express';
import { securityLogger as logger } from '../utils/security-logger';

/**
 * Logger les requêtes entrantes pour la sécurité
 */
export function securityLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Logger les requêtes entrantes
  const ip =
    (req.headers['x-forwarded-for'] as string) ||
    req.socket.remoteAddress ||
    '';
  const userAgent = req.headers['user-agent'] || '';
  const userId = req.user?.id || 'anonymous';

  // Intercepter la fonction fin pour logger la réponse
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    const duration = Date.now() - startTime;

    // Logger les erreurs et les tentatives suspectes
    if (res.statusCode >= 400) {
      logger.log(
        res.statusCode >= 500 ? 'error' : 'warn',
        `${req.method} ${req.path}`,
        {
          statusCode: res.statusCode,
          userId,
          ip,
          userAgent,
          duration,
          timestamp: new Date(),
        }
      );
    }

    return originalJson(data);
  };

  next();
}
