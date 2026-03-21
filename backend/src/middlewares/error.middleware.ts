import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const errorMiddleware = (
  err: Error & { status?: number },
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status ?? 500;
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  const message = config.nodeEnv === 'production' && status === 500
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  res.status(status).json({ success: false, message });
};
