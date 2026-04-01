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
    if (!userPermissions.includes('gerer_menus')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        price: body.price,
        photoUrl: body.photoUrl,
        active: body.active,
      },
    });

    return Response.json(menu);
  } catch (error) {
    return Response.json(
      { error: 'Failed to update menu' },
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
    if (!userPermissions.includes('gerer_menus')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.menu.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete menu' },
      { status: 500 }
    );
  }
}
