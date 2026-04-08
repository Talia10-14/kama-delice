/**
 * Contrôleur de commandes
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export async function listCommandes(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - listCommandes' }));
}

export async function getCommande(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getCommande' }));
}

export async function createCommande(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - createCommande' }));
}

export async function updateCommande(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - updateCommande' }));
}

export async function deleteCommande(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - deleteCommande' }));
}
