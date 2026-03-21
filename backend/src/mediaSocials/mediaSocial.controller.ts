import { Request, Response, NextFunction } from 'express';
import * as MediaSocialService from './mediaSocial.service';
import { sendSuccess } from '../utils/response.util';
import { randomUUID } from 'crypto';

export const getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mediaSocials = await MediaSocialService.getAll();
    sendSuccess(res, mediaSocials);
  } catch (err) {
    next(err);
  }
};

export const insert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mediaSocial = await MediaSocialService.insert({ ...req.body, id: randomUUID() });
    sendSuccess(res, mediaSocial, 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mediaSocial = await MediaSocialService.update(req.params.id, req.body);
    if (!mediaSocial) {
      res.status(404).json({ success: false, message: 'Media social not found' });
      return;
    }
    sendSuccess(res, mediaSocial);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await MediaSocialService.deleteById(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Media social not found' });
      return;
    }
    sendSuccess(res, null);
  } catch (err) {
    next(err);
  }
};
