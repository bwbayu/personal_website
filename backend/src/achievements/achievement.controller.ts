import { Request, Response, NextFunction } from 'express';
import * as AchievementService from './achievements.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const achievements = await AchievementService.getAll();
    sendSuccess(res, achievements);
  } catch (err) {
    next(err);
  }
};

export const insert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const achievement = await AchievementService.insert({ ...req.body, id: randomUUID() });
    sendSuccess(res, achievement, 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const achievement = await AchievementService.update(req.params.id, req.body);
    if (!achievement) {
      res.status(404).json({ success: false, message: 'Achievement not found' });
      return;
    }
    sendSuccess(res, achievement);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await AchievementService.deleteById(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Achievement not found' });
      return;
    }
    sendSuccess(res, null);
  } catch (err) {
    next(err);
  }
};
