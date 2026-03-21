import { Request, Response, NextFunction } from 'express';
import * as ExperienceService from './experience.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const experiences = await ExperienceService.getAll();
    sendSuccess(res, experiences);
  } catch (err) {
    next(err);
  }
};

export const insert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const experience = await ExperienceService.insert({ ...req.body, id: randomUUID() });
    sendSuccess(res, experience, 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const experience = await ExperienceService.update(req.params.id, req.body);
    if (!experience) {
      res.status(404).json({ success: false, message: 'Experience not found' });
      return;
    }
    sendSuccess(res, experience);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await ExperienceService.deleteById(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Experience not found' });
      return;
    }
    sendSuccess(res, null);
  } catch (err) {
    next(err);
  }
};
