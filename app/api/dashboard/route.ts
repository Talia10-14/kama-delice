import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    // Rate limiting (normal tier - 30 req/min)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/dashboard`, 'normal');
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Orders count today
    const ordersCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Revenue today
    const ordersRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        amount: { not: null },
      },
      _sum: { amount: true },
    });

    const totalRevenue = ordersRevenue._sum.amount || 0;

    // Present employees today
    const presentEmployees = await prisma.attendance.findMany({
      where: {
        datePointage: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const uniqueEmployees = new Set(
      presentEmployees.map((a: any) => a.employeeId)
    ).size;

    // Stagiaire alerts (end of internship within 7 days)
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const stagiaireAlerts = await prisma.employee.findMany({
      where: {
        typeContrat: 'STAGIAIRE',
        dateFin: {
          lte: weekFromNow,
          gte: today,
        },
      },
    });

    return Response.json({
      metrics: {
        ordersCount,
        totalRevenue,
        presentEmployees: uniqueEmployees,
      },
      alerts: stagiaireAlerts,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return Response.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
