import { Post } from './post.type';
import { PostRepository } from './post.repository';
import { readingTime } from '../utils/readingTime.util';

// Insert payload: the controller supplies `id` (uuid); `readingTime`/`publishedAt`
// are server-derived here and never accepted from the client.
export type PostInsert = Omit<Post, 'readingTime' | 'publishedAt'>;
export type PostUpdate = Partial<Omit<Post, 'id' | 'readingTime' | 'publishedAt'>>;

const conflict = (message: string): Error & { status: number } =>
  Object.assign(new Error(message), { status: 409 });

export const createPostService = (repo: PostRepository) => ({
  getPublished: (): Promise<Post[]> => repo.findAllPublished(),

  getAllAdmin: (): Promise<Post[]> => repo.findAll(),

  insert: async (data: PostInsert): Promise<Post> => {
    const existing = await repo.findBySlug(data.slug);
    if (existing) throw conflict('Slug already in use');

    const post: Post = {
      ...data,
      readingTime: readingTime(data.content),
      // First-publish timestamp; left undefined (ignored by Firestore) for drafts.
      publishedAt: data.status === 'published' ? new Date().toISOString() : undefined,
    };
    return repo.save(post);
  },

  update: async (id: string, data: PostUpdate): Promise<Post | null> => {
    const current = await repo.findById(id);
    if (!current) return null;

    if (data.slug && data.slug !== current.slug) {
      const bySlug = await repo.findBySlug(data.slug);
      if (bySlug && bySlug.id !== id) throw conflict('Slug already in use');
    }

    const patch: Partial<Post> = { ...data };

    if (data.content !== undefined) {
      patch.readingTime = readingTime(data.content);
    }

    // Set publishedAt the first time the post becomes published; never clear it on
    // a later edit or on unpublish (D7).
    const resultingStatus = data.status ?? current.status;
    if (resultingStatus === 'published' && !current.publishedAt) {
      patch.publishedAt = new Date().toISOString();
    }

    return repo.update(id, patch);
  },

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type PostService = ReturnType<typeof createPostService>;
