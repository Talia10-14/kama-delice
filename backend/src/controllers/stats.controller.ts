/**
 * Contrôleur de statistiques
 * Utilise Promise.all pour paralléliser les requêtes DB
 */

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

// Cache simple en-mémoire (en production, utiliser Redis)
const statsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function isCacheValid(key: string): boolean {
  const cached = statsCache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
}

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  try {
    const cacheKey = 'dashboard';
    if (isCacheValid(cacheKey)) {
      res.json(successResponse(statsCache.get(cacheKey)!.data));
      return;
    }

    // ===== REQUÊTES PARALLÈLES =====
    const [ordersStats, employeeStats, revenueStats] = await Promise.all([
      // Statistiques commandes
      prisma.commande.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Statistiques employés (présents aujourd'hui)
      prisma.attendance.findMany({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      // Revenus totaux
      prisma.commande.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: { in: ['confirmed', 'delivered'] },
        },
      }),
    ]);

    const data = {
      metrics: {
        ordersCount: ordersStats.reduce((acc: number, g: any) => acc + (g._count || 0), 0),
        totalRevenue: revenueStats._sum.totalPrice || 0,
        presentEmployees: employeeStats.length,
      },
      alerts: [],
    };

    statsCache.set(cacheKey, { data, timestamp: Date.now() });
    res.json(successResponse(data));
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json(errorResponse('Erreur lors de la récupération du dashboard'));
  }
}

export async function getDailyStats(_req: Request, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ===== REQUÊTES PARALLÈLES =====
    const [orders, revenue, attendees] = await Promise.all([
      prisma.commande.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.commande.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: 'delivered',
        },
      }),
      prisma.attendance.findMany({
        where: {
          date: { gte: today, lt: tomorrow },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    res.json(
      successResponse({
        date: today,
        orders,
        revenue: revenue._sum.totalPrice || 0,
        presentEmployees: attendees.length,
      })
    );
  } catch (error) {
    console.error('Daily stats error:', error);
    res.status(500).json(errorResponse('Erreur lors de la récupération des stats du jour'));
  }
}

export async function getMonthlyStats(_req: Request, res: Response) {
  try {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    // ===== REQUÊTES PARALLÈLES =====
    const [orders, revenue, topItems] = await Promise.all([
      prisma.commande.count({
        where: {
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.commande.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: { gte: start, lte: end },
          status: 'delivered',
        },
      }),
      prisma.commandeItem.groupBy({
        by: ['menuId'],
        _sum: { quantity: true },
        _count: true,
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    res.json(
      successResponse({
        period: { start, end },
        orders,
        revenue: revenue._sum.totalPrice || 0,
        topItems,
      })
    );
  } catch (error) {
    console.error('Monthly stats error:', error);
    res.status(500).json(errorResponse('Erreur lors de la récupération des stats mensuelles'));
  }
}

export async function getWeeklyStats(_req: Request, res: Response) {
  try {
    const now = new Date();
    const start = startOfWeek(now);
    const end = endOfWeek(now);

    // ===== REQUÊTES PARALLÈLES =====
    const [orders, revenue] = await Promise.all([
      prisma.commande.count({
        where: {
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.commande.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: { gte: start, lte: end },
          status: 'delivered',
        },
      }),
    ]);

    res.json(
      successResponse({
        period: { start, end },
        orders,
        revenue: revenue._sum.totalPrice || 0,
      })
    );
  } catch (error) {
    console.error('Weekly stats error:', error);
    res.status(500).json(errorResponse('Erreur lors de la récupération des stats hebdomadaires'));
  }
}

export async function getTopDishes(_req: Request, res: Response) {
  try {
    const topDishes = await prisma.commandeItem.groupBy({
      by: ['menuId'],
      _sum: { quantity: true },
      _count: true,
      _avg: { price: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    res.json(successResponse(topDishes));
  } catch (error) {
    console.error('Top dishes error:', error);
    res.status(500).json(errorResponse('Erreur lors de la récupération des plats populaires'));
  }
}

export async function getOrdersByStatus(_req: Request, res: Response) {
  try {
    const orders = await prisma.commande.groupBy({
      by: ['status'],
      _count: true,
      _sum: { totalPrice: true },
    });

    res.json(successResponse(orders));
  } catch (error) {
    console.error('Orders by status error:', error);
    res.status(500).json(errorResponse('Erreur lors de la récupération des commandes par statut'));
  }
}

export async function getDailyCmrcials(_req: Request, res: Response) {
  try {
    const dailyCommercials = await prisma.commande.groupBy({
      by: ['createdAt'],
      _count: true,
      _sum: { totalPrice: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json(successResponse(dailyCommercials));
  } catch (error) {
    console.error('Daily commercials error:', error);
    res.status(500).json(errorResponse('Erreur lors de la récupération des données commerciales'));
  }
}
