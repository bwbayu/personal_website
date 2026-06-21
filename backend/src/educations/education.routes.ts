import { Router } from 'express';
import { createEducationRepository } from './education.repository';
import { createEducationService } from './education.service';
import { createEducationController } from './education.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { educationInsertSchema, educationUpdateSchema } from './education.schema';

// Composition root for the educations domain: wire repository -> service -> controller.
const repo = createEducationRepository();
const service = createEducationService(repo);
const controller = createEducationController(service);

const router = Router();

router.get('/', controller.getAll);
router.post('/', authMiddleware, validate(educationInsertSchema), controller.insert);
router.patch('/:id', validateId, authMiddleware, validate(educationUpdateSchema), controller.update);
router.delete('/:id', validateId, authMiddleware, controller.remove);

export default router;
