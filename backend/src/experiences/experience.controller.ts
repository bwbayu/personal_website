import { Request, Response, NextFunction } from 'express';
import { ExperienceService } from './experience.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const createExperienceController = (service: ExperienceService) => ({
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const experiences = await service.getAll();
      sendSuccess(res, experiences);
    } catch (err) {
      next(err);
    }
  },

  insert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const experience = await service.insert({ ...req.body, id: randomUUID() });
      sendSuccess(res, experience, 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const experience = await service.update(req.params.id, req.body);
      if (!experience) {
        res.status(404).json({ success: false, message: 'Experience not found' });
        return;
      }
      sendSuccess(res, experience);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Experience not found' });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },
});
