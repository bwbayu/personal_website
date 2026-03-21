import { Router } from 'express';
import * as CertificationController from './certification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { certificationInsertSchema, certificationUpdateSchema } from './certification.schema';

const router = Router();

router.get('/', CertificationController.getAll);
router.post('/', authMiddleware, validate(certificationInsertSchema), CertificationController.insert);
router.patch('/:id', validateId, authMiddleware, validate(certificationUpdateSchema), CertificationController.update);
router.delete('/:id', validateId, authMiddleware, CertificationController.remove);

export default router;
