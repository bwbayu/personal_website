import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Guard tests for deploy wiring. The auth feature only works in prod if the
// pipelines inject the right env: the backend allowlist + Firebase project id
// (Cloud Run), the Firebase Web config (static build). These are not exercised
// until the develop -> main ship, so assert their presence here to fail fast on
// a regression instead of at deploy time.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), 'utf8');

describe('backend-deploy.yml Cloud Run env', () => {
  const yml = read('.github/workflows/backend-deploy.yml');

  it('passes ADMIN_EMAILS from a secret to --set-env-vars', () => {
    expect(yml).toContain('ADMIN_EMAILS=${{ secrets.ADMIN_EMAILS }}');
  });

  it('passes FIREBASE_PROJECT_ID as the project literal to --set-env-vars', () => {
    expect(yml).toContain('FIREBASE_PROJECT_ID=personal-website-490704');
  });
});

describe('backend Dockerfile runtime', () => {
  const dockerfile = read('backend/Dockerfile');

  it('runs on a Node 22 base image (firebase-admin 14 requires Node >=22)', () => {
    const bases = [...dockerfile.matchAll(/^FROM\s+(\S+)/gm)].map((m) => m[1]);
    expect(bases.length).toBeGreaterThan(0);
    for (const base of bases) {
      expect(base).toBe('node:22-alpine');
    }
  });
});
