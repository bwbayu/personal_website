import { Request, Response, NextFunction } from 'express';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validateId = (req: Request, res: Response, next: NextFunction): void => {
  if (!UUID_REGEX.test(req.params.id)) {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
    return;
  }
  next();
};
