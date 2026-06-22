import { Router } from 'express';
import { createPostRepository } from './post.repository';
import { createPostService } from './post.service';
import { createPostController } from './post.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { postInsertSchema, postUpdateSchema } from './post.schema';

// Composition root for the posts domain: wire repository -> service -> controller.
const repo = createPostRepository();
const service = createPostService(repo);
const controller = createPostController(service);

const router = Router();

// Public read is published-only; the authed /all route (literal, before any
// `/:id` route) exposes drafts to the admin.
router.get('/', controller.getAll);
router.get('/all', authMiddleware, controller.getAllAdmin);
router.post('/', authMiddleware, validate(postInsertSchema), controller.insert);
router.patch('/:id', validateId, authMiddleware, validate(postUpdateSchema), controller.update);
router.delete('/:id', validateId, authMiddleware, controller.remove);

export default router;
