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
    const rateLimit = await checkRateLimit(`${ip}:/api/messages/[id]`, 'normal');
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
    if (!userPermissions.includes('gerer_messages')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const message = await prisma.message.update({
      where: { id },
      data: { read: body.read },
    });

    // Audit log success
    await logSecurityEvent({
      userId: (session.user as any).id,
      action: SecurityAction.DATA_EXPORTED,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { messageId: id, read: body.read },
      severity: SecuritySeverity.INFO,
    });

    return Response.json(message);
  } catch (error) {
    return Response.json(
      { error: 'Failed to update message' },
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
    const rateLimit = await checkRateLimit(`${ip}:/api/messages/[id]`, 'normal');
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
    if (!userPermissions.includes('gerer_messages')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.message.delete({
      where: { id },
    });

    // Audit log success
    await logSecurityEvent({
      userId: (session.user as any).id,
      action: SecurityAction.DATA_EXPORTED,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { messageId: id },
      severity: SecuritySeverity.CRITICAL,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
