import { Router } from 'express';
import { createCategoryRepository } from './category.repository';
import { createCategoryService } from './category.service';
import { createCategoryController } from './category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateSlugId } from '../middlewares/validateSlugId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { categoryInsertSchema, categoryUpdateSchema } from './category.schema';
import { reorderSchema } from '../shared/reorder.schema';

// Composition root for the categories domain: wire repository -> service -> controller.
const repo = createCategoryRepository();
const service = createCategoryService(repo);
const controller = createCategoryController(service);

const router = Router();

router.get('/', controller.getAll);
router.post('/', authMiddleware, validate(categoryInsertSchema), controller.insert);
// Must precede `/:id` — "reorder" is a valid slug and would otherwise misroute to update.
router.patch('/reorder', authMiddleware, validate(reorderSchema), controller.reorder);
router.patch('/:id', validateSlugId, authMiddleware, validate(categoryUpdateSchema), controller.update);
router.delete('/:id', validateSlugId, authMiddleware, controller.remove);

export default router;
