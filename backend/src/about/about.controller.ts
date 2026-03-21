import { Request, Response, NextFunction } from 'express';
import * as AboutService from './about.service';
import { sendSuccess } from '../utils/response.util';

export const get = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const about = await AboutService.get();
    if (!about) {
      res.status(404).json({ success: false, message: 'About not found' });
      return;
    }
    sendSuccess(res, about);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const about = await AboutService.update(req.params.id, req.body);
    if (!about) {
      res.status(404).json({ success: false, message: 'About not found' });
      return;
    }
    sendSuccess(res, about);
  } catch (err) {
    next(err);
  }
};
