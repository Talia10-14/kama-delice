/**
 * Contrôleur d'authentification
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
  isAccountLocked,
} from '../services/accountLock.service.js';
import { getUserPermissions } from '../services/permission.service.js';
import { jwtConfig } from '../config/jwt.js';
import { logLoginAttempt, logSensitiveChange } from '../utils/security-logger.js';
import { LoginInput, RegisterInput, RefreshTokenInput, ChangePasswordInput } from '../validators/auth.validator.js';

/**
 * Se connecter
 */
export async function login(req: Request<{}, {}, LoginInput>, res: Response) {
  try {
    const { email, password } = req.body;
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '';

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!user) {
      logLoginAttempt(email, false, ip);
      res.status(401).json(errorResponse('Email ou mot de passe incorrect'));
      return;
    }

    // Vérifier si le compte est verrouillé
    if (await isAccountLocked(user.id)) {
      logLoginAttempt(email, false, ip);
      res.status(403).json(
        errorResponse('Compte temporairement verrouillé. Veuillez réessayer plus tard.')
      );
      return;
    }

    // Vérifier le mot de passe
    const passwordMatch = await verifyPassword(password, user.password);

    if (!passwordMatch) {
      await recordFailedLoginAttempt(user.id);
      logLoginAttempt(email, false, ip);
      res.status(401).json(errorResponse('Email ou mot de passe incorrect'));
      return;
    }

    // Réinitialiser les tentatives échouées
    await resetFailedLoginAttempts(user.id);

    // Obtenir les permissions
    const permissions = await getUserPermissions(user.id);

    // Créer les tokens
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role?.name || 'user',
      permissions,
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret as any, {
      expiresIn: jwtConfig.expiresIn,
    } as any);

    const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret as any, {
      expiresIn: jwtConfig.refreshExpiresIn,
    } as any);

    logLoginAttempt(email, true, ip);

    res.json(
      successResponse({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role?.name,
          permissions,
        },
      })
    );
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * S'enregistrer
 */
export async function register(req: Request<{}, {}, RegisterInput>, res: Response) {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json(errorResponse('Cet email est déjà utilisé'));
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
      },
      include: { role: true },
    });

    logLoginAttempt(email, true, (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '');

    res.status(201).json(
      successResponse({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      })
    );
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * Rafraîchir le token
 */
export async function refreshToken(req: Request<{}, {}, RefreshTokenInput>, res: Response) {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret as string) as {
      id: string;
      email: string;
      role: string;
    };

    // Obtenir les permissions
    const permissions = await getUserPermissions(decoded.id);

    const payload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions,
    };

    const newAccessToken = jwt.sign(payload, jwtConfig.secret as any, {
      expiresIn: jwtConfig.expiresIn,
    } as any);

    res.json(
      successResponse({
        accessToken: newAccessToken,
      })
    );
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(401).json(errorResponse('Token invalide'));
  }
}

/**
 * Se déconnecter
 */
export async function logout(_req: Request, res: Response) {
  // La déconnexion est gérée côté client en supprimant le token
  res.json(successResponse({}, 'Déconnexion réussie'));
}

/**
 * Obtenir le profil utilisateur
 */
export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('Authentification requise'));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });

    if (!user) {
      res.status(404).json(errorResponse('Utilisateur non trouvé'));
      return;
    }

    res.json(
      successResponse({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name,
        permissions: req.user.permissions,
      })
    );
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * Changer le mot de passe
 */
export async function changePassword(req: Request<{}, {}, ChangePasswordInput>, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('Authentification requise'));
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Obtenir l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json(errorResponse('Utilisateur non trouvé'));
      return;
    }

    // Vérifier le mot de passe actuel
    const passwordMatch = await verifyPassword(currentPassword, user.password);

    if (!passwordMatch) {
      res.status(401).json(errorResponse('Mot de passe actuel incorrect'));
      return;
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '';
    logSensitiveChange(user.id, 'CHANGE_PASSWORD', {}, ip);

    res.json(successResponse({}, 'Mot de passe changé avec succès'));
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}
