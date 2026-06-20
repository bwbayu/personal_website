import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { config } from '../config/env';
import { verifyIdToken } from '../config/firebase-admin';

// Combined write-route auth. If an `Authorization: Bearer <token>` header is
// present, verify it as a Firebase ID token from an allowlisted, email-verified
// admin account. Otherwise fall back to the static, timing-safe x-api-key
// (break-glass / non-browser clients). Either path passing calls next().
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();

    let decoded: DecodedIdToken;
    try {
      decoded = await verifyIdToken(token);
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (code.startsWith('auth/')) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
      } else {
        // App not initialized / project id missing / other non-token failure.
        res.status(500).json({ success: false, message: 'Server misconfigured' });
      }
      return;
    }

    if (decoded.email_verified !== true) {
      res.status(403).json({ success: false, message: 'Email not verified' });
      return;
    }

    const email = decoded.email?.toLowerCase();
    if (!email || !config.adminEmails.includes(email)) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    req.adminEmail = email;
    next();
    return;
  }

  // Fallback: static x-api-key.
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
