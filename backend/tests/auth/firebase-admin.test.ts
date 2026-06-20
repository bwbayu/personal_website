import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unit test for the Firebase Admin init module. The Admin SDK subpaths are
// mocked so no real app is created; the config module is re-imported per case
// (vi.resetModules) to re-run its import-time init guard.
const mockInitializeApp = vi.fn();
const mockVerifyIdToken = vi.fn();
const mockGetAuth = vi.fn(() => ({ verifyIdToken: mockVerifyIdToken }));
let mockApps: unknown[] = [];

vi.mock('firebase-admin/app', () => ({
  getApps: () => mockApps,
  initializeApp: mockInitializeApp,
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: mockGetAuth,
}));

vi.mock('../../src/config/env', () => ({
  config: { firebaseProjectId: 'test-project' },
}));

describe('firebase-admin config module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApps = [];
    vi.resetModules();
  });

  it('initializes the Admin app once when none exists', async () => {
    await import('../../src/config/firebase-admin');
    expect(mockInitializeApp).toHaveBeenCalledOnce();
    expect(mockInitializeApp).toHaveBeenCalledWith({ projectId: 'test-project' });
  });

  it('does not re-init when an app already exists', async () => {
    mockApps = [{}]; // simulate an already-initialized app
    await import('../../src/config/firebase-admin');
    expect(mockInitializeApp).not.toHaveBeenCalled();
  });

  it('verifyIdToken forwards the token to the SDK and returns its result', async () => {
    const decoded = { uid: 'u1', email: 'a@b.com', email_verified: true };
    mockVerifyIdToken.mockResolvedValue(decoded);
    const mod = await import('../../src/config/firebase-admin');
    const result = await mod.verifyIdToken('tok');
    expect(mockGetAuth).toHaveBeenCalled();
    expect(mockVerifyIdToken).toHaveBeenCalledWith('tok');
    expect(result).toEqual(decoded);
  });
});
