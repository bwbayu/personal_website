import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPostRepository } from '../../src/posts/post.repository';
import type { Post } from '../../src/posts/post.type';
import { clearFirestore } from '../helpers/emulator';

// Emulator-backed test for the posts repository queries against the real Firestore
// emulator: findBySlug, findById, the published-only ordered read, and the admin
// read that must include drafts.
const makePost = (over: Partial<Post>): Post => ({
  id: over.id ?? 'id-default',
  slug: over.slug ?? 'slug-default',
  title: over.title ?? 'Title',
  content: over.content ?? 'content',
  tags: over.tags ?? [],
  status: over.status ?? 'draft',
  readingTime: over.readingTime ?? 1,
  ...over,
});

describe('post repository (emulator)', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  it('findBySlug returns the matching post or null', async () => {
    const repo = createPostRepository();
    await repo.save(makePost({ id: 'p1', slug: 'first-post' }));

    const found = await repo.findBySlug('first-post');
    expect(found?.id).toBe('p1');

    const missing = await repo.findBySlug('no-such-slug');
    expect(missing).toBeNull();
  });

  it('findById returns the doc (with id) or null', async () => {
    const repo = createPostRepository();
    await repo.save(makePost({ id: 'p1', slug: 's1' }));

    expect((await repo.findById('p1'))?.id).toBe('p1');
    expect(await repo.findById('ghost')).toBeNull();
  });

  it('findAllPublished returns published-only, newest publishedAt first', async () => {
    const repo = createPostRepository();
    await repo.save(makePost({ id: 'd', slug: 'draft', status: 'draft' }));
    await repo.save(makePost({ id: 'old', slug: 'old', status: 'published', publishedAt: '2026-01-01T00:00:00.000Z' }));
    await repo.save(makePost({ id: 'new', slug: 'new', status: 'published', publishedAt: '2026-06-01T00:00:00.000Z' }));

    const published = await repo.findAllPublished();
    expect(published.map((p) => p.id)).toEqual(['new', 'old']); // desc by publishedAt
    expect(published.some((p) => p.status === 'draft')).toBe(false); // never a draft
  });

  it('findAll (admin) includes drafts, published newest-first then drafts last', async () => {
    const repo = createPostRepository();
    await repo.save(makePost({ id: 'd', slug: 'draft', status: 'draft' }));
    await repo.save(makePost({ id: 'old', slug: 'old', status: 'published', publishedAt: '2026-01-01T00:00:00.000Z' }));
    await repo.save(makePost({ id: 'new', slug: 'new', status: 'published', publishedAt: '2026-06-01T00:00:00.000Z' }));

    const all = await repo.findAll();
    expect(all.map((p) => p.id)).toEqual(['new', 'old', 'd']);
  });
});
