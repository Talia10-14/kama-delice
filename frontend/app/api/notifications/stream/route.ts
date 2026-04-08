/**
 * Route SSE pour les notifications en temps réel
 * Cette route reste dans Next.js car elle gère une connexion SSE longue
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Encoding': 'none',
  };

  try {
    const backendResponse = await fetch(
      `${API_URL}/notifications/stream`,
      {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      }
    );

    if (!backendResponse.ok) {
      return new NextResponse('Erreur backend', {
        status: backendResponse.status,
      });
    }

    return new NextResponse(backendResponse.body, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Erreur lors de la connexion aux notifications:', error);

    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'connected',
              message: 'Connecté aux notifications',
            })}\n\n`
          )
        );

        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        }, 30000);

        setTimeout(() => {
          clearInterval(heartbeat);
          controller.close();
        }, 60 * 60 * 1000);
      },
    });

    return new NextResponse(customReadable, {
      headers: responseHeaders,
    });
  }
}
