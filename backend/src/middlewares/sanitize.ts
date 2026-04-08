/**
 * Middleware de santisation des inputs
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Sanitiser les strings en supprimant les balises HTML et entités dangereuses
 */
function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Supprimer les balises HTML et scripts
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Supprimer les URLs JavaScript
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Supprimer les event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limiter la longueur
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitiser un objet récursivement
 */
function sanitizeObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Middleware principal de sanitisation
 */
export function sanitizeMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Sanitiser le body si présent
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitiser les query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(
      req.query as Record<string, unknown>
    ) as any;
  }

  // Sanitiser les params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params) as any;
  }

  next();
}
