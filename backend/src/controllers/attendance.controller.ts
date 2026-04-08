/**
 * Contrôleur de pointage
 */

import { Request, Response } from 'express';
import { successResponse } from '../utils/response';

export async function listAttendance(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - listAttendance' }));
}

export async function getAttendance(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - getAttendance' }));
}

export async function checkIn(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - checkIn' }));
}

export async function checkOut(_req: Request, res: Response) {
  res.json(successResponse({ message: 'À implémenter - checkOut' }));
}
