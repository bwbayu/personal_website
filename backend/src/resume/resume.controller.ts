import { Request, Response, NextFunction } from 'express';
import * as ResumeService from './resume.service';
import { sendSuccess } from '../utils/response.util';

export const getResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resume = await ResumeService.getResume();
    sendSuccess(res, resume);
  } catch (err) {
    next(err);
  }
};
