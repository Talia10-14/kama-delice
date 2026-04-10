/**
 * Configuration base de données
 */

import prisma from './prisma.js';

export { prisma };

/**
 * Vérifier la connexion à la base de données
 */
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connexion à la base de données établie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
}

/**
 * Fermer la connexion à la base de données
 */
export async function closeDatabaseConnection() {
  try {
    await prisma.$disconnect();
    console.log('✅ Connexion à la base de données fermée');
  } catch (error) {
    console.error(
      '❌ Erreur lors de la fermeture de la base de données:',
      error
    );
  }
}
