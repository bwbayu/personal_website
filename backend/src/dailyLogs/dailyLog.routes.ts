import { Router } from 'express';
import { createDailyLogRepository } from './dailyLog.repository';
import { createDailyLogService } from './dailyLog.service';
import { createDailyLogController } from './dailyLog.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validateId.middleware';
import { validate } from '../middlewares/validate.middleware';
import { dailyLogInsertSchema, dailyLogUpdateSchema } from './dailyLog.schema';

// Composition root for the daily-logs domain: wire repository -> service -> controller.
const repo = createDailyLogRepository();
const service = createDailyLogService(repo);
const controller = createDailyLogController(service);

const router = Router();

// Public read returns ALL entries (no drafts/status); writes are auth-gated.
router.get('/', controller.getAll);
router.post('/', authMiddleware, validate(dailyLogInsertSchema), controller.insert);
router.patch('/:id', validateId, authMiddleware, validate(dailyLogUpdateSchema), controller.update);
router.delete('/:id', validateId, authMiddleware, controller.remove);

export default router;
