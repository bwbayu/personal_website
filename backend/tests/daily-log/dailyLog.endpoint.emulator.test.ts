import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { clearFirestore, withApiKey } from '../helpers/emulator';

// Endpoint smoke (emulator-backed): the daily-logs auth gate (public read vs authed
// writes), the public read ordered by date desc, one CRUD round-trip, and the
// bad-date rejection.
//
// Kept well under the 10-writes/min limiter: 7 writes total (2 auth-gate POSTs +
// 2 seed POSTs + 1 PATCH + 1 DELETE + 1 bad-date POST). Do not add more.
const olderBody = { date: '2026-01-05', content: 'An older note.', tags: ['old'] };
const newerBody = { date: '2026-06-20', content: 'A newer note.', tags: ['new'] };

describe('daily log endpoint smoke (emulator)', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  describe('auth gate', () => {
    it('POST /api/daily-logs returns 401 without a key and 403 with a wrong key', async () => {
      expect((await request(app).post('/api/daily-logs').send(newerBody)).status).toBe(401);
      expect(
        (await request(app).post('/api/daily-logs').set('x-api-key', 'nope').send(newerBody)).status,
      ).toBe(403);
    });
  });

  it('serves a public date-desc read and round-trips an entry', async () => {
    // Seed two entries on different dates.
    const newer = await request(app).post('/api/daily-logs').set(withApiKey()).send(newerBody);
    expect(newer.status).toBe(201);
    expect(newer.body.data.id).toMatch(/^[0-9a-f-]{36}$/i); // uuid id (DL2)

    const older = await request(app).post('/api/daily-logs').set(withApiKey()).send(olderBody);
    expect(older.status).toBe(201);

    // Public read returns ALL entries, newest date first (DL8).
    const list = await request(app).get('/api/daily-logs');
    expect(list.status).toBe(200);
    expect(list.body.data.map((l: { date: string }) => l.date)).toEqual(['2026-06-20', '2026-01-05']);

    // PATCH content on the newer entry.
    const patched = await request(app)
      .patch(`/api/daily-logs/${newer.body.data.id}`)
      .set(withApiKey())
      .send({ content: 'Edited note.' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.content).toBe('Edited note.');

    // DELETE the newer entry -> gone from the public read.
    const removed = await request(app).delete(`/api/daily-logs/${newer.body.data.id}`).set(withApiKey());
    expect(removed.status).toBe(200);
    const afterDelete = await request(app).get('/api/daily-logs');
    expect(afterDelete.body.data.map((l: { date: string }) => l.date)).toEqual(['2026-01-05']);
  });

  it('rejects a POST with a bad date (400)', async () => {
    const res = await request(app)
      .post('/api/daily-logs')
      .set(withApiKey())
      .send({ ...newerBody, date: '2026-13-40' });
    expect(res.status).toBe(400);
  });
});
