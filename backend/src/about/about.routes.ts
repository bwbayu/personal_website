import { Router } from 'express';
import * as AboutController from './about.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { aboutUpdateSchema } from './about.schema';

const router = Router();

router.get('/', AboutController.get);
router.patch('/:id', validateId, authMiddleware, validate(aboutUpdateSchema), AboutController.update);

export default router;
