/**
 * Routes de permissions
 */

import { Router } from 'express';
import {
  listPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
} from '../controllers/permissions.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/checkPermission.js';

const router = Router();

// Authentification requise pour toutes les routes
router.use(authMiddleware);

// ===== GESTION DES PERMISSIONS (niveau rôle) =====
router.get('/', listPermissions);
router.get('/:id', getPermission);
router.post(
  '/',
  requirePermission('create_permission'),
  createPermission
);
router.put(
  '/:id',
  requirePermission('update_permission'),
  updatePermission
);
router.delete(
  '/:id',
  requirePermission('delete_permission'),
  deletePermission
);

export default router;
