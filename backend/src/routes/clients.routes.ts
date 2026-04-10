/**
 * Routes de clients
 */

import { Router } from 'express';
import { listClients, getClient, createClient, updateClient, deleteClient } from '../controllers/clients.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
