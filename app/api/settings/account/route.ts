import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

/**
 * POST /api/settings/account
 * Met à jour l'email et/ou le mot de passe de l'administrateur connecté
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();

    // Validation : le mot de passe actuel est requis pour toute modification
    if (!body.currentPassword) {
      return NextResponse.json(
        { error: 'Le mot de passe actuel est requis' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur courant
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier le mot de passe actuel
    const isPasswordCorrect = await bcrypt.compare(
      body.currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Le mot de passe actuel est incorrect' },
        { status: 401 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    // Changer l'email si fourni
    if (body.newEmail && body.newEmail !== session.user.email) {
      // Vérifier que l'email n'existe pas déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: body.newEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }

      updateData.email = body.newEmail;
    }

    // Changer le mot de passe si fourni
    if (body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(body.newPassword, 10);
    }

    // Si aucune modification
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune modification à effectuer' },
        { status: 400 }
      );
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, email: true },
    });

    logger.info('settings', 'Compte administrateur modifié', { email: updatedUser.email });

    return NextResponse.json({
      success: true,
      message: 'Compte modifié avec succès',
      data: {
        email: updatedUser.email,
        emailChanged: !!updateData.email,
        passwordChanged: !!updateData.password,
      },
    });
  } catch (error) {
    logger.error('settings', 'Erreur lors de la modification du compte', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du compte' },
      { status: 500 }
    );
  }
}
