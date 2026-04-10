/**
 * Contrôleur de commandes (STUB)
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response.js';

export async function listCommandes(_req: Request, res: Response) {
  res.json(successResponse([]));
}

export async function getCommande(_req: Request, res: Response) {
  res.json(successResponse({}));
}

export async function createCommande(_req: Request, res: Response) {
  res.json(successResponse({ id: 'new' }));
}

export async function updateCommande(_req: Request, res: Response) {
  res.json(successResponse({}));
}

export async function deleteCommande(_req: Request, res: Response) {
  res.json(successResponse({ message: 'Supprimé' }));
}
