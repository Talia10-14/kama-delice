import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stats/ca-journalier?periode=30
 * Retourne l'évolution du CA sur les X derniers jours
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer la période
    const periode = parseInt(request.nextUrl.searchParams.get('periode') || '30');

    // Calculer les dates
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - periode);
    dateDebut.setHours(0, 0, 0, 0);

    const dateFin = new Date();
    dateFin.setHours(23, 59, 59, 999);

    // Récupérer les commandes de la période
    const commandes = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
      select: {
        createdAt: true,
        amount: true,
        status: true,
      },
    });

    // Organiser par jour
    const dataParJour: Record<string, number> = {};
    const date = new Date(dateDebut);

    while (date <= dateFin) {
      const cle = date.toISOString().split('T')[0];
      dataParJour[cle] = 0;
      date.setDate(date.getDate() + 1);
    }

    // Calculer le CA par jour
    commandes.forEach((cmd: any) => {
      const cle = cmd.createdAt.toISOString().split('T')[0];
      if (dataParJour[cle] !== undefined) {
        dataParJour[cle] += cmd.amount || 0;
      }
    });

    // Convertir en format chart
    const data = Object.entries(dataParJour).map(([date, ca]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      ca,
    }));

    return NextResponse.json({
      period: `${periode} jours`,
      data,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats CA journalier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
