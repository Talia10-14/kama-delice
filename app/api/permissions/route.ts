import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    // Rate limiting (normal tier - 30 req/min)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/permissions`, 'normal');
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

    const permissions = await prisma.permission.findMany();

    return Response.json(permissions);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
