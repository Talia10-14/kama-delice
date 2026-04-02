import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stats/top-plats
 * Retourne le top 5 des plats les plus commandés avec leur CA
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer toutes les commandes avec leurs articles
    // NOTE: L'Order model actuel n'a pas de relation articles
    // Pour l'instant, retourner des données vides
    // TODO: Ajouter la relation articles au Order model
    const platStats: Record<string, { nom: string; quantite: number; ca: number }> = {};

    // Trier par quantité et prendre le top 5
    const topPlats = Object.values(platStats)
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 5)
      .map((plat) => ({
        nom: plat.nom,
        quantite: plat.quantite,
        chiffreAffaires: plat.ca,
      }));

    return NextResponse.json({
      data: topPlats,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats top plats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
