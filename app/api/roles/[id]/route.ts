import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';



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

    const userRole = (session.user as any).role;
    if (userRole !== 'Admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.role.delete({
      where: { id: parseInt(id) },
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
