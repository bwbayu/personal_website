import { Router } from 'express';
import { createExperienceRepository } from './experience.repository';
import { createExperienceService } from './experience.service';
import { createExperienceController } from './experience.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { experienceInsertSchema, experienceUpdateSchema } from './experience.schema';

// Composition root for the experiences domain: wire repository -> service -> controller.
const repo = createExperienceRepository();
const service = createExperienceService(repo);
const controller = createExperienceController(service);

const router = Router();

router.get('/', controller.getAll);
router.post('/', authMiddleware, validate(experienceInsertSchema), controller.insert);
router.patch('/:id', validateId, authMiddleware, validate(experienceUpdateSchema), controller.update);
router.delete('/:id', validateId, authMiddleware, controller.remove);

export default router;
