import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { emailRapportJournalier } from '@/lib/email-templates';

/**
 * GET /api/cron/rapport-journalier
 * Envoie le rapport journalier avec statistiques du jour
 * S'exécute chaque soir à 23h via Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      logger.warn('cron', 'Tentative d\'accès non autorisée à rapport-journalier', { secret: cronSecret });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le rate limiting
    const rateLimit = await checkRateLimit('rapport-journalier');
    if (!rateLimit.allowed && !rateLimit.success) {
      logger.warn('cron', 'Rate limit dépassée pour rapport-journalier', { remaining: rateLimit.remaining });
      return NextResponse.json(
        { error: 'Trop de requêtes', remaining: rateLimit.remaining, resetIn: rateLimit.resetIn },
        { status: 429 }
      );
    }

    logger.info('cron', 'Démarrage du rapport journalier', {});

    // Récupérer la date d'aujourd'hui (minuit UTC)
    const aujourd_hui = new Date();
    aujourd_hui.setHours(0, 0, 0, 0);

    const demain = new Date(aujourd_hui);
    demain.setDate(demain.getDate() + 1);

    // Calculer le chiffre d'affaires du jour
    const commandesDuJour = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: aujourd_hui,
          lt: demain,
        },
      },
    });

    const chiffreAffaires = commandesDuJour.reduce(
      (total: number, cmd: any) => total + (cmd.amount || 0),
      0
    );

    // Compter les commandes
    const nbCommandes = commandesDuJour.length;

    // Calculer le taux d'annulation
    const commandesAnnulees = commandesDuJour.filter(
      (cmd: any) => cmd.status === 'ANNULEE'
    ).length;
    const tauxAnnulation =
      nbCommandes > 0 ? (commandesAnnulees / nbCommandes) * 100 : 0;

    // Envoyer le rapport par email
    await emailRapportJournalier(aujourd_hui, chiffreAffaires, nbCommandes, tauxAnnulation);

    logger.info('cron', 'Rapport journalier envoyé', { chiffreAffaires, nbCommandes, tauxAnnulation });

    return NextResponse.json({
      success: true,
      data: {
        date: aujourd_hui,
        chiffreAffaires,
        nbCommandes,
        tauxAnnulation,
      },
    });
  } catch (error) {
    logger.error('cron', 'Erreur lors de la génération du rapport journalier', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}
