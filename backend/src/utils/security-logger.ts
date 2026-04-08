/**
 * Logger de sécurité
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'karma-api' },
  transports: [
    // Fichier pour les erreurs
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    // Fichier pour les événements de sécurité
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/security.log'),
    }),
    // Fichier pour tout
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
    // Dans le terminal aussi en développement
    ...(process.env.NODE_ENV === 'development'
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, ...rest }) => {
                return `${timestamp} [${level}]: ${message} ${
                  Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ''
                }`;
              })
            ),
          }),
        ]
      : []),
  ],
});

export { securityLogger };

/**
 * Logger les tentatives de connexion
 */
export function logLoginAttempt(
  email: string,
  success: boolean,
  ip: string,
  userAgent?: string
) {
  const level = success ? 'info' : 'warn';
  securityLogger.log(
    level,
    success ? 'Connexion réussie' : 'Tentative de connexion échouée',
    {
      email,
      ip,
      userAgent,
      timestamp: new Date(),
    }
  );
}

/**
 * Logger les changements sensibles
 */
export function logSensitiveChange(
  userId: string,
  action: string,
  details: Record<string, unknown>,
  ip: string,
  userAgent?: string
) {
  securityLogger.info('Modification sensible', {
    userId,
    action,
    details,
    ip,
    userAgent,
    timestamp: new Date(),
  });
}

/**
 * Logger les erreurs d'accès
 */
export function logAccessError(
  userId: string,
  resource: string,
  reason: string,
  ip: string
) {
  securityLogger.warn('Accès refusé', {
    userId,
    resource,
    reason,
    ip,
    timestamp: new Date(),
  });
}

/**
 * Logger les attaques potentielles
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  severity: 'low' | 'medium' | 'high' | 'critical'
) {
  const level = severity === 'critical' ? 'error' : 'warn';
  securityLogger.log(level, `Événement de sécurité: ${event}`, {
    severity,
    details,
    timestamp: new Date(),
  });
}
