import { Request, Response, NextFunction } from 'express';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const validateSlugId = (req: Request, res: Response, next: NextFunction): void => {
  if (!SLUG_REGEX.test(req.params.id)) {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
    return;
  }
  next();
};
