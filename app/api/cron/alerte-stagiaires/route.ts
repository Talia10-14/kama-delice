import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { emailAlerteStagiaire } from '@/lib/email-templates';

/**
 * GET /api/cron/alerte-stagiaires
 * Envoie une alerte pour les stagiaires dont le stage se termine bientôt
 * S'exécute chaque matin à 8h
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      logger.warn('cron', 'Tentative d\'accès non autorisée à alerte-stagiaires', { secret: cronSecret });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le rate limiting
    const rateLimit = await checkRateLimit('alerte-stagiaires');
    if (!rateLimit.allowed && !rateLimit.success) {
      logger.warn('cron', 'Rate limit dépassée pour alerte-stagiaires', { remaining: rateLimit.remaining });
      return NextResponse.json(
        { error: 'Trop de requêtes', remaining: rateLimit.remaining, resetIn: rateLimit.resetIn },
        { status: 429 }
      );
    }

    logger.info('cron', 'Démarrage de la vérification des alertes stagiaires', {});

    // Récupérer le délai d'alerte depuis les variables d'environnement (par défaut 7 jours)
    const delaiAlerte = parseInt(process.env.DELAI_ALERTE_STAGIAIRE || '7');

    // Calculer les dates
    const aujourd_hui = new Date();
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() + delaiAlerte);

    // Récupérer les stagiaires dont le stage se termine bientôt
    const stagiairesFinisSemaine = await prisma.employee.findMany({
      where: {
        typeContrat: 'STAGIAIRE',
        statut: 'ACTIF',
        dateFin: {
          gt: aujourd_hui,
          lte: dateLimite,
        },
      },
      orderBy: { dateFin: 'asc' },
    });

    // Envoyer une alerte pour chaque stagiaire
    for (const stagiaire of stagiairesFinisSemaine) {
      if (stagiaire.dateFin) {
        await emailAlerteStagiaire(stagiaire.nom, stagiaire.prenom, stagiaire.dateFin);
      }
    }

    logger.info('cron', 'Alertes stagiaires envoyées', { count: stagiairesFinisSemaine.length });

    return NextResponse.json({
      success: true,
      data: {
        stagiaireControlles: stagiairesFinisSemaine.length,
        stagiaires: stagiairesFinisSemaine.map((s: any) => ({
          id: s.id,
          nom: s.nom,
          prenom: s.prenom,
          dateFin: s.dateFin,
        })),
      },
    });
  } catch (error) {
    logger.error('cron', 'Erreur lors de la vérification des alertes stagiaires', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification des alertes' },
      { status: 500 }
    );
  }
}
