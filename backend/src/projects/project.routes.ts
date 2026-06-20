import { Router } from 'express';
import { createProjectRepository } from './project.repository';
import { createProjectService } from './project.service';
import { createProjectController } from './project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { projectInsertSchema, projectUpdateSchema } from './project.schema';

// Composition root for the projects domain: wire repository -> service -> controller.
const repo = createProjectRepository();
const service = createProjectService(repo);
const controller = createProjectController(service);

const router = Router();

router.get('/', controller.getAll);
router.post('/', authMiddleware, validate(projectInsertSchema), controller.insert);
router.patch('/:id', validateId, authMiddleware, validate(projectUpdateSchema), controller.update);
router.delete('/:id', validateId, authMiddleware, controller.remove);

export default router;
