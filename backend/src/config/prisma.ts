/**
 * Client Prisma
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'], // Désactiver query logging en production pour éviter les fuites d'information
});

export default prisma;
