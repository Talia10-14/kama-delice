import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * GET /api/stats/commandes-par-jour
 * Retourne le nombre de commandes par jour de la semaine
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (normal tier - 30 req/min)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/stats/commandes-par-jour`, 'normal');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { status: 429, headers: { 'Retry-After': (rateLimit.resetInSeconds || 60).toString() } }
      );
    }

    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Calculer la semaine actuelle
    const aujourd_hui = new Date();
    const jourActuel = aujourd_hui.getDay();
    const debut = new Date(aujourd_hui);
    debut.setDate(debut.getDate() - (jourActuel === 0 ? 6 : jourActuel - 1));
    debut.setHours(0, 0, 0, 0);

    // Récupérer les commandes de la semaine
    const commandes = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: debut,
          lt: new Date(debut.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Initialiser le compteur par jour
    const commandesParJour = {
      Lundi: 0,
      Mardi: 0,
      Mercredi: 0,
      Jeudi: 0,
      Vendredi: 0,
      Samedi: 0,
      Dimanche: 0,
    };

    // Compter les commandes par jour
    commandes.forEach((cmd: any) => {
      const jour = cmd.createdAt.getDay();
      const jourNom = [
        'Dimanche',
        'Lundi',
        'Mardi',
        'Mercredi',
        'Jeudi',
        'Vendredi',
        'Samedi',
      ][jour];

      if (commandesParJour[jourNom as keyof typeof commandesParJour] !== undefined) {
        commandesParJour[jourNom as keyof typeof commandesParJour]++;
      }
    });

    // Convertir en format chart (en commençant par lundi)
    const data = [
      { jour: 'Lundi', nombre: commandesParJour.Lundi },
      { jour: 'Mardi', nombre: commandesParJour.Mardi },
      { jour: 'Mercredi', nombre: commandesParJour.Mercredi },
      { jour: 'Jeudi', nombre: commandesParJour.Jeudi },
      { jour: 'Vendredi', nombre: commandesParJour.Vendredi },
      { jour: 'Samedi', nombre: commandesParJour.Samedi },
      { jour: 'Dimanche', nombre: commandesParJour.Dimanche },
    ];

    return NextResponse.json({
      data,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats commandes par jour:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
