import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { config } from '../config/env';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.headers['x-api-key'];

  if (!key || typeof key !== 'string') {
    res.status(401).json({ success: false, message: 'Missing API key' });
    return;
  }

  if (!config.apiKey) {
    res.status(500).json({ success: false, message: 'Server misconfigured' });
    return;
  }

  const keyBuf = Buffer.from(key);
  const apiKeyBuf = Buffer.from(config.apiKey);
  if (keyBuf.length !== apiKeyBuf.length || !timingSafeEqual(keyBuf, apiKeyBuf)) {
    res.status(403).json({ success: false, message: 'Invalid API key' });
    return;
  }

  next();
};
