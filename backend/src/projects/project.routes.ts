import { Router } from 'express';
import * as ProjectController from './project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { projectInsertSchema, projectUpdateSchema } from './project.schema';

const router = Router();

router.get('/', ProjectController.getAll);
router.post('/', authMiddleware, validate(projectInsertSchema), ProjectController.insert);
router.patch('/:id', validateId, authMiddleware, validate(projectUpdateSchema), ProjectController.update);
router.delete('/:id', validateId, authMiddleware, ProjectController.remove);

export default router;
