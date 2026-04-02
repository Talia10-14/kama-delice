import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * POST /api/settings/notifications
 * Sauvegarde les paramètres de notifications en BDD
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

    // Validation du délai d'alerte stagiaires
    const delaiAlerteStagiaire = parseInt(body.delaiAlerteStagiaire || 7);
    if (isNaN(delaiAlerteStagiaire) || delaiAlerteStagiaire < 1 || delaiAlerteStagiaire > 30) {
      return NextResponse.json(
        { error: 'Le délai d\'alerte doit être entre 1 et 30 jours' },
        { status: 400 }
      );
    }

    // Récupérer ou créer les settings de notification
    let settings = await prisma.notificationSettings.findFirst();

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          emailNouvelleCommande: body.emailNouvelleCommande ?? true,
          emailAnnulationCommande: body.emailAnnulationCommande ?? true,
          emailNouveauMessage: body.emailNouveauMessage ?? true,
          emailRapportJournalier: body.emailRapportJournalier ?? false,
          emailRapportHebdomadaire: body.emailRapportHebdomadaire ?? true,
          emailRapportMensuel: body.emailRapportMensuel ?? true,
          emailAlerteStagiaire: body.emailAlerteStagiaire ?? true,
          reportFrequency: body.reportFrequency || 'weekly',
          delaiAlerteStagiaire,
        },
      });
    } else {
      settings = await prisma.notificationSettings.update({
        where: { id: settings.id },
        data: {
          emailNouvelleCommande:
            body.emailNouvelleCommande !== undefined
              ? body.emailNouvelleCommande
              : settings.emailNouvelleCommande,
          emailAnnulationCommande:
            body.emailAnnulationCommande !== undefined
              ? body.emailAnnulationCommande
              : settings.emailAnnulationCommande,
          emailNouveauMessage:
            body.emailNouveauMessage !== undefined
              ? body.emailNouveauMessage
              : settings.emailNouveauMessage,
          emailRapportJournalier:
            body.emailRapportJournalier !== undefined
              ? body.emailRapportJournalier
              : settings.emailRapportJournalier,
          emailRapportHebdomadaire:
            body.emailRapportHebdomadaire !== undefined
              ? body.emailRapportHebdomadaire
              : settings.emailRapportHebdomadaire,
          emailRapportMensuel:
            body.emailRapportMensuel !== undefined
              ? body.emailRapportMensuel
              : settings.emailRapportMensuel,
          emailAlerteStagiaire:
            body.emailAlerteStagiaire !== undefined
              ? body.emailAlerteStagiaire
              : settings.emailAlerteStagiaire,
          reportFrequency: body.reportFrequency || settings.reportFrequency,
          delaiAlerteStagiaire,
        },
      });
    }

    logger.info('settings', 'Paramètres de notifications modifiés', {
      emailNouvelleCommande: settings.emailNouvelleCommande,
      reportFrequency: settings.reportFrequency,
    });

    return NextResponse.json({
      success: true,
      message: 'Paramètres de notifications modifiés avec succès',
      data: settings,
    });
  } catch (error) {
    logger.error('settings', 'Erreur lors de la sauvegarde des paramètres de notifications', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/settings/notifications
 * Récupère les paramètres de notifications
 */
export async function GET() {
  try {
    const settings = await prisma.notificationSettings.findFirst();

    if (!settings) {
      // Retourner les paramètres par défaut
      return NextResponse.json({
        success: true,
        data: {
          emailNouvelleCommande: true,
          emailAnnulationCommande: true,
          emailNouveauMessage: true,
          emailRapportJournalier: false,
          emailRapportHebdomadaire: true,
          emailRapportMensuel: true,
          emailAlerteStagiaire: true,
          reportFrequency: 'weekly',
          delaiAlerteStagiaire: 7,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('settings', 'Erreur lors de la récupération des paramètres de notifications', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
