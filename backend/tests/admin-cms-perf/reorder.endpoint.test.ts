import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { withApiKey } from '../helpers/emulator';

// Firestore-free routing/auth/validation smoke for PATCH /api/<domain>/reorder.
// Asserts ONLY short-circuit paths that never reach the controller (no Firestore):
//   - no auth  -> 401
//   - authed + a non-array body -> 400 from the reorder array validator
// The 400 also proves `/reorder` is NOT captured by `/:id` (which would accept the
// empty object against the partial update schema and fall through to Firestore).
// Do NOT send a well-formed reorder body here — it would reach the real Firestore.
describe.each([
  ['skills', '/api/skills/reorder'],
  ['categories', '/api/categories/reorder'],
])('PATCH %s reorder (Firestore-free)', (_domain, path) => {
  it('returns 401 without credentials', async () => {
    const res = await request(app)
      .patch(path)
      .send([{ id: 'a', order: 0 }]);
    expect(res.status).toBe(401);
  });

  it('returns 400 from the array validator on a non-array body (not misrouted to /:id)', async () => {
    const res = await request(app).patch(path).set(withApiKey()).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toContain('array');
    expect(res.body.message).not.toBe('Invalid ID format');
  });
});
