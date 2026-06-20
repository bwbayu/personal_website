import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unit test for the env config parsing. The config object is built at import
// time, so each case sets process.env, resets the module registry, then
// re-imports `src/config/env`. Env is snapshotted/restored around every test so
// the global defaults from tests/setup.ts don't leak between cases.
const ENV_KEYS = ['ADMIN_EMAILS', 'FIREBASE_PROJECT_ID', 'GOOGLE_CLOUD_PROJECT', 'NODE_ENV', 'API_KEY'] as const;

async function loadConfig() {
  vi.resetModules();
  return (await import('../../src/config/env')).config;
}

describe('config env parsing', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k];
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    vi.resetModules();
  });

  it('parses ADMIN_EMAILS trimmed, lowercased, empty-filtered', async () => {
    process.env.ADMIN_EMAILS = ' Foo@Example.com , bar@X.io ,, ';
    const config = await loadConfig();
    expect(config.adminEmails).toEqual(['foo@example.com', 'bar@x.io']);
  });

  it('ADMIN_EMAILS unset -> []', async () => {
    delete process.env.ADMIN_EMAILS;
    const config = await loadConfig();
    expect(config.adminEmails).toEqual([]);
  });

  it('firebaseProjectId prefers FIREBASE_PROJECT_ID over GOOGLE_CLOUD_PROJECT', async () => {
    process.env.FIREBASE_PROJECT_ID = 'fb-proj';
    process.env.GOOGLE_CLOUD_PROJECT = 'gcp-proj';
    const config = await loadConfig();
    expect(config.firebaseProjectId).toBe('fb-proj');
  });

  it('firebaseProjectId falls back to GOOGLE_CLOUD_PROJECT', async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    process.env.GOOGLE_CLOUD_PROJECT = 'gcp-proj';
    const config = await loadConfig();
    expect(config.firebaseProjectId).toBe('gcp-proj');
  });

  it('firebaseProjectId is undefined when both are unset', async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    const config = await loadConfig();
    expect(config.firebaseProjectId).toBeUndefined();
  });

  it('prod + empty ADMIN_EMAILS throws at import', async () => {
    process.env.NODE_ENV = 'production';
    process.env.API_KEY = 'k'; // satisfy the API_KEY prod guard so we reach the ADMIN_EMAILS guard
    delete process.env.ADMIN_EMAILS;
    await expect(loadConfig()).rejects.toThrow(/ADMIN_EMAILS/);
  });

  it('dev + empty ADMIN_EMAILS does not throw', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ADMIN_EMAILS;
    const config = await loadConfig();
    expect(config.adminEmails).toEqual([]);
  });
});
