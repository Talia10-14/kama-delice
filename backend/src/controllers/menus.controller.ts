/**
 * Contrôleur de menus
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export async function listMenus(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - listMenus' }));
}

export async function getMenu(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getMenu' }));
}

export async function createMenu(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - createMenu' }));
}

export async function updateMenu(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - updateMenu' }));
}

export async function deleteMenu(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - deleteMenu' }));
}
