import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeString, sanitizeTelephone } from '@/lib/sanitize';
import { commandeSchema } from '@/lib/validators';
import { verifyCsrfMiddleware } from '@/lib/csrf';
import { logSecurityEvent, SecurityAction, SecuritySeverity } from '@/lib/security-logger';
import { notifyCommandeRecue } from '@/lib/whatsapp-templates';
import { sendEmail } from '@/lib/mailer';



export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('voir_commandes')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(orders);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch orders' },
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

    // Rate limiting - normal tier for authenticated users
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/commandes`, 'normal');
    if (!rateLimit.success) {
      return Response.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('modifier_commandes')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = commandeSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 422 }
      );
    }

    // Sanitize inputs
    const sanitized = {
      orderNumber: sanitizeString(validation.data.orderNumber, 100),
      clientName: sanitizeString(validation.data.clientName, 100),
      content: sanitizeString(validation.data.content, 5000),
      clientPhone: validation.data.clientPhone ? sanitizeTelephone(validation.data.clientPhone) : null,
    };

    const order = await prisma.order.create({
      data: {
        orderNumber: sanitized.orderNumber,
        clientName: sanitized.clientName,
        content: sanitized.content,
        amount: validation.data.amount,
        status: validation.data.status || 'PENDING',
        customOrder: validation.data.customOrder || false,
      },
    });

    // Log security event - order creation
    await logSecurityEvent({
      userId: (session.user as any).id,
      action: SecurityAction.DATA_EXPORTED,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { orderId: order.id, amount: order.amount },
      severity: SecuritySeverity.INFO,
    });

    // Envoyer une notification WhatsApp au client si le numéro est fourni
    if (sanitized.clientPhone) {
      try {
        await notifyCommandeRecue(sanitized.clientPhone, order.orderNumber || order.id);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du SMS WhatsApp:', error);
      }
    }

    // Envoyer une notification email aux admins
    try {
      const adminEmail = process.env.EMAIL_FROM || 'admin@kama-delices.com';
      await sendEmail(
        adminEmail,
        `Nouvelle commande reçue - ${order.orderNumber || order.id}`,
        `<p>Une nouvelle commande a été reçue:</p>
         <p><strong>Numéro:</strong> ${order.orderNumber || order.id}</p>
         <p><strong>Client:</strong> ${order.clientName}</p>
         <p><strong>Montant:</strong> ${order.amount} FCFA</p>
         <p><strong>Détails:</strong> ${order.content}</p>`,
        `Nouvelle commande: ${order.orderNumber}\nClient: ${order.clientName}\nMontant: ${order.amount} FCFA`
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
    }

    return Response.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return Response.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
