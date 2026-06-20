import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Unit test for the combined auth middleware. verifyIdToken (the firebase-admin
// seam) and the env config are mocked so no real SDK/app is needed.
// vi.hoisted so the mock fn exists before the hoisted vi.mock factory runs (the
// SUT is imported statically, which triggers the factory at module load).
const { mockVerifyIdToken } = vi.hoisted(() => ({ mockVerifyIdToken: vi.fn() }));

vi.mock('../../src/config/firebase-admin', () => ({
  verifyIdToken: mockVerifyIdToken,
}));

vi.mock('../../src/config/env', () => ({
  config: {
    apiKey: 'secret-key',
    adminEmails: ['admin@example.com'],
  },
}));

import { authMiddleware } from '../../src/middlewares/auth.middleware';

function makeRes() {
  const res: Record<string, unknown> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

function makeReq(headers: Record<string, string | undefined>): Request {
  return { headers } as unknown as Request;
}

describe('authMiddleware (combined Bearer / x-api-key)', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('passes a valid, email-verified, allowlisted Bearer token and sets req.adminEmail', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'Admin@Example.com', email_verified: true });
    const req = makeReq({ authorization: 'Bearer good-token' });
    const res = makeRes();

    await authMiddleware(req, res, next as unknown as NextFunction);

    expect(mockVerifyIdToken).toHaveBeenCalledWith('good-token');
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.adminEmail).toBe('admin@example.com'); // lowercased
  });

  it('rejects a valid token whose email is not on the allowlist with 403', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'intruder@example.com', email_verified: true });
    const req = makeReq({ authorization: 'Bearer good-token' });
    const res = makeRes();

    await authMiddleware(req, res, next as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a valid token with email_verified=false with 403', async () => {
    mockVerifyIdToken.mockResolvedValue({ email: 'admin@example.com', email_verified: false });
    const req = makeReq({ authorization: 'Bearer good-token' });
    const res = makeRes();

    await authMiddleware(req, res, next as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a bad/expired token (auth/* error) with 401', async () => {
    mockVerifyIdToken.mockRejectedValue({ code: 'auth/id-token-expired' });
    const req = makeReq({ authorization: 'Bearer expired-token' });
    const res = makeRes();

    await authMiddleware(req, res, next as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when verifyIdToken fails for a non-token (config) reason', async () => {
    mockVerifyIdToken.mockRejectedValue({ code: 'app/no-app' });
    const req = makeReq({ authorization: 'Bearer some-token' });
    const res = makeRes();

    await authMiddleware(req, res, next as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  it('falls back to a valid x-api-key when no Authorization header is present', async () => {
    const req = makeReq({ 'x-api-key': 'secret-key' });
    const res = makeRes();

    await authMiddleware(req, res, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(mockVerifyIdToken).not.toHaveBeenCalled(); // verify path never touched
  });

  it('rejects an invalid x-api-key with 403', async () => {
    const req = makeReq({ 'x-api-key': 'wrong-key' });
    const res = makeRes();

    await authMiddleware(req, res, next as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it('rejects a missing key (no Authorization, no x-api-key) with 401', async () => {
    const req = makeReq({});
    const res = makeRes();

    await authMiddleware(req, res, next as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });
});
