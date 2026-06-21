import { Request, Response, NextFunction } from 'express';
import { EducationService } from './education.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const createEducationController = (service: EducationService) => ({
  getAll: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const educations = await service.getAll();
      sendSuccess(res, educations);
    } catch (err) {
      next(err);
    }
  },

  insert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const education = await service.insert({ ...req.body, id: randomUUID() });
      sendSuccess(res, education, 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const education = await service.update(req.params.id, req.body);
      if (!education) {
        res.status(404).json({ success: false, message: 'Education not found' });
        return;
      }
      sendSuccess(res, education);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Education not found' });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },
});
