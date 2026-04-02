/**
 * Security event logging
 * Logs all security-related events in the database
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export enum SecurityAction {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGIN_FAILED_LOCKED = "LOGIN_FAILED_LOCKED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  PASSWORD_RESET = "PASSWORD_RESET",
  ROLE_CHANGED = "ROLE_CHANGED",
  PERMISSIONS_CHANGED = "PERMISSIONS_CHANGED",
  EMPLOYEE_CREATED = "EMPLOYEE_CREATED",
  EMPLOYEE_MODIFIED = "EMPLOYEE_MODIFIED",
  EMPLOYEE_DEACTIVATED = "EMPLOYEE_DEACTIVATED",
  EMPLOYEE_DELETED = "EMPLOYEE_DELETED",
  DATA_EXPORTED = "DATA_EXPORTED",
  DATA_IMPORTED = "DATA_IMPORTED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  CSRF_VIOLATION = "CSRF_VIOLATION",
  SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT",
  XSS_ATTEMPT = "XSS_ATTEMPT",
  FILE_UPLOAD = "FILE_UPLOAD",
  FILE_DELETED = "FILE_DELETED",
  API_KEY_GENERATED = "API_KEY_GENERATED",
  API_KEY_REVOKED = "API_KEY_REVOKED",
}

export enum SecuritySeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

export interface SecurityEvent {
  userId?: string;
  action: SecurityAction;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, unknown>;
  severity?: SecuritySeverity;
}

/**
 * Log a security event
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const severity = event.severity || determineSeverity(event.action);

    await prisma.securityLog.create({
      data: {
        userId: event.userId,
        action: event.action,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        details: (event.details || {}) as Prisma.InputJsonValue,
        severity,
      },
    });

    // Also log locally for immediate visibility
    if (severity === SecuritySeverity.CRITICAL) {
      logger.error("security", `[CRITICAL] ${event.action}`, event.details || {});
    } else if (severity === SecuritySeverity.WARNING) {
      logger.warn("security", `[WARNING] ${event.action}`, event.details || {});
    } else {
      logger.info("security", `[INFO] ${event.action}`, event.details || {});
    }
  } catch (error) {
    logger.error("security", "Erreur lors de l'enregistrement d'un événement de sécurité", error);
  }
}

/**
 * Determine severity level based on action
 */
function determineSeverity(action: SecurityAction): SecuritySeverity {
  const criticalActions = [
    SecurityAction.LOGIN_FAILED,
    SecurityAction.ACCOUNT_LOCKED,
    SecurityAction.UNAUTHORIZED_ACCESS,
    SecurityAction.CSRF_VIOLATION,
    SecurityAction.SQL_INJECTION_ATTEMPT,
    SecurityAction.XSS_ATTEMPT,
    SecurityAction.EMPLOYEE_DELETED,
  ];

  const warningActions = [
    SecurityAction.PASSWORD_CHANGED,
    SecurityAction.PASSWORD_RESET,
    SecurityAction.ROLE_CHANGED,
    SecurityAction.PERMISSIONS_CHANGED,
    SecurityAction.EMPLOYEE_MODIFIED,
    SecurityAction.EMPLOYEE_DEACTIVATED,
    SecurityAction.DATA_EXPORTED,
    SecurityAction.API_KEY_GENERATED,
    SecurityAction.API_KEY_REVOKED,
  ];

  if (criticalActions.includes(action)) {
    return SecuritySeverity.CRITICAL;
  }

  if (warningActions.includes(action)) {
    return SecuritySeverity.WARNING;
  }

  return SecuritySeverity.INFO;
}

/**
 * Get recent security events
 */
export async function getRecentSecurityEvents(
  limit = 100,
  userId?: string
) {
  try {
    return await prisma.securityLog.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: { email: true },
        },
      },
    });
  } catch (error) {
    logger.error("security", "Erreur lors de la récupération des événements", error);
    return [];
  }
}

/**
 * Get security events by date range
 */
export async function getSecurityEventsByDateRange(
  startDate: Date,
  endDate: Date
) {
  try {
    return await prisma.securityLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { email: true },
        },
      },
    });
  } catch (error) {
    logger.error("security", "Erreur lors de la récupération des événements par date", error);
    return [];
  }
}

/**
 * Get security events by severity
 */
export async function getSecurityEventsBySeverity(
  severity: SecuritySeverity,
  limit = 100
) {
  try {
    return await prisma.securityLog.findMany({
      where: { severity },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: { email: true },
        },
      },
    });
  } catch (error) {
    logger.error("security", "Erreur lors de la récupération des événements critiques", error);
    return [];
  }
}

/**
 * Count failed login attempts in last 24 hours
 */
export async function countFailedLoginsLast24h(userId?: string) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await prisma.securityLog.count({
      where: {
        action: SecurityAction.LOGIN_FAILED,
        userId,
        createdAt: { gte: oneDayAgo },
      },
    });
  } catch (error) {
    logger.error("security", "Erreur lors du comptage des échecs de connexion", error);
    return 0;
  }
}

/**
 * Get login attempts by IP in last 24 hours
 */
export async function getLoginAttemptsFromIp(ipAddress: string) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await prisma.securityLog.findMany({
      where: {
        ipAddress,
        action: {
          in: [SecurityAction.LOGIN_SUCCESS, SecurityAction.LOGIN_FAILED],
        },
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error("security", "Erreur lors de la récupération des tentatives de connexion", error);
    return [];
  }
}

/**
 * Delete old security logs (retention: 90 days)
 */
export async function cleanupOldSecurityLogs(retentionDays = 90): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await prisma.securityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    logger.info("security", `Nettoyage des journaux de sécurité`, {
      deletedCount: result.count,
      retentionDays,
    });

    return result.count;
  } catch (error) {
    logger.error("security", "Erreur lors du nettoyage des journaux", error);
    return 0;
  }
}
