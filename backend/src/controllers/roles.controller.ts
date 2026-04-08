/**
 * Contrôleur de rôles
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export async function listRoles(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - listRoles' }));
}

export async function getRole(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getRole' }));
}

export async function createRole(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - createRole' }));
}

export async function updateRole(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - updateRole' }));
}

export async function deleteRole(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - deleteRole' }));
}
