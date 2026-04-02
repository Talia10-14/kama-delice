import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * POST /api/settings/restaurant
 * Sauvegarde les paramètres du restaurant en BDD
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier les permissions admin
    const userPermissions = (session.user as any).permissions || [];
    if (!userPermissions.includes('gerer_parametres')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }

    const body = await request.json();

    // Validation des champs
    if (!body.nom || !body.adresse || !body.telephone) {
      return NextResponse.json(
        { error: 'Les champs nom, adresse, et téléphone sont requis' },
        { status: 400 }
      );
    }

    // Récupérer ou créer les settings
    let settings = await prisma.restaurantSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.restaurantSettings.create({
        data: {
          nom: body.nom,
          adresse: body.adresse,
          telephone: body.telephone,
          heureOuverture: body.heureOuverture || '08:00',
          heureFermeture: body.heureFermeture || '22:00',
          joursOuverture: Array.isArray(body.joursOuverture)
            ? body.joursOuverture.join(',')
            : 'Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche',
          email: body.email || '',
        },
      });
    } else {
      settings = await prisma.restaurantSettings.update({
        where: { id: settings.id },
        data: {
          nom: body.nom,
          adresse: body.adresse,
          telephone: body.telephone,
          heureOuverture: body.heureOuverture || settings.heureOuverture,
          heureFermeture: body.heureFermeture || settings.heureFermeture,
          joursOuverture: Array.isArray(body.joursOuverture)
            ? body.joursOuverture.join(',')
            : settings.joursOuverture,
          email: body.email || settings.email,
        },
      });
    }

    logger.info('settings', 'Paramètres restaurant modifiés', { nom: settings.nom });

    return NextResponse.json({
      success: true,
      message: 'Paramètres restaurant modifiés avec succès',
      data: {
        ...settings,
        joursOuverture: settings.joursOuverture.split(','),
      },
    });
  } catch (error) {
    logger.error('settings', 'Erreur lors de la sauvegarde des paramètres restaurant', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/settings/restaurant
 * Récupère les paramètres du restaurant
 */
export async function GET() {
  try {
    const settings = await prisma.restaurantSettings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { error: 'Paramètres non configurés' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        joursOuverture: settings.joursOuverture.split(','),
      },
    });
  } catch (error) {
    logger.error('settings', 'Erreur lors de la récupération des paramètres', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
