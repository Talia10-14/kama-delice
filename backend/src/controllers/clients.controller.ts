/**
 * Contrôleur de clients (STUB)
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response.js';

export async function listClients(_req: Request, res: Response) {
  res.json(successResponse([]));
}

export async function getClient(_req: Request, res: Response) {
  res.json(successResponse({}));
}

export async function createClient(_req: Request, res: Response) {
  res.json(successResponse({ id: 'new' }));
}

export async function updateClient(_req: Request, res: Response) {
  res.json(successResponse({}));
}

export async function deleteClient(_req: Request, res: Response) {
  res.json(successResponse({ message: 'Supprimé' }));
}
