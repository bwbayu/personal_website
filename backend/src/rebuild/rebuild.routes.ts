import { Router } from 'express';
import { createRebuildController } from './rebuild.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const controller = createRebuildController();

const router = Router();

// Authed, shared across domains (S5 daily-log reuses it); not under /posts.
router.post('/', authMiddleware, controller.trigger);

export default router;
