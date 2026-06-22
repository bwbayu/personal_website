import { describe, it, expect } from 'vitest';
import { postInsertSchema, postUpdateSchema } from '../../src/posts/post.schema';

// Unit test (no emulator): pins the Post write contract. Zod strips unknown keys
// by default, so the server-managed fields (id/publishedAt/readingTime) can never
// be injected through the body (AC7).
const validBody = {
  title: 'Hello World',
  slug: 'hello-world',
  content: '# Hi\n\nSome content.',
  tags: ['intro'],
  status: 'draft' as const,
};

describe('post insert schema', () => {
  it('parses a valid body and defaults tags to []', () => {
    const { tags, ...noTags } = validBody;
    const parsed = postInsertSchema.parse(noTags);
    expect(parsed.tags).toEqual([]);
  });

  it('strips server-managed id/publishedAt/readingTime from the body', () => {
    const parsed = postInsertSchema.parse({
      ...validBody,
      id: 'client-supplied',
      publishedAt: '1999-01-01T00:00:00.000Z',
      readingTime: 999,
    });
    expect(parsed).not.toHaveProperty('id');
    expect(parsed).not.toHaveProperty('publishedAt');
    expect(parsed).not.toHaveProperty('readingTime');
  });

  it('rejects a slug with invalid characters', () => {
    expect(postInsertSchema.safeParse({ ...validBody, slug: 'Has Spaces' }).success).toBe(false);
    expect(postInsertSchema.safeParse({ ...validBody, slug: 'UPPER' }).success).toBe(false);
    expect(postInsertSchema.safeParse({ ...validBody, slug: 'ok-slug-1' }).success).toBe(true);
  });

  it('rejects an unknown status', () => {
    expect(postInsertSchema.safeParse({ ...validBody, status: 'archived' }).success).toBe(false);
  });

  it('rejects empty title and empty content', () => {
    expect(postInsertSchema.safeParse({ ...validBody, title: '' }).success).toBe(false);
    expect(postInsertSchema.safeParse({ ...validBody, content: '' }).success).toBe(false);
  });

  it('rejects a non-http(s) cover URL', () => {
    expect(postInsertSchema.safeParse({ ...validBody, cover: 'javascript:alert(1)' }).success).toBe(false);
  });
});

describe('post update schema', () => {
  it('is partial (an empty patch parses)', () => {
    expect(postUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('still strips server-managed fields on update', () => {
    const parsed = postUpdateSchema.parse({ title: 'New', readingTime: 5, publishedAt: 'x' });
    expect(parsed).toEqual({ title: 'New' });
  });
});
