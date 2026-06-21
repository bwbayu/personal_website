import { Router } from 'express';
import { createAchievementRepository } from './achievements.repository';
import { createAchievementService } from './achievements.service';
import { createAchievementController } from './achievement.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { achievementInsertSchema, achievementUpdateSchema } from './achievements.schema';

// Composition root for the achievements domain: wire repository -> service -> controller.
const repo = createAchievementRepository();
const service = createAchievementService(repo);
const controller = createAchievementController(service);

const router = Router();

router.get('/', controller.getAll);
router.post('/', authMiddleware, validate(achievementInsertSchema), controller.insert);
router.patch('/:id', validateId, authMiddleware, validate(achievementUpdateSchema), controller.update);
router.delete('/:id', validateId, authMiddleware, controller.remove);

export default router;
