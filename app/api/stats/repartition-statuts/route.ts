import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * GET /api/stats/repartition-statuts
 * Retourne la répartition des commandes par statut
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (normal tier - 30 req/min)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`${ip}:/api/stats/repartition-statuts`, 'normal');
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

    // Compter les commandes par statut
    const statuts = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    // Mapper les statuts avec des couleurs
    const colorMap: Record<string, string> = {
      EN_ATTENTE: '#E8690A',
      ACCEPTEE: '#10b981',
      PREPAREE: '#3b82f6',
      EN_COURS_LIVRAISON: '#f59e0b',
      LIVREE: '#8b5cf6',
      ANNULEE: '#ef4444',
    };

    const data = statuts.map((s: any) => ({
      name: s.status.replace(/_/g, ' '),
      value: s._count,
      fill: colorMap[s.status] || '#6b7280',
    }));

    return NextResponse.json({
      data,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats répartition statuts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
