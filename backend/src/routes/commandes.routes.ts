/**
 * Routes de commandes
 */

import { Router } from 'express';
import { listCommandes, getCommande, createCommande, updateCommande, deleteCommande } from '../controllers/commandes.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listCommandes);
router.get('/:id', getCommande);
router.post('/', createCommande);
router.put('/:id', updateCommande);
router.delete('/:id', deleteCommande);

export default router;
