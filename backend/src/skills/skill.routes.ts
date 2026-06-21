import { Router } from 'express';
import { createSkillRepository } from './skill.repository';
import { createSkillService } from './skill.service';
import { createSkillController } from './skill.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateSlugId } from '../middlewares/validateSlugId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { skillInsertSchema, skillUpdateSchema } from './skill.schema';
import { reorderSchema } from '../shared/reorder.schema';

// Composition root for the skills domain: wire repository -> service -> controller.
const repo = createSkillRepository();
const service = createSkillService(repo);
const controller = createSkillController(service);

const router = Router();

router.get('/', controller.getAll);
router.post('/', authMiddleware, validate(skillInsertSchema), controller.insert);
// Must precede `/:id` — "reorder" is a valid slug and would otherwise misroute to update.
router.patch('/reorder', authMiddleware, validate(reorderSchema), controller.reorder);
router.patch('/:id', validateSlugId, authMiddleware, validate(skillUpdateSchema), controller.update);
router.delete('/:id', validateSlugId, authMiddleware, controller.remove);

export default router;
