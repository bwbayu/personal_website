import { Request, Response, NextFunction } from 'express';
import * as CertificationService from './certification.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const certifications = await CertificationService.getAll();
    sendSuccess(res, certifications);
  } catch (err) {
    next(err);
  }
};

export const insert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const certification = await CertificationService.insert({ ...req.body, id: randomUUID() });
    sendSuccess(res, certification, 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const certification = await CertificationService.update(req.params.id, req.body);
    if (!certification) {
      res.status(404).json({ success: false, message: 'Certification not found' });
      return;
    }
    sendSuccess(res, certification);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await CertificationService.deleteById(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Certification not found' });
      return;
    }
    sendSuccess(res, null);
  } catch (err) {
    next(err);
  }
};
