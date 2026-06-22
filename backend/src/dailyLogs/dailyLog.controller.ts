import { Request, Response, NextFunction } from 'express';
import { DailyLogService } from './dailyLog.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const createDailyLogController = (service: DailyLogService) => ({
  // Public: all entries, newest-date first.
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const logs = await service.getAll();
      sendSuccess(res, logs);
    } catch (err) {
      next(err);
    }
  },

  insert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const log = await service.insert({ ...req.body, id: randomUUID() });
      sendSuccess(res, log, 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const log = await service.update(req.params.id, req.body);
      if (!log) {
        res.status(404).json({ success: false, message: 'Daily log not found' });
        return;
      }
      sendSuccess(res, log);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Daily log not found' });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },
});
