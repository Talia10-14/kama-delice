/**
 * Routes de finances
 */

import { Router } from 'express';
import { listFinances, getFinance, createFinance, updateFinance, deleteFinance } from '../controllers/finances.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', listFinances);
router.get('/:id', getFinance);
router.post('/', createFinance);
router.put('/:id', updateFinance);
router.delete('/:id', deleteFinance);

export default router;
