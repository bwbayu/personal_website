import { Router } from 'express';
import * as EducationController from './education.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { educationInsertSchema, educationUpdateSchema } from './education.schema';

const router = Router();

router.get('/', EducationController.getAll);
router.post('/', authMiddleware, validate(educationInsertSchema), EducationController.insert);
router.patch('/:id', validateId, authMiddleware, validate(educationUpdateSchema), EducationController.update);
router.delete('/:id', validateId, authMiddleware, EducationController.remove);

export default router;
