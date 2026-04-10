/**
 * Contrôleur de finances
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response.js';

export async function listFinances(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - listFinances' }));
}

export async function getFinance(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getFinance' }));
}

export async function createFinance(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - createFinance' }));
}

export async function updateFinance(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - updateFinance' }));
}

export async function deleteFinance(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - deleteFinance' }));
}
