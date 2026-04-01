import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';



export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('voir_rapports')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    
    // Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // This week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today stats
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    const todayRevenue = todayOrders.reduce((sum, order) => {
      return sum + (order.amount || 0);
    }, 0);

    // Week stats
    const weekOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: weekStart },
      },
    });

    const weekRevenue = weekOrders.reduce((sum, order) => {
      return sum + (order.amount || 0);
    }, 0);

    // Month stats
    const monthOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: monthStart },
      },
    });

    const monthRevenue = monthOrders.reduce((sum, order) => {
      return sum + (order.amount || 0);
    }, 0);

    // Cancellation rate
    const cancelledOrders = monthOrders.filter(
      (o) => o.status === 'CANCELLED'
    ).length;
    const cancellationRate =
      monthOrders.length > 0
        ? (cancelledOrders / monthOrders.length) * 100
        : 0;

    return Response.json({
      todayRevenue,
      weekRevenue,
      monthRevenue,
      todayOrders: todayOrders.length,
      weekOrders: weekOrders.length,
      monthOrders: monthOrders.length,
      cancellationRate,
    });
  } catch (error) {
    console.error('Finance error:', error);
    return Response.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    );
  }
}
