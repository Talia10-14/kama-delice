import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyOTP } from '@/lib/whatsapp-templates';

/**
 * POST /api/auth/otp/send
 * Envoie un code OTP au numéro de téléphone fourni
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telephone } = body;

    if (!telephone) {
      return NextResponse.json(
        { error: 'Le numéro de téléphone est requis' },
        { status: 400 }
      );
    }

    // Valider le format du téléphone (simple validation)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(telephone)) {
      return NextResponse.json(
        { error: 'Format de numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // Générer un code OTP à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculer l'expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Supprimer les anciens codes OTP non utilisés pour ce numéro
    await prisma.oTPCode.deleteMany({
      where: {
        telephone,
        used: false,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Créer le nouveau code OTP
    const otpRecord = await prisma.oTPCode.create({
      data: {
        telephone,
        code,
        expiresAt,
      },
    });

    // Envoyer le code par WhatsApp
    try {
      await notifyOTP(telephone, code);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du code OTP:', error);
      // Ne pas échouer la requête si l'envoi WhatsApp échoue
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Code OTP envoyé avec succès',
        expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la génération du code OTP:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du code OTP' },
      { status: 500 }
    );
  }
}
