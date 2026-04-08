/**
 * Routes d'employés
 */

import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employees.controller';
import {
  getEmployeePermissions as getEmployeePermissionsCtrl,
  grantEmployeePermission as grantEmployeePermissionCtrl,
  revokeEmployeePermission as revokeEmployeePermissionCtrl,
  resetEmployeePermissions as resetEmployeePermissionsCtrl,
} from '../controllers/permissions.controller';
import { authMiddleware } from '../middlewares/auth';
import { requirePermission, requireRole } from '../middlewares/checkPermission';
import { validateBody } from '../middlewares/validateBody';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validator';
import {
  grantPermissionSchema,
  revokePermissionSchema,
} from '../validators/permission.validator';

const router = Router();

// Authentification requise pour toutes les routes
router.use(authMiddleware);

// ===== GESTION DES EMPLOYÉS =====
router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.post('/', requirePermission('create_employee'), validateBody(createEmployeeSchema), createEmployee);
router.put('/:id', requirePermission('update_employee'), validateBody(updateEmployeeSchema), updateEmployee);
router.delete('/:id', requirePermission('delete_employee'), deleteEmployee);

// ===== GESTION DES PERMISSIONS INDIVIDUELLES D'UN EMPLOYÉ =====
router.get('/:id/permissions', getEmployeePermissionsCtrl);
router.post(
  '/:id/permissions/grant',
  requireRole('admin'),
  validateBody(grantPermissionSchema),
  grantEmployeePermissionCtrl
);
router.post(
  '/:id/permissions/revoke',
  requireRole('admin'),
  validateBody(revokePermissionSchema),
  revokeEmployeePermissionCtrl
);
router.delete(
  '/:id/permissions/reset',
  requireRole('admin'),
  resetEmployeePermissionsCtrl
);

export default router;
