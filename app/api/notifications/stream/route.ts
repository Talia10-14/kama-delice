import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface Notification {
  id: string;
  type: string;
  message: string;
  date: Date;
  read: boolean;
  link?: string;
}

/**
 * GET /api/notifications/stream
 * Flux SSE pour les notifications en temps réel
 */
export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const userEmail = session.user.email!;

  // Créer un flux SSE
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Envoyer un événement de connexion initial
        const connectEvent = `data: ${JSON.stringify({
          type: 'connected',
          message: 'Connecté au flux de notifications',
          date: new Date(),
        })}\n\n`;

        controller.enqueue(encoder.encode(connectEvent));

        // Récupérer les notifications initiales
        const notifications = await getNotifications(userEmail);

        if (notifications.length > 0) {
          const notificationsEvent = `data: ${JSON.stringify({
            type: 'notifications_batch',
            notifications,
            date: new Date(),
          })}\n\n`;
          controller.enqueue(encoder.encode(notificationsEvent));
        }

        // Envoyer un ping toutes les 30 secondes pour garder la connexion vivante
        const pingInterval = setInterval(() => {
          if (!isClosed) {
            const pingEvent = `data: ${JSON.stringify({
              type: 'ping',
              date: new Date(),
            })}\n\n`;
            try {
              controller.enqueue(encoder.encode(pingEvent));
            } catch (error) {
              clearInterval(pingInterval);
              isClosed = true;
              controller.close();
            }
          }
        }, 30000);

        // Gérer la fermeture de la connexion
        request.signal.addEventListener('abort', () => {
          clearInterval(pingInterval);
          isClosed = true;
          controller.close();
        });
      } catch (error) {
        console.error('Erreur lors du démarrage du flux SSE:', error);
        isClosed = true;
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Récupère les notifications pour l'utilisateur actuel
 */
async function getNotifications(email: string): Promise<Notification[]> {
  const notifications: Notification[] = [];

  // Nouvelles commandes
  const newOrders = await prisma.order.findMany({
    where: {
      status: 'EN_ATTENTE',
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  newOrders.forEach((order: any) => {
    notifications.push({
      id: `order-${order.id}`,
      type: 'nouvelle_commande',
      message: `Nouvelle commande reçue: #${order.id}`,
      date: order.createdAt,
      read: false,
      link: `/admin/commandes`,
    });
  });

  // Commandes annulées
  const cancelledOrders = await prisma.order.findMany({
    where: {
      status: 'ANNULEE',
    },
    orderBy: { updatedAt: 'desc' },
    take: 3,
  });

  cancelledOrders.forEach((order: any) => {
    notifications.push({
      id: `cancelled-${order.id}`,
      type: 'annulation_commande',
      message: `Commande annulée: #${order.id}`,
      date: order.updatedAt,
      read: false,
      link: `/admin/commandes`,
    });
  });

  // Nouveaux messages
  const newMessages = await prisma.message.findMany({
    where: {
      read: false,
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  newMessages.forEach((msg: any) => {
    notifications.push({
      id: `msg-${msg.id}`,
      type: 'nouveau_message',
      message: `Nouveau message de ${msg.senderName}`,
      date: msg.createdAt,
      read: msg.read,
      link: `/admin/messages`,
    });
  });

  // Stagiaires dont le stage se termine dans 7 jours
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const stagiairesFinisSemaine = await prisma.employee.findMany({
    where: {
      typeContrat: 'STAGIAIRE',
      dateFin: {
        lte: weekFromNow,
        gte: new Date(),
      },
    },
    orderBy: { dateFin: 'asc' },
    take: 3,
  });

  stagiairesFinisSemaine.forEach((stagiaire: any) => {
    notifications.push({
      id: `interne-${stagiaire.id}`,
      type: 'alerte_stagiaire',
      message: `⏰ Stage de ${stagiaire.prenom} ${stagiaire.nom} se termine le ${new Date(stagiaire.dateFin!).toLocaleDateString('fr-FR')}`,
      date: stagiaire.dateFin!,
      read: false,
      link: `/admin/rh`,
    });
  });

  return notifications.sort((a, b) => b.date.getTime() - a.date.getTime());
}
