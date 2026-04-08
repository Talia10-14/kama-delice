/**
 * Contrôleur de tâches Cron
 */

import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Vérifier la clé secrète du cron
 */
function verifyCronSecret(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';

  if (!cronSecret) {
    console.warn('⚠️  CRON_SECRET not set');
    return false;
  }

  const expectedAuth = `Bearer ${cronSecret}`;
  // Utiliser timingSafeEqual pour éviter les timing attacks
  try {
    const crypto = require('crypto');
    return crypto.timingSafeEqual(
      Buffer.from(authHeader),
      Buffer.from(expectedAuth)
    );
  } catch {
    return false;
  }
}

export async function dailyReport(req: Request, res: Response) {
  if (!verifyCronSecret(req)) {
    res.status(401).json(errorResponse('Cron non autorisé'));
    return;
  }

  res.json(successResponse({ message: 'À implémenter - dailyReport' }));
}

export async function weeklyReport(req: Request, res: Response) {
  if (!verifyCronSecret(req)) {
    res.status(401).json(errorResponse('Cron non autorisé'));
    return;
  }

  res.json(successResponse({ message: 'À implémenter - weeklyReport' }));
}

export async function monthlyReport(req: Request, res: Response) {
  if (!verifyCronSecret(req)) {
    res.status(401).json(errorResponse('Cron non autorisé'));
    return;
  }

  res.json(successResponse({ message: 'À implémenter - monthlyReport' }));
}

export async function traineeAlerts(req: Request, res: Response) {
  if (!verifyCronSecret(req)) {
    res.status(401).json(errorResponse('Cron non autorisé'));
    return;
  }

  res.json(successResponse({ message: 'À implémenter - traineeAlerts' }));
}
