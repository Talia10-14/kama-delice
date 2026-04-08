/**
 * Contrôleur de permissions
 */

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import {
  getPermissionsDetail,
  grantPermission,
  revokePermission,
  resetPermissions,
  invalidateEmployeePermissionsCache,
} from '../services/permission.service';
import { clearRequestPermissionsCache } from '../middlewares/checkPermission';

/**
 * GET /api/permissions
 * Retourner toutes les permissions disponibles
 */
export async function listPermissions(_req: Request, res: Response) {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(successResponse(permissions));
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * GET /api/permissions/:id
 * Obtenir une permission spécifique
 */
export async function getPermission(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      res.status(404).json(errorResponse('Permission non trouvée'));
      return;
    }

    res.json(successResponse(permission));
  } catch (error) {
    console.error('Erreur lors de la récupération de la permission:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * POST /api/permissions
 * Créer une nouvelle permission
 */
export async function createPermission(req: Request, res: Response) {
  try {
    const { name, codeName, description } = req.body;

    if (!name || !codeName) {
      res.status(400).json(errorResponse('Nom et code requis'));
      return;
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        codeName,
        description,
      },
    });

    res.status(201).json(successResponse(permission));
  } catch (error) {
    console.error('Erreur lors de la création de la permission:', error);
    if ((error as any).code === 'P2002') {
      res.status(400).json(errorResponse('Ce code de permission existe déjà'));
      return;
    }
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * PUT /api/permissions/:id
 * Mettre à jour une permission
 */
export async function updatePermission(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const permission = await prisma.permission.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    res.json(successResponse(permission));
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la permission:', error);
    if ((error as any).code === 'P2025') {
      res.status(404).json(errorResponse('Permission non trouvée'));
      return;
    }
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * DELETE /api/permissions/:id
 * Supprimer une permission
 */
export async function deletePermission(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.permission.delete({
      where: { id },
    });

    res.json(successResponse({ message: 'Permission supprimée avec succès' }));
  } catch (error) {
    console.error('Erreur lors de la suppression de la permission:', error);
    if ((error as any).code === 'P2025') {
      res.status(404).json(errorResponse('Permission non trouvée'));
      return;
    }
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * GET /api/employees/:id/permissions
 * Obtenir le détail des permissions d'un employé
 */
export async function getEmployeePermissions(req: Request, res: Response) {
  try {
    const { id: employeeId } = req.params;

    // Vérifier que l'employé existe
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      res.status(404).json(errorResponse('Employé non trouvé'));
      return;
    }

    const detail = await getPermissionsDetail(employeeId);

    res.json(successResponse(detail));
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions de l\'employé:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * POST /api/employees/:id/permissions/grant
 * Ajouter une permission à un employé
 */
export async function grantEmployeePermission(req: Request, res: Response) {
  try {
    const { id: employeeId } = req.params;
    const { permissionId, reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json(errorResponse('Authentification requise'));
      return;
    }

    if (!permissionId) {
      res.status(400).json(errorResponse('permissionId requis'));
      return;
    }

    // Vérifier que l'employé existe
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      res.status(404).json(errorResponse('Employé non trouvé'));
      return;
    }

    // Accorder la permission
    await grantPermission(employeeId, permissionId, adminId, reason);

    // Invalider le cache
    invalidateEmployeePermissionsCache(employeeId);
    clearRequestPermissionsCache();

    // Retourner les permissions mises à jour
    const detail = await getPermissionsDetail(employeeId);

    res.json(successResponse(detail));
  } catch (error) {
    console.error('Erreur lors de l\'octroi de la permission:', error);
    const message = (error as Error).message;
    if (message.includes('déjà accordée')) {
      res.status(400).json(errorResponse(message));
      return;
    }
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * POST /api/employees/:id/permissions/revoke
 * Retirer une permission à un employé
 */
export async function revokeEmployeePermission(req: Request, res: Response) {
  try {
    const { id: employeeId } = req.params;
    const { permissionId, reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json(errorResponse('Authentification requise'));
      return;
    }

    if (!permissionId) {
      res.status(400).json(errorResponse('permissionId requis'));
      return;
    }

    // Vérifier que l'employé existe
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      res.status(404).json(errorResponse('Employé non trouvé'));
      return;
    }

    // Retirer la permission
    await revokePermission(employeeId, permissionId, adminId, reason);

    // Invalider le cache
    invalidateEmployeePermissionsCache(employeeId);
    clearRequestPermissionsCache();

    // Retourner les permissions mises à jour
    const detail = await getPermissionsDetail(employeeId);

    res.json(successResponse(detail));
  } catch (error) {
    console.error('Erreur lors du retrait de la permission:', error);
    const message = (error as Error).message;
    if (message.includes('déjà retirée')) {
      res.status(400).json(errorResponse(message));
      return;
    }
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * DELETE /api/employees/:id/permissions/reset
 * Réinitialiser toutes les permissions individuelles d'un employé
 */
export async function resetEmployeePermissions(req: Request, res: Response) {
  try {
    const { id: employeeId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json(errorResponse('Authentification requise'));
      return;
    }

    // Vérifier que l'employé existe
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      res.status(404).json(errorResponse('Employé non trouvé'));
      return;
    }

    // Réinitialiser les permissions
    await resetPermissions(employeeId, adminId);

    // Invalider le cache
    invalidateEmployeePermissionsCache(employeeId);
    clearRequestPermissionsCache();

    res.json(
      successResponse({
        message: 'Permissions réinitialisées avec succès',
      })
    );
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des permissions:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}
