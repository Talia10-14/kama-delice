/**
 * Contrôleur de notifications
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response.js';

export async function listNotifications(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - listNotifications' }));
}

export async function getNotification(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getNotification' }));
}

export async function markAsRead(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - markAsRead' }));
}

export async function deleteNotification(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - deleteNotification' }));
}

export async function streamNotifications(req: Request, res: Response) {
  // SSE stream pour les notifications en temps réel
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Envoyer une notification de test
  res.write('data: ' + JSON.stringify({ message: 'À implémenter - streamNotifications' }) + '\n\n');

  // Garder la connexion ouverte
  const interval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(interval);
  });
}
