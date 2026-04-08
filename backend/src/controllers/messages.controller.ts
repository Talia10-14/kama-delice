/**
 * Contrôleur de messages
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export async function listMessages(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - listMessages' }));
}

export async function getMessage(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getMessage' }));
}

export async function createMessage(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - createMessage' }));
}

export async function updateMessage(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - updateMessage' }));
}

export async function deleteMessage(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - deleteMessage' }));
}
