/**
 * Contrôleur de clients
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export async function listClients(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - listClients' }));
}

export async function getClient(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getClient' }));
}

export async function createClient(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - createClient' }));
}

export async function updateClient(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - updateClient' }));
}

export async function deleteClient(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - deleteClient' }));
}
