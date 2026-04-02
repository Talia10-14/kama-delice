import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { emailRapportMensuel } from '@/lib/email-templates';

/**
 * GET /api/cron/rapport-mensuel
 * Envoie le rapport mensuel le 1er de chaque mois à 8h
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      logger.warn('cron', 'Tentative d\'accès non autorisée à rapport-mensuel', { secret: cronSecret });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le rate limiting
    const rateLimit = await checkRateLimit('rapport-mensuel');
    if (!rateLimit.allowed && !rateLimit.success) {
      logger.warn('cron', 'Rate limit dépassée pour rapport-mensuel', { remaining: rateLimit.remaining });
      return NextResponse.json(
        { error: 'Trop de requêtes', remaining: rateLimit.remaining, resetIn: rateLimit.resetIn },
        { status: 429 }
      );
    }

    logger.info('cron', 'Démarrage du rapport mensuel', {});

    // Calculer les dates du mois dernier
    const aujourd_hui = new Date();
    const debut = new Date(aujourd_hui.getFullYear(), aujourd_hui.getMonth() - 1, 1);
    const fin = new Date(aujourd_hui.getFullYear(), aujourd_hui.getMonth(), 1);

    // Récupérer les commandes du mois
    const commandesMois = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: debut,
          lt: fin,
        },
      },
    });

    // Récupérer les commandes du mois précédent pour la comparaison
    const debutPrecedent = new Date(debut);
    debutPrecedent.setMonth(debutPrecedent.getMonth() - 1);
    const finPrecedent = new Date(debutPrecedent);
    finPrecedent.setMonth(finPrecedent.getMonth() + 1);

    const commandesPrecedent = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: debutPrecedent,
          lt: finPrecedent,
        },
      },
    });

    // Calculer les statistiques du mois actuel
    const chiffreAffaires = commandesMois.reduce(
      (total: number, cmd: any) => total + (cmd.amount || 0),
      0
    );

    const nombreCommandes = commandesMois.length;

    const commandesAnnulees = commandesMois.filter(
      (cmd: any) => cmd.status === 'ANNULEE'
    ).length;
    const tauxAnnulation =
      nombreCommandes > 0 ? (commandesAnnulees / nombreCommandes) * 100 : 0;

    // Calculer la croissance par rapport au mois précédent
    const chiffreAffairesPrecedent = commandesPrecedent.reduce(
      (total: number, cmd: any) => total + (cmd.amount || 0),
      0
    );

    const tauxCroissance =
      chiffreAffairesPrecedent > 0
        ? ((chiffreAffaires - chiffreAffairesPrecedent) / chiffreAffairesPrecedent) * 100
        : 0;

    const moisTexte = debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // Envoyer le rapport par email
    await emailRapportMensuel(moisTexte, {
      chiffreAffaires,
      nombreCommandes,
      tauxAnnulation,
      tauxCroissance,
    });

    logger.info('cron', 'Rapport mensuel envoyé', { chiffreAffaires, nombreCommandes, tauxCroissance });

    return NextResponse.json({
      success: true,
      data: {
        mois: moisTexte,
        chiffreAffaires,
        nombreCommandes,
        tauxAnnulation,
        tauxCroissance,
      },
    });
  } catch (error) {
    logger.error('cron', 'Erreur lors de la génération du rapport mensuel', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}
