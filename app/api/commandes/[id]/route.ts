import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeTelephone, sanitizeString } from '@/lib/sanitize';
import { notifyStatutCommande, notifyAnnulationConfirmee } from '@/lib/whatsapp-templates';
import { sendEmail } from '@/lib/mailer';



export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/commandes/[id]`, 'normal');
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
    if (!userPermissions.includes('modifier_commandes')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const oldOrder = await prisma.order.findUnique({ where: { id } });

    const order = await prisma.order.update({
      where: { id },
      data: {
        amount: body.amount,
        status: body.status,
      },
    });

    // Envoyer une notification si le statut a changé
    if (body.status && oldOrder?.status !== body.status && body.clientPhone) {
      try {
        const safePhone = sanitizeTelephone(body.clientPhone);
        await notifyStatutCommande(
          safePhone,
          order.orderNumber || order.id,
          body.status
        );
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification:', error);
      }
    }

    return Response.json(order);
  } catch (error) {
    return Response.json(
      { error: 'Failed to update order' },
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
    const rateLimit = await checkRateLimit(`${ip}:/api/commandes/[id]/delete`, 'normal');
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
    if (!userPermissions.includes('gerer_annulations')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const order = await prisma.order.findUnique({ where: { id } });

    await prisma.order.delete({
      where: { id },
    });

    // Envoyer une notification d'annulation au client si le numéro est fourni
    if (order && body.clientPhone) {
      try {
        const safePhone = sanitizeTelephone(body.clientPhone);
        await notifyAnnulationConfirmee(safePhone, order.orderNumber || order.id);
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification:', error);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
