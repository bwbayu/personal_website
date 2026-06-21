import { Request, Response, NextFunction } from 'express';
import { MediaSocialService } from './mediaSocial.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const createMediaSocialController = (service: MediaSocialService) => ({
  getAll: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mediaSocials = await service.getAll();
      sendSuccess(res, mediaSocials);
    } catch (err) {
      next(err);
    }
  },

  insert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mediaSocial = await service.insert({ ...req.body, id: randomUUID() });
      sendSuccess(res, mediaSocial, 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mediaSocial = await service.update(req.params.id, req.body);
      if (!mediaSocial) {
        res.status(404).json({ success: false, message: 'Media social not found' });
        return;
      }
      sendSuccess(res, mediaSocial);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Media social not found' });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },
});
