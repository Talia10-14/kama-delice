import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { verifyPassword } from '../utils/password';

export async function listAttendance(req: Request, res: Response) {
  try {
    const { userId, startDate, endDate } = req.query;

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as any).gte = new Date(startDate as string);
      }
      if (endDate) {
        (where.date as any).lte = new Date(endDate as string);
      }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json(successResponse(attendance));
  } catch (error) {
    console.error('Erreur listAttendance:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

export async function getAttendance(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      res.status(404).json(errorResponse('Pointage non trouvé'));
      return;
    }

    res.json(successResponse(attendance));
  } catch (error) {
    console.error('Erreur getAttendance:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

export async function checkIn(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json(errorResponse('Email et mot de passe requis'));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !await verifyPassword(password, user.password)) {
      res.status(401).json(errorResponse('Identifiants invalides'));
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Vérifier si déjà pointé aujourd'hui
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingAttendance && !existingAttendance.checkOut) {
      res.status(400).json(errorResponse('Déjà pointé à l\'arrivée'));
      return;
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        date: today,
        checkIn: new Date(),
      },
    });

    res.json(successResponse({
      message: `Bienvenue ${user.firstName} ${user.lastName}`,
      attendance,
    }));
  } catch (error) {
    console.error('Erreur checkIn:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

export async function checkOut(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json(errorResponse('Email et mot de passe requis'));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !await verifyPassword(password, user.password)) {
      res.status(401).json(errorResponse('Identifiants invalides'));
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (!attendance) {
      res.status(404).json(errorResponse('Aucun pointage à l\'arrivée trouvé'));
      return;
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
      },
    });

    res.json(successResponse({
      message: `Au revoir ${user.firstName} ${user.lastName}`,
      attendance: updated,
    }));
  } catch (error) {
    console.error('Erreur checkOut:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}
