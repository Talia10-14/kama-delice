/**
 * Middleware d'authentification JWT
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

/**
 * Vérifier le token JWT
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(errorResponse('Token manquant'));
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
      permissions: string[];
    };

    req.userId = decoded.id;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json(errorResponse('Token expiré'));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json(errorResponse('Token invalide'));
      return;
    }

    res.status(401).json(errorResponse('Authentification échouée'));
  }
}

/**
 * Middleware optionnel - essayer d'authentifier mais ne pas bloquer
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET || 'default-secret';

      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
        role: string;
        permissions: string[];
      };

      req.userId = decoded.id;
      req.user = decoded;
    }

    next();
  } catch {
    // Ignorer les erreurs et continuer
    next();
  }
}
