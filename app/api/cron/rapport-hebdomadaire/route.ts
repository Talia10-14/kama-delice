import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { emailRapportHebdomadaire } from '@/lib/email-templates';

/**
 * GET /api/cron/rapport-hebdomadaire
 * Envoie le rapport hebdomadaire chaque lundi à 8h
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      logger.warn('cron', 'Tentative d\'accès non autorisée à rapport-hebdomadaire', { secret: cronSecret });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le rate limiting
    const rateLimit = await checkRateLimit('rapport-hebdomadaire');
    if (!rateLimit.allowed && !rateLimit.success) {
      logger.warn('cron', 'Rate limit dépassée pour rapport-hebdomadaire', { remaining: rateLimit.remaining });
      return NextResponse.json(
        { error: 'Trop de requêtes', remaining: rateLimit.remaining, resetIn: rateLimit.resetIn },
        { status: 429 }
      );
    }

    logger.info('cron', 'Démarrage du rapport hebdomadaire', {});

    // Calculer les dates de la semaine dernière (lundi à dimanche)
    const aujourd_hui = new Date();
    const jourActuel = aujourd_hui.getDay();
    const debut = new Date(aujourd_hui);
    debut.setDate(debut.getDate() - jourActuel + (jourActuel === 0 ? -6 : 1) - 7);
    debut.setHours(0, 0, 0, 0);

    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 7);

    // Récupérer les commandes de la semaine
    const commandesSemaine = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: debut,
          lt: fin,
        },
      },
    });

    // Calculer les statistiques
    const chiffreAffaires = commandesSemaine.reduce(
      (total: number, cmd: any) => total + (cmd.amount || 0),
      0
    );

    const nombreCommandes = commandesSemaine.length;

    const commandesAnnulees = commandesSemaine.filter(
      (cmd: any) => cmd.status === 'ANNULEE'
    ).length;
    const tauxAnnulation =
      nombreCommandes > 0 ? (commandesAnnulees / nombreCommandes) * 100 : 0;

    // Compter les commandes par jour
    const commandesParJour: Record<string, number> = {
      'Lundi': 0,
      'Mardi': 0,
      'Mercredi': 0,
      'Jeudi': 0,
      'Vendredi': 0,
      'Samedi': 0,
      'Dimanche': 0,
    };

    commandesSemaine.forEach((cmd: any) => {
      const date = new Date(cmd.createdAt);
      const jourIndex = date.getDay();
      const jourNom = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][jourIndex];
      if (commandesParJour[jourNom] !== undefined) {
        commandesParJour[jourNom]++;
      }
    });

    const periodeTexte = `${debut.toLocaleDateString('fr-FR')} au ${fin.toLocaleDateString('fr-FR')}`;

    // Envoyer le rapport par email
    await emailRapportHebdomadaire(periodeTexte, {
      chiffreAffaires,
      nombreCommandes,
      tauxAnnulation,
      commandesParJour,
    });

    logger.info('cron', 'Rapport hebdomadaire envoyé', { chiffreAffaires, nombreCommandes, tauxAnnulation });

    return NextResponse.json({
      success: true,
      data: {
        periode: periodeTexte,
        chiffreAffaires,
        nombreCommandes,
        tauxAnnulation,
        commandesParJour,
      },
    });
  } catch (error) {
    logger.error('cron', 'Erreur lors de la génération du rapport hebdomadaire', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}
