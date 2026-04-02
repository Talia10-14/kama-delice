import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
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
    const body = await request.json();

    if (!body.senderName || !body.senderEmail || !body.subject || !body.content) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Sauvegarder le message
    const message = await prisma.message.create({
      data: {
        senderName: body.senderName,
        senderEmail: body.senderEmail,
        senderPhone: body.senderPhone || null,
        subject: body.subject,
        content: body.content,
      },
    });

    // Envoyer une notification email aux admins
    try {
      const adminEmail = process.env.EMAIL_FROM || 'admin@kama-delices.com';
      await sendEmail(
        adminEmail,
        `Nouveau message - ${body.subject}`,
        `<p>Un nouveau message a été reçu:</p>
         <p><strong>De:</strong> ${body.senderName} (${body.senderEmail})</p>
         ${body.senderPhone ? `<p><strong>Téléphone:</strong> ${body.senderPhone}</p>` : ''}
         <p><strong>Sujet:</strong> ${body.subject}</p>
         <p><strong>Message:</strong></p>
         <p>${body.content.replace(/\n/g, '<br>')}</p>`,
        `Nouveau message de ${body.senderName}\nSujet: ${body.subject}\n\n${body.content}`
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
