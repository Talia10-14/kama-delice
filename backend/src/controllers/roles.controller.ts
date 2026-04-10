/**
 * Contrôleur de rôles (STUB)
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export async function listRoles(_req: Request, res: Response) {
  res.json(successResponse([]));
}

export async function getRole(_req: Request, res: Response) {
  res.json(successResponse({}));
}

export async function createRole(_req: Request, res: Response) {
  res.json(successResponse({ id: 'new' }));
}

export async function updateRole(_req: Request, res: Response) {
  res.json(successResponse({}));
}

export async function deleteRole(_req: Request, res: Response) {
  res.json(successResponse({ message: 'Supprimé' }));
}
