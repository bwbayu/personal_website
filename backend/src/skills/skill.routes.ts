import { Router } from 'express';
import * as SkillController from './skill.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateSlugId } from '../middlewares/validateSlugId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { skillInsertSchema, skillUpdateSchema } from './skill.schema';

const router = Router();

router.get('/', SkillController.getAll);
router.post('/', authMiddleware, validate(skillInsertSchema), SkillController.insert);
router.patch('/:id', validateSlugId, authMiddleware, validate(skillUpdateSchema), SkillController.update);
router.delete('/:id', validateSlugId, authMiddleware, SkillController.remove);

export default router;
