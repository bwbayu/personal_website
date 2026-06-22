import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { clearFirestore, withApiKey } from '../helpers/emulator';

// Endpoint smoke (emulator-backed): the posts auth gate (public read vs authed
// /all + writes), the published-only public read, and one CRUD round-trip.
//
// Kept well under the 10-writes/min limiter: 6 writes total (2 auth-gate POSTs +
// 2 seed POSTs + 1 PATCH + 1 DELETE). Do not add more write assertions here.
const draftBody = { title: 'A Draft', slug: 'a-draft', content: 'draft body', status: 'draft' };
const publishedBody = {
  title: 'Live Post',
  slug: 'live-post',
  content: 'word '.repeat(400).trim(),
  status: 'published',
};

describe('post endpoint smoke (emulator)', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  describe('auth gate', () => {
    it('POST /api/posts returns 401 without a key and 403 with a wrong key', async () => {
      expect((await request(app).post('/api/posts').send(draftBody)).status).toBe(401);
      expect(
        (await request(app).post('/api/posts').set('x-api-key', 'nope').send(draftBody)).status,
      ).toBe(403);
    });

    it('GET /api/posts/all requires auth', async () => {
      expect((await request(app).get('/api/posts/all')).status).toBe(401);
    });
  });

  it('separates public (published-only) from admin (all) reads and round-trips a post', async () => {
    // Seed one draft + one published post.
    const draft = await request(app).post('/api/posts').set(withApiKey()).send(draftBody);
    expect(draft.status).toBe(201);
    expect(draft.body.data.id).toMatch(/^[0-9a-f-]{36}$/i); // uuid id (D2)
    expect(draft.body.data.publishedAt).toBeUndefined(); // draft: no publishedAt

    const published = await request(app).post('/api/posts').set(withApiKey()).send(publishedBody);
    expect(published.status).toBe(201);
    expect(published.body.data.readingTime).toBe(2); // 400 words / 200, derived
    expect(published.body.data.publishedAt).toBeDefined();

    // Public read excludes the draft.
    const publicList = await request(app).get('/api/posts');
    expect(publicList.status).toBe(200);
    const publicSlugs = publicList.body.data.map((p: { slug: string }) => p.slug);
    expect(publicSlugs).toEqual(['live-post']);

    // Authed /all read includes both.
    const adminList = await request(app).get('/api/posts/all').set(withApiKey());
    expect(adminList.status).toBe(200);
    expect(adminList.body.data.map((p: { slug: string }) => p.slug).sort()).toEqual(['a-draft', 'live-post']);

    // PATCH the draft to published -> stamps publishedAt; now public.
    const patched = await request(app)
      .patch(`/api/posts/${draft.body.data.id}`)
      .set(withApiKey())
      .send({ status: 'published' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.publishedAt).toBeDefined();

    const afterPatch = await request(app).get('/api/posts');
    expect(afterPatch.body.data.map((p: { slug: string }) => p.slug).sort()).toEqual(['a-draft', 'live-post']);

    // DELETE removes it from the public read.
    const removed = await request(app).delete(`/api/posts/${published.body.data.id}`).set(withApiKey());
    expect(removed.status).toBe(200);
    const afterDelete = await request(app).get('/api/posts');
    expect(afterDelete.body.data.map((p: { slug: string }) => p.slug)).toEqual(['a-draft']);
  });
});
