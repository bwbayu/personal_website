import { Router } from 'express';
import { createAboutRepository } from './about.repository';
import { createAboutService } from './about.service';
import { createAboutController } from './about.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { aboutUpdateSchema } from './about.schema';

// Composition root for the about singleton: wire repository -> service -> controller.
const repo = createAboutRepository();
const service = createAboutService(repo);
const controller = createAboutController(service);

const router = Router();

router.get('/', controller.get);
router.patch('/:id', validateId, authMiddleware, validate(aboutUpdateSchema), controller.update);

export default router;
