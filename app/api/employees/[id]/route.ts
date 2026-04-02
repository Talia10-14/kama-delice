import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeString, sanitizeTelephone } from '@/lib/sanitize';



export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!employee) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    return Response.json(employee);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/employees/[id]`, 'normal');
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('gerer_personnel')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Sanitize inputs
    const sanitized = {
      nom: body.nom ? sanitizeString(body.nom, 100) : undefined,
      prenom: body.prenom ? sanitizeString(body.prenom, 100) : undefined,
      telephone: body.telephone ? sanitizeTelephone(body.telephone) : undefined,
    };

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        nom: sanitized.nom,
        prenom: sanitized.prenom,
        telephone: sanitized.telephone,
        typeContrat: body.typeContrat,
        dateEntree: body.dateEntree ? new Date(body.dateEntree) : undefined,
        dateFin: body.dateFin ? new Date(body.dateFin) : null,
        statut: body.statut,
        roleId: body.roleId ? parseInt(body.roleId) : undefined,
      },
      include: { role: true },
    });

    return Response.json(employee);
  } catch (error) {
    return Response.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/employees/[id]/delete`, 'normal');
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'Admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.employee.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
