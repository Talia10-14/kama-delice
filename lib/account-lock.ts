/**
 * Account lock management
 * Prevents brute force attacks
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendSecurityAlert } from "@/lib/email-security-alert";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30; // 30 minutes

/**
 * Record a failed login attempt
 * Locks the account if max attempts reached
 */
export async function recordFailedAttempt(
  userId: string,
  ipAddress: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, email: true },
    });

    if (!user) {
      logger.warn("auth", "Tentative de verrouillage avec ID utilisateur invalide", {
        userId,
      });
      return;
    }

    const newAttempts = user.failedLoginAttempts + 1;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      // Lock the account
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);

      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil,
        },
      });

      logger.warn("auth", "Compte verrouillé après trop de tentatives échouées", {
        userId,
        email: user.email,
        ipAddress,
      });

      // Send security alert email
      try {
        await sendSecurityAlert(
          user.email,
          `Compte verrouillé`,
          `Votre compte a été verrouillé suite à ${MAX_FAILED_ATTEMPTS} tentatives de connexion échouées. Il sera déverrouillé automatiquement dans ${LOCK_DURATION_MINUTES} minutes.`,
          ipAddress
        );
      } catch (emailError) {
        logger.error("email", "Erreur lors de l'envoi d'alerte de sécurité", emailError);
      }
    } else {
      // Just increment the counter
      await prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: newAttempts },
      });
    }
  } catch (error) {
    logger.error("auth", "Erreur lors de l'enregistrement d'une tentative échouée", error);
  }
}

/**
 * Reset failed login attempts after successful login
 */
export async function resetFailedAttempts(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    logger.error("auth", "Erreur lors de la réinitialisation des tentatives échouées", error);
  }
}

/**
 * Update last login IP
 */
export async function updateLastLoginIp(
  userId: string,
  ipAddress: string
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginIp: ipAddress },
    });
  } catch (error) {
    logger.error("auth", "Erreur lors de la mise à jour de l'IP de connexion", error);
  }
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(
  userId: string
): Promise<{ locked: boolean; lockedUntil?: Date }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true },
    });

    if (!user) {
      return { locked: false };
    }

    const now = new Date();

    // If locked until date has passed, account is no longer locked
    if (user.lockedUntil && user.lockedUntil <= now) {
      // Automatically unlock
      await prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: null,
          failedLoginAttempts: 0,
        },
      });
      return { locked: false };
    }

    return {
      locked: !!user.lockedUntil,
      lockedUntil: user.lockedUntil || undefined,
    };
  } catch (error) {
    logger.error("auth", "Erreur lors de la vérification du verrouillage du compte", error);
    return { locked: false };
  }
}

/**
 * Get remaining lock time in seconds
 */
export function getRemainingLockTime(lockedUntil: Date): number {
  const now = new Date();
  const remainingMs = lockedUntil.getTime() - now.getTime();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

/**
 * Get recent failed attempts count
 */
export async function getRecentFailedAttempts(
  userId: string
): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    return user?.failedLoginAttempts || 0;
  } catch (error) {
    logger.error("auth", "Erreur lors de la récupération des tentatives échouées", error);
    return 0;
  }
}

/**
 * Check for unusual login activity
 */
export async function checkUnusualActivity(
  userId: string,
  currentIp: string
): Promise<{ unusual: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginIp: true, lastLoginAt: true },
    });

    if (!user || !user.lastLoginIp) {
      return { unusual: false };
    }

    // Different IP
    if (user.lastLoginIp !== currentIp) {
      return { unusual: true, reason: "Connexion depuis une adresse IP différente" };
    }

    // Login attempt very soon after last login (session hijacking)
    if (user.lastLoginAt) {
      const timeSinceLastLogin =
        (Date.now() - user.lastLoginAt.getTime()) / 1000 / 60; // minutes
      if (timeSinceLastLogin < 1) {
        return { unusual: true, reason: "Tentative de connexion peu de temps après la dernière" };
      }
    }

    return { unusual: false };
  } catch (error) {
    logger.error("auth", "Erreur lors de la vérification d'activité inhabituelle", error);
    return { unusual: false };
  }
}
