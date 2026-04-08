/**
 * Routes de menus
 */

import { Router } from 'express';
import { listMenus, getMenu, createMenu, updateMenu, deleteMenu } from '../controllers/menus.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', listMenus);
router.get('/:id', getMenu);
router.post('/', createMenu);
router.put('/:id', updateMenu);
router.delete('/:id', deleteMenu);

export default router;
