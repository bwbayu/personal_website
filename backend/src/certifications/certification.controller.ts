import { Request, Response, NextFunction } from 'express';
import { CertificationService } from './certification.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const createCertificationController = (service: CertificationService) => ({
  getAll: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const certifications = await service.getAll();
      sendSuccess(res, certifications);
    } catch (err) {
      next(err);
    }
  },

  insert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const certification = await service.insert({ ...req.body, id: randomUUID() });
      sendSuccess(res, certification, 201);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const certification = await service.update(req.params.id, req.body);
      if (!certification) {
        res.status(404).json({ success: false, message: 'Certification not found' });
        return;
      }
      sendSuccess(res, certification);
    } catch (err) {
      next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await service.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Certification not found' });
        return;
      }
      sendSuccess(res, null);
    } catch (err) {
      next(err);
    }
  },
});
