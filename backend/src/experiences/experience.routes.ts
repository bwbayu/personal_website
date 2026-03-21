import { Router } from 'express';
import * as ExperienceController from './experience.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { experienceInsertSchema, experienceUpdateSchema } from './experience.schema';

const router = Router();

router.get('/', ExperienceController.getAll);
router.post('/', authMiddleware, validate(experienceInsertSchema), ExperienceController.insert);
router.patch('/:id', validateId, authMiddleware, validate(experienceUpdateSchema), ExperienceController.update);
router.delete('/:id', validateId, authMiddleware, ExperienceController.remove);

export default router;
