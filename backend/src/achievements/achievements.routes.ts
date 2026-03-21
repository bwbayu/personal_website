import { Router } from 'express';
import * as AchievementController from './achievement.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { achievementInsertSchema, achievementUpdateSchema } from './achievements.schema';

const router = Router();

router.get('/', AchievementController.getAll);
router.post('/', authMiddleware, validate(achievementInsertSchema), AchievementController.insert);
router.patch('/:id', validateId, authMiddleware, validate(achievementUpdateSchema), AchievementController.update);
router.delete('/:id', validateId, authMiddleware, AchievementController.remove);

export default router;
