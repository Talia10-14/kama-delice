import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_ATTEMPTS = 3;

/**
 * POST /api/auth/otp/verify
 * Vérifie le code OTP et crée/récupère la session client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telephone, code } = body;

    if (!telephone || !code) {
      return NextResponse.json(
        { error: 'Le numéro de téléphone et le code sont requis' },
        { status: 400 }
      );
    }

    // Chercher le code OTP
    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        telephone,
        used: false,
        code,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Si pas de code trouvé
    if (!otpRecord) {
      // Compter les tentatives échouées récentes
      const failedAttempts = await prisma.oTPCode.count({
        where: {
          telephone,
          used: false,
          createdAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Dernières 15 minutes
          },
        },
      });

      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - failedAttempts);

      return NextResponse.json(
        {
          success: false,
          error: 'Code OTP invalide',
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Vérifier si le code n'a pas expiré
    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Le code OTP a expiré' },
        { status: 400 }
      );
    }

    // Marquer le code comme utilisé
    await prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Chercher ou créer le client
    let customer = await prisma.customer.findUnique({
      where: { telephone },
    });

    if (!customer) {
      // Créer un nouveau client
      customer = await prisma.customer.create({
        data: {
          telephone,
          nom: 'Client',
          prenom: 'Nouveau',
        },
      });
    }

    // Générer un token de session simple (en production, utiliser JWT)
    const sessionToken = Buffer.from(
      JSON.stringify({
        customerId: customer.id,
        telephone: customer.telephone,
        iat: Date.now(),
      })
    ).toString('base64');

    return NextResponse.json(
      {
        success: true,
        message: 'Authentification réussie',
        customer: {
          id: customer.id,
          telephone: customer.telephone,
          nom: customer.nom,
          prenom: customer.prenom,
        },
        sessionToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la vérification du code OTP:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du code OTP' },
      { status: 500 }
    );
  }
}
