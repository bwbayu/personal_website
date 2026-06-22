import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPostService } from '../../src/posts/post.service';
import type { PostRepository } from '../../src/posts/post.repository';
import type { Post } from '../../src/posts/post.type';

// Unit test via DI: inject a fake repository (vi.fn stubs). No Firestore.
// Exercises the posts-specific service logic: reading-time derivation,
// publishedAt transitions (D7), and slug-uniqueness enforcement (D2).
const makeFakeRepo = () =>
  ({
    findAllPublished: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies PostRepository;

const sampleDraft: Post = {
  id: 'a3f1c2d4-0000-4000-8000-000000000000',
  slug: 'hello-world',
  title: 'Hello World',
  content: 'word '.repeat(450).trim(), // 450 words -> ceil(450/200) = 3 min
  tags: ['intro'],
  status: 'draft',
  readingTime: 0,
};

describe('post service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createPostService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createPostService(repo);
    repo.save.mockImplementation(async (p: Post) => p);
    repo.update.mockImplementation(async (_id: string, patch: Partial<Post>) => patch as Post);
  });

  describe('getPublished / getAllAdmin', () => {
    it('getPublished reads the published-only repo query', async () => {
      repo.findAllPublished.mockResolvedValue([sampleDraft]);
      await service.getPublished();
      expect(repo.findAllPublished).toHaveBeenCalledOnce();
    });

    it('getAllAdmin reads the all-statuses repo query', async () => {
      repo.findAll.mockResolvedValue([sampleDraft]);
      await service.getAllAdmin();
      expect(repo.findAll).toHaveBeenCalledOnce();
    });
  });

  describe('insert', () => {
    it('derives readingTime as ceil(words/200), min 1', async () => {
      repo.findBySlug.mockResolvedValue(null);
      const saved = await service.insert({ ...sampleDraft, content: 'word '.repeat(450).trim() });
      expect(saved.readingTime).toBe(3);

      const short = await service.insert({ ...sampleDraft, slug: 'tiny', content: 'one two' });
      expect(short.readingTime).toBe(1); // floored at 1
    });

    it('sets publishedAt only when status is published', async () => {
      repo.findBySlug.mockResolvedValue(null);

      const draft = await service.insert({ ...sampleDraft, status: 'draft' });
      expect(draft.publishedAt).toBeUndefined();

      const before = Date.now();
      const published = await service.insert({ ...sampleDraft, slug: 'live', status: 'published' });
      expect(published.publishedAt).toBeDefined();
      expect(new Date(published.publishedAt as string).getTime()).toBeGreaterThanOrEqual(before);
    });

    it('rejects with 409 when the slug is already in use', async () => {
      repo.findBySlug.mockResolvedValue({ ...sampleDraft, id: 'other' });
      await expect(service.insert(sampleDraft)).rejects.toMatchObject({ status: 409 });
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('ignores client-supplied readingTime/publishedAt, deriving them server-side', async () => {
      repo.findBySlug.mockResolvedValue(null);
      const injected = {
        ...sampleDraft,
        status: 'draft' as const,
        readingTime: 999,
        publishedAt: '1999-01-01T00:00:00.000Z',
      };
      const saved = await service.insert(injected);
      expect(saved.readingTime).toBe(3); // derived, not 999
      expect(saved.publishedAt).toBeUndefined(); // draft -> not the injected date
    });
  });

  describe('update', () => {
    it('returns null when the post does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      expect(await service.update('missing', { title: 'x' })).toBeNull();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('sets publishedAt once on draft -> published, and never moves/clears it after', async () => {
      // draft -> published: stamps publishedAt
      repo.findById.mockResolvedValue({ ...sampleDraft, status: 'draft', publishedAt: undefined });
      await service.update(sampleDraft.id, { status: 'published' });
      expect(repo.update.mock.calls[0][1].publishedAt).toBeDefined();

      // later edit while already published: does NOT move publishedAt
      const stamp = '2026-01-01T00:00:00.000Z';
      repo.findById.mockResolvedValue({ ...sampleDraft, status: 'published', publishedAt: stamp });
      await service.update(sampleDraft.id, { title: 'New Title' });
      expect(repo.update.mock.calls[1][1].publishedAt).toBeUndefined();

      // unpublish: does NOT clear publishedAt
      repo.findById.mockResolvedValue({ ...sampleDraft, status: 'published', publishedAt: stamp });
      await service.update(sampleDraft.id, { status: 'draft' });
      expect(repo.update.mock.calls[2][1].publishedAt).toBeUndefined();
    });

    it('re-derives readingTime when content changes', async () => {
      repo.findById.mockResolvedValue(sampleDraft);
      await service.update(sampleDraft.id, { content: 'word '.repeat(600).trim() }); // 600/200 = 3
      expect(repo.update.mock.calls[0][1].readingTime).toBe(3);
    });

    it('does not touch readingTime when content is unchanged', async () => {
      repo.findById.mockResolvedValue(sampleDraft);
      await service.update(sampleDraft.id, { title: 'Only the title' });
      expect(repo.update.mock.calls[0][1].readingTime).toBeUndefined();
    });

    it('rejects with 409 when changing slug to one used by a different post', async () => {
      repo.findById.mockResolvedValue(sampleDraft);
      repo.findBySlug.mockResolvedValue({ ...sampleDraft, id: 'someone-else', slug: 'taken' });
      await expect(service.update(sampleDraft.id, { slug: 'taken' })).rejects.toMatchObject({ status: 409 });
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('allows keeping the post own slug (no uniqueness check)', async () => {
      repo.findById.mockResolvedValue(sampleDraft);
      await service.update(sampleDraft.id, { slug: sampleDraft.slug, title: 'Renamed' });
      expect(repo.findBySlug).not.toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledOnce();
    });

    it('allows a new slug that no other post holds', async () => {
      repo.findById.mockResolvedValue(sampleDraft);
      repo.findBySlug.mockResolvedValue(null);
      await service.update(sampleDraft.id, { slug: 'fresh-slug' });
      expect(repo.update).toHaveBeenCalledOnce();
    });
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById(sampleDraft.id)).toBe(true);
    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('missing')).toBe(false);
  });
});
