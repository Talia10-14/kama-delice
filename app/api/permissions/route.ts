import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';



export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await prisma.permission.findMany();

    return Response.json(permissions);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
