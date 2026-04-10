/**
 * Contrôleur de messages (STUB)
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response.js';

export async function listMessages(_req: Request, res: Response) {
  res.json(successResponse([]));
}

export async function getMessage(_req: Request, res: Response) {
  res.json(successResponse({}));
}

export async function createMessage(_req: Request, res: Response) {
  res.json(successResponse({ id: 'new' }));
}

export async function updateMessage(_req: Request, res: Response) {
  res.json(successResponse({}));
}

export async function deleteMessage(_req: Request, res: Response) {
  res.json(successResponse({ message: 'Supprimé' }));
}
