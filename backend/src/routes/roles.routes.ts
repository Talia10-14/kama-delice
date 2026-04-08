/**
 * Routes de rôles
 */

import { Router } from 'express';
import { listRoles, getRole, createRole, updateRole, deleteRole } from '../controllers/roles.controller';
import { authMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/checkPermission';

const router = Router();
router.use(authMiddleware);

router.get('/', listRoles);
router.get('/:id', getRole);
router.post('/', requirePermission('create_role'), createRole);
router.put('/:id', requirePermission('update_role'), updateRole);
router.delete('/:id', requirePermission('delete_role'), deleteRole);

export default router;
