import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';



export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('modifier_commandes')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const order = await prisma.order.update({
      where: { id },
      data: {
        amount: body.amount,
        status: body.status,
      },
    });

    return Response.json(order);
  } catch (error) {
    return Response.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('gerer_annulations')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.order.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
