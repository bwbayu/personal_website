import { Router } from 'express';
import * as MediaSocialController from './mediaSocial.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { mediaSocialInsertSchema, mediaSocialUpdateSchema } from './mediaSocial.schema';

const router = Router();

router.get('/', MediaSocialController.getAll);
router.post('/', authMiddleware, validate(mediaSocialInsertSchema), MediaSocialController.insert);
router.patch('/:id', validateId, authMiddleware, validate(mediaSocialUpdateSchema), MediaSocialController.update);
router.delete('/:id', validateId, authMiddleware, MediaSocialController.remove);

export default router;
