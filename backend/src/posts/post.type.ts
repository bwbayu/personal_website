export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  cover?: string;
  content: string;
  tags: string[];
  status: PostStatus;
  publishedAt?: string;
  readingTime: number;
}
