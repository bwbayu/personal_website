import { Router } from 'express';
import { createMediaSocialRepository } from './mediaSocial.repository';
import { createMediaSocialService } from './mediaSocial.service';
import { createMediaSocialController } from './mediaSocial.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { mediaSocialInsertSchema, mediaSocialUpdateSchema } from './mediaSocial.schema';

// Composition root for the media-socials domain: wire repository -> service -> controller.
const repo = createMediaSocialRepository();
const service = createMediaSocialService(repo);
const controller = createMediaSocialController(service);

const router = Router();

router.get('/', controller.getAll);
router.post('/', authMiddleware, validate(mediaSocialInsertSchema), controller.insert);
router.patch('/:id', validateId, authMiddleware, validate(mediaSocialUpdateSchema), controller.update);
router.delete('/:id', validateId, authMiddleware, controller.remove);

export default router;
