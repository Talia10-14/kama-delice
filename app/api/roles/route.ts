import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';



export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return Response.json(roles);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'Admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const role = await prisma.role.create({
      data: {
        libelle: body.libelle,
        rolePermissions: {
          create: body.permissionIds.map((permissionId: number) => ({
            permissionId,
          })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return Response.json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    return Response.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
