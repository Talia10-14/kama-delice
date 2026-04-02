import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeString, sanitizeEmail, sanitizeTelephone } from '@/lib/sanitize';
import { messageSchema } from '@/lib/validators';
import { verifyCsrfMiddleware } from '@/lib/csrf';
import { logSecurityEvent, SecurityAction, SecuritySeverity } from '@/lib/security-logger';
import { sendEmail } from '@/lib/mailer';



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

export async function POST(request: Request) {
  try {
    // CSRF Token validation
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

    // Rate limiting - normal tier for all users (public endpoint)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/messages`, 'public');
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = messageSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 422 }
      );
    }

    // Sanitize inputs
    const sanitized = {
      senderName: sanitizeString(validation.data.senderName, 100),
      senderEmail: sanitizeEmail(validation.data.senderEmail) || validation.data.senderEmail,
      senderPhone: validation.data.senderPhone ? sanitizeTelephone(validation.data.senderPhone) : null,
      subject: sanitizeString(validation.data.subject, 200),
      content: sanitizeString(validation.data.content, 5000),
    };

    // Sauvegarder le message
    const message = await prisma.message.create({
      data: {
        senderName: sanitized.senderName,
        senderEmail: sanitized.senderEmail,
        senderPhone: sanitized.senderPhone,
        subject: sanitized.subject,
        content: sanitized.content,
      },
    });

    // Log security event - message received (non-authenticated)
    await logSecurityEvent({
      action: SecurityAction.DATA_EXPORTED,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { messageId: message.id, from: sanitized.senderEmail },
      severity: SecuritySeverity.INFO,
    });

    // Envoyer une notification email aux admins
    try {
      const adminEmail = process.env.EMAIL_FROM || 'admin@kama-delices.com';
      await sendEmail(
        adminEmail,
        `Nouveau message - ${sanitized.subject}`,
        `<p>Un nouveau message a été reçu:</p>
         <p><strong>De:</strong> ${sanitized.senderName} (${sanitized.senderEmail})</p>
         ${sanitized.senderPhone ? `<p><strong>Téléphone:</strong> ${sanitized.senderPhone}</p>` : ''}
         <p><strong>Sujet:</strong> ${sanitized.subject}</p>
         <p><strong>Message:</strong></p>
         <p>${sanitized.content.replace(/\n/g, '<br>')}</p>`,
        `Nouveau message de ${sanitized.senderName}\nSujet: ${sanitized.subject}\n\n${sanitized.content}`
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
    }

    return Response.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return Response.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
