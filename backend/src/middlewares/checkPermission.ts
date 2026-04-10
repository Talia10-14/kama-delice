/**
 * Middleware de vérification des permissions
 */

import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';
import { logAccessError } from '../utils/security-logger.js';
import { getEffectivePermissions } from '../services/permission.service.js';

// Cache local pour les permissions récupérées pendant la requête pour éviter plusieurs appels
// Clé: userId, Valeur: permissionCodes[]
const requestPermissionsCache = new Map<string, string[]>();

/**
 * Récupérer les permissions effectives avec gestion du cache par requête
 */
async function getRequestPermissions(userId: string): Promise<string[]> {
  const cached = requestPermissionsCache.get(userId);
  if (cached) {
    return cached;
  }

  const permissions = await getEffectivePermissions(userId);
  requestPermissionsCache.set(userId, permissions);
  return permissions;
}

/**
 * Nettoyer le cache de requête (appelé après modification de permissions)
 */
export function clearRequestPermissionsCache(): void {
  requestPermissionsCache.clear();
}

/**
 * Vérifier si l'utilisateur a une permission spécifique
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentification requise'));
        return;
      }

      if (req.user.role === 'admin') {
        next();
        return;
      }

      // Récupérer les permissions effectives (avec cache dans la requête)
      const permissions = await getRequestPermissions(req.user.id);

      if (!permissions.includes(permission)) {
        const ip =
          (req.headers['x-forwarded-for'] as string) ||
          req.socket.remoteAddress ||
          '';
        logAccessError(
          req.user.id,
          req.path,
          `Permission requise: ${permission}`,
          ip
        );

        res.status(403).json(
          errorResponse(
            'Vous n\'avez pas la permission pour effectuer cette action'
          )
        );
        return;
      }

      next();
    } catch (error) {
      console.error('Erreur de vérification des permissions:', error);
      res.status(500).json(errorResponse('Erreur de vérification des permissions'));
    }
  };
}

/**
 * Vérifier si l'utilisateur a un rôle spécifique
 */
export function requireRole(role: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentification requise'));
        return;
      }

      const allowedRoles = Array.isArray(role) ? role : [role];

      if (!allowedRoles.includes(req.user.role)) {
        const ip =
          (req.headers['x-forwarded-for'] as string) ||
          req.socket.remoteAddress ||
          '';
        logAccessError(
          req.user.id,
          req.path,
          `Rôle requis: ${allowedRoles.join(', ')}`,
          ip
        );

        res.status(403).json(
          errorResponse(
            'Vous n\'avez pas accès à cette ressource. Rôle insuffisant.'
          )
        );
        return;
      }

      next();
    } catch (error) {
      res.status(500).json(errorResponse('Erreur de vérification du rôle'));
    }
  };
}
