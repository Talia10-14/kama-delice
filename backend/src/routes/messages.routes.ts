/**
 * Routes de messages
 */

import { Router } from 'express';
import { listMessages, getMessage, createMessage, updateMessage, deleteMessage } from '../controllers/messages.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listMessages);
router.get('/:id', getMessage);
router.post('/', createMessage);
router.put('/:id', updateMessage);
router.delete('/:id', deleteMessage);

export default router;
