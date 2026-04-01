import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';



export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { category: 'asc' },
    });

    return Response.json(menus);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch menus' },
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
    if (!userPermissions.includes('gerer_menus')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const menu = await prisma.menu.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        price: body.price,
        photoUrl: body.photoUrl,
        active: true,
      },
    });

    return Response.json(menu);
  } catch (error) {
    console.error('Error creating menu:', error);
    return Response.json(
      { error: 'Failed to create menu' },
      { status: 500 }
    );
  }
}
