import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { config } from '../../src/config/env';
import { clearFirestore, withApiKey } from '../helpers/emulator';

// Endpoint smoke (DISCUSSION decision 5): supertest against the real Express app
// (skills DI-wired, the 8 legacy domains also booted), emulator-backed. Covers
// the auth gate (401/403/500), Zod 400, and one CRUD round-trip.
//
// Kept under the 20-writes/15-min write rate-limit: ~7 writes total (see
// PLAN edge-case note) — do not add more write assertions to this file.
const validSkill = {
  name: 'Go',
  category: 'Programming Languages',
  proficiency: '2+ years',
  isShow: true,
};

describe('skill endpoint smoke (emulator)', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  describe('auth gate on POST /api/skills', () => {
    it('returns 401 when the x-api-key header is missing', async () => {
      const res = await request(app).post('/api/skills').send(validSkill);
      expect(res.status).toBe(401);
    });

    it('returns 403 when the x-api-key is wrong', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('x-api-key', 'definitely-not-the-key')
        .send(validSkill);
      expect(res.status).toBe(403);
    });

    it('returns 500 when the server has no API key configured', async () => {
      const original = config.apiKey;
      config.apiKey = undefined;
      try {
        const res = await request(app)
          .post('/api/skills')
          .set('x-api-key', 'anything')
          .send(validSkill);
        expect(res.status).toBe(500);
      } finally {
        config.apiKey = original;
      }
    });
  });

  it('returns 400 with a Zod message on an invalid body', async () => {
    const res = await request(app)
      .post('/api/skills')
      .set(withApiKey())
      .send({ category: 'Programming Languages', proficiency: '1 year', isShow: true }); // missing name
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('name');
  });

  it('round-trips a skill through POST -> GET -> PATCH -> DELETE', async () => {
    // POST (create)
    const created = await request(app).post('/api/skills').set(withApiKey()).send(validSkill);
    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data.id).toBe('go');

    // GET (public) lists it
    const afterCreate = await request(app).get('/api/skills');
    expect(afterCreate.status).toBe(200);
    expect(afterCreate.body.data.map((s: { id: string }) => s.id)).toContain('go');

    // PATCH (update)
    const updated = await request(app)
      .patch('/api/skills/go')
      .set(withApiKey())
      .send({ proficiency: '3+ years' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.proficiency).toBe('3+ years');

    // DELETE
    const removed = await request(app).delete('/api/skills/go').set(withApiKey());
    expect(removed.status).toBe(200);

    // GET no longer lists it
    const afterDelete = await request(app).get('/api/skills');
    expect(afterDelete.body.data.map((s: { id: string }) => s.id)).not.toContain('go');
  });
});
