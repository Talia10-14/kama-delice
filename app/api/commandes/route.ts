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
    if (!userPermissions.includes('voir_commandes')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(orders);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('modifier_commandes')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const order = await prisma.order.create({
      data: {
        orderNumber: body.orderNumber,
        clientName: body.clientName,
        content: body.content,
        amount: body.amount,
        status: body.status || 'PENDING',
        customOrder: body.customOrder || false,
      },
    });

    return Response.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return Response.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
