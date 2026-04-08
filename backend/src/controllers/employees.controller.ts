/**
 * Contrôleur d'employés
 */

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { CreateEmployeeInput, UpdateEmployeeInput } from '../validators/employee.validator';
import { hashPassword } from '../utils/password';

/**
 * Lister tous les employés
 */
export async function listEmployees(req: Request, res: Response) {
  try {
    const { roleId, status } = req.query;

    const where: Record<string, unknown> = {};

    if (roleId) {
      where.roleId = roleId;
    }

    if (status) {
      where.status = status;
    }

    const employees = await prisma.user.findMany({
      where,
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(employees));
  } catch (error) {
    console.error('Erreur lors de la récupération des employés:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * Obtenir un employé
 */
export async function getEmployee(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Valider le format UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      res.status(400).json(errorResponse('ID invalide'));
      return;
    }

    const employee = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!employee) {
      res.status(404).json(errorResponse('Employé non trouvé'));
      return;
    }

    res.json(successResponse(employee));
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'employé:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * Créer un employé
 */
export async function createEmployee(
  req: Request<{}, {}, CreateEmployeeInput>,
  res: Response
) {
  try {
    const { email, firstName, lastName, phone, roleId } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json(errorResponse('Cet email est déjà utilisé'));
      return;
    }

    // Créer l'employé avec un mot de passe temporaire cryptographiquement sûr
    const crypto = require('crypto');
    const temporaryPassword = crypto.randomBytes(16).toString('hex');
    // À implémenter: envoyer le mot de passe par email/WhatsApp
    const hashedPassword = await hashPassword(temporaryPassword);

    const employee = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        roleId,
      },
      include: { role: true },
    });

    res.status(201).json(successResponse(employee));
  } catch (error) {
    console.error('Erreur lors de la création de l\'employé:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * Mettre à jour un employé
 */
export async function updateEmployee(
  req: Request<{ id: string }, {}, UpdateEmployeeInput>,
  res: Response
) {
  try {
    const { id } = req.params;
    
    // Valider le format UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      res.status(400).json(errorResponse('ID invalide'));
      return;
    }
    const { firstName, lastName, phone, roleId, status } = req.body;

    const employee = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(roleId && { roleId }),
        ...(status && { status }),
      },
      include: { role: true },
    });

    res.json(successResponse(employee));
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'employé:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}

/**
 * Supprimer un employé
 */
export async function deleteEmployee(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Valider le format UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      res.status(400).json(errorResponse('ID invalide'));
      return;
    }

    // Soft delete (marquer comme inactif)
    await prisma.user.update({
      where: { id },
      data: { status: 'inactive' },
    });

    res.json(successResponse({}, 'Employé supprimé'));
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'employé:', error);
    res.status(500).json(errorResponse('Erreur serveur'));
  }
}
