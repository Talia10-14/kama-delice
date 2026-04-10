/**
 * Service de verrouillage de compte
 */

import prisma from '../config/prisma.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30; // 30 minutes

/**
 * Obtenir les tentatives de connexion échouées
 */
export async function getFailedLoginAttempts(userId: string): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    return user?.failedLoginAttempts || 0;
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des tentatives de connexion:',
      error
    );
    return 0;
  }
}

/**
 * Vérifier si un compte est verrouillé
 */
export async function isAccountLocked(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) return false;

    // Vérifier si le compte est verrouillé et si le verrouillage est encore actif
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return true;
    }

    // Si le verrouillage a expiré, réinitialiser les tentatives
    if (user.lockedUntil && new Date() > user.lockedUntil) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification du verrouillage:', error);
    return false;
  }
}

/**
 * Enregistrer une tentative de connexion échouée
 */
export async function recordFailedLoginAttempt(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    const attempts = (user?.failedLoginAttempts || 0) + 1;
    const lockedUntil =
      attempts >= MAX_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
        : null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil,
      },
    });

    if (lockedUntil) {
      console.warn(
        `⚠️  Compte verrouillé pour ${userId} jusqu'à ${lockedUntil.toISOString()}`
      );
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la tentative:', error);
  }
}

/**
 * Réinitialiser les tentatives de connexion échouées
 */
export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des tentatives:', error);
  }
}

/**
 * Déverrouiller un compte manuellement
 */
export async function unlockAccount(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log(`✅ Compte déverrouillé pour ${userId}`);
  } catch (error) {
    console.error('Erreur lors du déverrouillage du compte:', error);
  }
}
