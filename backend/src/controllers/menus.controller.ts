/**
 * Contrôleur de menus (STUB)
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export async function listMenus(_req: Request, res: Response) {
  res.json(successResponse([]));
}

export async function getMenu(_req: Request, res: Response) {
  res.json(successResponse({}));
}

export async function createMenu(_req: Request, res: Response) {
  res.json(successResponse({ id: 'new' }));
}

export async function updateMenu(_req: Request, res: Response) {
  res.json(successResponse({}));
}

export async function deleteMenu(_req: Request, res: Response) {
  res.json(successResponse({ message: 'Supprimé' }));
}
