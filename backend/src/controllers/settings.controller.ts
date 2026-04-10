/**
 * Contrôleur de paramètres
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response.js';

export async function getAccountSettings(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getAccountSettings' }));
}

export async function updateAccountSettings(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - updateAccountSettings' }));
}

export async function getNotificationSettings(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getNotificationSettings' }));
}

export async function updateNotificationSettings(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - updateNotificationSettings' }));
}

export async function getRestaurantSettings(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getRestaurantSettings' }));
}

export async function updateRestaurantSettings(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - updateRestaurantSettings' }));
}
