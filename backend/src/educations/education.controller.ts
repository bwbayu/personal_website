import { Request, Response, NextFunction } from 'express';
import * as EducationService from './education.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const educations = await EducationService.getAll();
    sendSuccess(res, educations);
  } catch (err) {
    next(err);
  }
};

export const insert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const education = await EducationService.insert({ ...req.body, id: randomUUID() });
    sendSuccess(res, education, 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const education = await EducationService.update(req.params.id, req.body);
    if (!education) {
      res.status(404).json({ success: false, message: 'Education not found' });
      return;
    }
    sendSuccess(res, education);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await EducationService.deleteById(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Education not found' });
      return;
    }
    sendSuccess(res, null);
  } catch (err) {
    next(err);
  }
};
