/**
 * Contrôleur de statistiques
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export async function getDailyStats(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getDailyStats' }));
}

export async function getMonthlyStats(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getMonthlyStats' }));
}

export async function getWeeklyStats(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getWeeklyStats' }));
}

export async function getTopDishes(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getTopDishes' }));
}

export async function getOrdersByStatus(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getOrdersByStatus' }));
}

export async function getDailyCmrcials(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getDailyCmrcials' }));
}
