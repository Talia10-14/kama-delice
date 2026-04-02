import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
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
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('modifier_commandes')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const order = await prisma.order.create({
      data: {
        orderNumber: body.orderNumber,
        clientName: body.clientName,
        content: body.content,
        amount: body.amount,
        status: body.status || 'PENDING',
        customOrder: body.customOrder || false,
      },
    });

    // Envoyer une notification WhatsApp au client si le numéro est fourni
    if (body.clientPhone) {
      try {
        await notifyCommandeRecue(body.clientPhone, order.orderNumber || order.id);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du SMS WhatsApp:', error);
        // Ne pas bloquer la réponse si l'envoi échoue
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
