import { Request, Response, NextFunction } from 'express';
import { AchievementService } from './achievements.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const createAchievementController = (service: AchievementService) => ({
  getAll: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const achievements = await service.getAll();
      sendSuccess(res, achievements);
    } catch (err) {
      next(err);
    }
  },

  insert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const achievement = await service.insert({ ...req.body, id: randomUUID() });
      sendSuccess(res, achievement, 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const achievement = await service.update(req.params.id, req.body);
      if (!achievement) {
        res.status(404).json({ success: false, message: 'Achievement not found' });
        return;
      }
      sendSuccess(res, achievement);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Achievement not found' });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },
});
