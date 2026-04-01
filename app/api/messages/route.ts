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
    if (!userPermissions.includes('gerer_messages')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(messages);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
