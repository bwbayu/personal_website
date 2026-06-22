import { Firestore } from '@google-cloud/firestore';
import { Post } from './post.type';
import { FirestoreRepository } from '../shared/firestore.repository';

// DI factory (parity with projects/skills): an optional `db` lets tests inject an
// emulator-backed client; when omitted the generic repository falls back to the
// default Firestore singleton.
export const createPostRepository = (db?: Firestore) => {
  const repo = new FirestoreRepository<Post>('posts', db);
  return {
    // Public read: published-only, newest first. Every published doc has a
    // publishedAt (set on first publish), so the where+orderBy keeps them all.
    findAllPublished: () => repo.findByFieldOrdered('status', 'published', 'publishedAt', 'desc'),
    // Admin read: ALL statuses. Cannot use orderBy('publishedAt') because Firestore
    // drops docs missing that field (drafts have none) — fetch all, sort in memory
    // (published newest-first, drafts last).
    findAll: async (): Promise<Post[]> => {
      const posts = await repo.findAll();
      return posts.sort((a, b) => {
        if (a.publishedAt && b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt);
        if (a.publishedAt) return -1;
        if (b.publishedAt) return 1;
        return 0;
      });
    },
    findById:   (id: string) => repo.findById(id),
    findBySlug: async (slug: string): Promise<Post | null> => {
      const matches = await repo.findByField('slug', slug);
      return matches[0] ?? null;
    },
    save:   (data: Post) => repo.save(data),
    update: (id: string, data: Partial<Post>) => repo.update(id, data),
    remove: (id: string) => repo.remove(id),
  };
};

export type PostRepository = ReturnType<typeof createPostRepository>;
