/**
 * Service de gestion des permissions
 */

import prisma from '../config/prisma';
import { securityLogger } from '../utils/security-logger';

// Cache pour les permissions effectives (userId -> permissionCodes[])
// Clé: userId, Valeur: { permissions: string[], expiresAt: number }
const permissionsCache = new Map<string, { permissions: string[]; expiresAt: number }>();

// Durée du cache en millisecondes (5 minutes)  
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Invalider le cache pour un employé
 */
export function invalidateEmployeePermissionsCache(employeeId: string): void {
  permissionsCache.delete(employeeId);
}

/**
 * Obtenir les permissions effectives d'un employé
 * Combine les permissions du rôle avec les modifications individuelles (GRANT/REVOKE)
 */
export async function getEffectivePermissions(employeeId: string): Promise<string[]> {
  // Vérifier le cache
  const cached = permissionsCache.get(employeeId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  try {
    // 1. Récupérer l'employé et ses permissions du rôle
    const user = await prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    // Admin a toutes les permissions
    if (user.role?.name === 'admin') {
      const allPermissions = await prisma.permission.findMany();
      const allCodes = allPermissions.map((p) => p.codeName);
      
      // Mettre en cache
      permissionsCache.set(employeeId, {
        permissions: allCodes,
        expiresAt: Date.now() + CACHE_TTL,
      });
      
      return allCodes;
    }

    // 2. Récupérer les permissions du rôle
    const rolePermissions = new Set(
      user.role?.permissions.map((p) => p.codeName) || []
    );

    // 3. Récupérer les modifications individuelles (GRANT/REVOKE)
    const employeePermissions = await prisma.employeePermission.findMany({
      where: { employeeId },
      include: { permission: true },
    }) as Array<{ type: 'GRANT' | 'REVOKE'; permission: { codeName: string } }>;

    // 4. Appliquer les GRANT et REVOKE
    for (const ep of employeePermissions) {
      if (ep.type === 'GRANT') {
        rolePermissions.add(ep.permission.codeName);
      } else if (ep.type === 'REVOKE') {
        rolePermissions.delete(ep.permission.codeName);
      }
    }

    // 5. Retourner la liste finale sans doublons
    const effectivePermissions = Array.from(rolePermissions);

    // Mettre en cache
    permissionsCache.set(employeeId, {
      permissions: effectivePermissions,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return effectivePermissions;
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions effectives:', error);
    return [];
  }
}

/**
 * Vérifier si un employé a une permission effective
 */
export async function hasEffectivePermission(
  employeeId: string,
  code: string
): Promise<boolean> {
  const permissions = await getEffectivePermissions(employeeId);
  return permissions.includes(code);
}

/**
 * Obtenir le détail des permissions (rôle, individuelles, effectives)
 */
export async function getPermissionsDetail(employeeId: string): Promise<{
  fromRole: Array<{ id: string; name: string; codeName: string; description?: string }>;
  individualGrant: Array<{
    id: string;
    permission: { id: string; name: string; codeName: string };
    addedBy: { id: string; firstName: string; lastName: string };
    reason?: string;
    createdAt: Date;
  }>;
  individualRevoke: Array<{
    id: string;
    permission: { id: string; name: string; codeName: string };
    addedBy: { id: string; firstName: string; lastName: string };
    reason?: string;
    createdAt: Date;
  }>;
  effective: string[];
}> {
  try {
    // Récupérer l'employé
    const user = await prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!user) {
      throw new Error('Employé non trouvé');
    }

    // Permissions du rôle
    const fromRole = user.role?.permissions || [];

    // Permissions individuelles
    const employeePerms = await prisma.employeePermission.findMany({
      where: { employeeId },
      include: {
        permission: true,
        addedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const individualGrant = employeePerms
      .filter((ep: any) => ep.type === 'GRANT')
      .map((ep: any) => ({
        id: ep.id,
        permission: {
          id: ep.permission.id,
          name: ep.permission.name,
          codeName: ep.permission.codeName,
        },
        addedBy: ep.addedBy,
        reason: ep.reason,
        createdAt: ep.createdAt,
      }));

    const individualRevoke = employeePerms
      .filter((ep: any) => ep.type === 'REVOKE')
      .map((ep: any) => ({
        id: ep.id,
        permission: {
          id: ep.permission.id,
          name: ep.permission.name,
          codeName: ep.permission.codeName,
        },
        addedBy: ep.addedBy,
        reason: ep.reason,
        createdAt: ep.createdAt,
      }));

    // Permissions effectives
    const effective = await getEffectivePermissions(employeeId);

    return {
      fromRole: fromRole as any,
      individualGrant,
      individualRevoke,
      effective,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du détail des permissions:', error);
    throw error;
  }
}

/**
 * Ajouter une permission à un employé individuellement (GRANT)
 */
export async function grantPermission(
  employeeId: string,
  permissionId: string,
  adminId: string,
  reason?: string
): Promise<void> {
  try {
    // Vérifier que la permission n'est pas déjà GRANT
    const existing = await prisma.employeePermission.findUnique({
      where: {
        employeeId_permissionId_type: {
          employeeId,
          permissionId,
          type: 'GRANT',
        },
      },
    });

    if (existing) {
      throw new Error('Cette permission est déjà accordée individuellement');
    }

    // Supprimer un éventuel REVOKE existant
    await prisma.employeePermission.deleteMany({
      where: {
        employeeId,
        permissionId,
        type: 'REVOKE',
      },
    });

    // Créer la nouvelle permission GRANT
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new Error('Permission non trouvée');
    }

    await prisma.employeePermission.create({
      data: {
        employeeId,
        permissionId,
        type: 'GRANT',
        addedById: adminId,
        reason,
      },
    });

    // Invalider le cache
    invalidateEmployeePermissionsCache(employeeId);

    // Logger l'événement
    securityLogger.info('PERMISSION_GRANTED', {
      employeeId,
      permissionCode: permission.codeName,
      adminId,
      reason,
    });
  } catch (error) {
    console.error('Erreur lors de l\'accordage de permission:', error);
    throw error;
  }
}

/**
 * Retirer une permission à un employé individuellement (REVOKE)
 */
export async function revokePermission(
  employeeId: string,
  permissionId: string,
  adminId: string,
  reason?: string
): Promise<void> {
  try {
    // Vérifier que la permission n'est pas déjà REVOKE
    const existing = await prisma.employeePermission.findUnique({
      where: {
        employeeId_permissionId_type: {
          employeeId,
          permissionId,
          type: 'REVOKE',
        },
      },
    });

    if (existing) {
      throw new Error('Cette permission est déjà retirée individuellement');
    }

    // Supprimer un éventuel GRANT existant
    await prisma.employeePermission.deleteMany({
      where: {
        employeeId,
        permissionId,
        type: 'GRANT',
      },
    });

    // Créer la nouvelle permission REVOKE
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new Error('Permission non trouvée');
    }

    await prisma.employeePermission.create({
      data: {
        employeeId,
        permissionId,
        type: 'REVOKE',
        addedById: adminId,
        reason,
      },
    });

    // Invalider le cache
    invalidateEmployeePermissionsCache(employeeId);

    // Logger l'événement
    securityLogger.info('PERMISSION_REVOKED', {
      employeeId,
      permissionCode: permission.codeName,
      adminId,
      reason,
    });
  } catch (error) {
    console.error('Erreur lors du retrait de permission:', error);
    throw error;
  }
}

/**
 * Réinitialiser toutes les permissions individuelles d'un employé
 */
export async function resetPermissions(employeeId: string, adminId: string): Promise<void> {
  try {
    // Supprimer toutes les EmployeePermission
    await prisma.employeePermission.deleteMany({
      where: { employeeId },
    });

    // Invalider le cache
    invalidateEmployeePermissionsCache(employeeId);

    // Logger l'événement
    securityLogger.info('PERMISSIONS_RESET', {
      employeeId,
      adminId,
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des permissions:', error);
    throw error;
  }
}

/**
 * Obtenir les permissions d'un utilisateur (fonction legacy)
 * Utilise maintenant getEffectivePermissions
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  return getEffectivePermissions(userId);
}

/**
 * Vérifier si un utilisateur a une permission (fonction legacy)
 * Utilise maintenant hasEffectivePermission
 */
export async function userHasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  return hasEffectivePermission(userId, permissionCode);
}

/**
 * Créer une permission
 */
export async function createPermission(
  name: string,
  codeName: string,
  description?: string
) {
  try {
    const permission = await prisma.permission.create({
      data: {
        name,
        codeName,
        description,
      },
    });

    return permission;
  } catch (error) {
    console.error('Erreur lors de la création de la permission:', error);
    throw error;
  }
}

/**
 * Assigner une permission à un rôle
 */
export async function assignPermissionToRole(
  roleId: string,
  permissionId: string
) {
  try {
    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: { id: permissionId },
        },
      },
      include: {
        permissions: true,
      },
    });

    return role;
  } catch (error) {
    console.error(
      'Erreur lors de l\'assignation de permission au rôle:',
      error
    );
    throw error;
  }
}
