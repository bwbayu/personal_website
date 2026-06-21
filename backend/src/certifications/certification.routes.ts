import { Router } from 'express';
import { createCertificationRepository } from './certification.repository';
import { createCertificationService } from './certification.service';
import { createCertificationController } from './certification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { certificationInsertSchema, certificationUpdateSchema } from './certification.schema';

// Composition root for the certifications domain: wire repository -> service -> controller.
const repo = createCertificationRepository();
const service = createCertificationService(repo);
const controller = createCertificationController(service);

const router = Router();

router.get('/', controller.getAll);
router.post('/', authMiddleware, validate(certificationInsertSchema), controller.insert);
router.patch('/:id', validateId, authMiddleware, validate(certificationUpdateSchema), controller.update);
router.delete('/:id', validateId, authMiddleware, controller.remove);

export default router;
