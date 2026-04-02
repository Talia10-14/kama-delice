import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifyCsrfMiddleware } from '@/lib/csrf';
import { logSecurityEvent, SecurityAction, SecuritySeverity } from '@/lib/security-logger';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF validation first
    const csrfValid = await verifyCsrfMiddleware(request);
    if (!csrfValid) {
      const ip = getClientIp(request);
      await logSecurityEvent({
        action: SecurityAction.CSRF_VIOLATION,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: SecuritySeverity.WARNING,
      });
      return Response.json({ error: 'CSRF token invalid or missing' }, { status: 403 });
    }

    // Rate limiting (normal tier - 30 req/min)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/menus/[id]`, 'normal');
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

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

    // Audit log success
    await logSecurityEvent({
      userId: (session.user as any).id,
      action: SecurityAction.DATA_EXPORTED,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { menuId: id, name: menu.name, category: menu.category },
      severity: SecuritySeverity.INFO,
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
    // CSRF validation first
    const csrfValid = await verifyCsrfMiddleware(request);
    if (!csrfValid) {
      const ip = getClientIp(request);
      await logSecurityEvent({
        action: SecurityAction.CSRF_VIOLATION,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: SecuritySeverity.CRITICAL,
      });
      return Response.json({ error: 'CSRF token invalid or missing' }, { status: 403 });
    }

    // Rate limiting (normal tier - 30 req/min)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/menus/[id]`, 'normal');
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

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

    // Audit log success
    await logSecurityEvent({
      userId: (session.user as any).id,
      action: SecurityAction.DATA_EXPORTED,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { menuId: id },
      severity: SecuritySeverity.CRITICAL,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete menu' },
      { status: 500 }
    );
  }
}
