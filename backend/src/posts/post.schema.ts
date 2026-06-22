import { z } from 'zod';
import { safeUrl } from '../utils/schema.util';

// `id`, `publishedAt`, and `readingTime` are server-managed: they are derived on
// write (uuid id, first-publish timestamp, words/200 reading time) and are
// deliberately NOT accepted from the client body so they can't be injected.
const postBase = z.object({
  title: z.string().min(1).max(200),
  // URL-safe slug; mirrors the toSlug charset (lowercase, digits, hyphen).
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  excerpt: z.string().max(500).optional(),
  cover: safeUrl.optional(),
  content: z.string().min(1).max(100000),
  tags: z.array(z.string().min(1).max(50)).max(20),
  status: z.enum(['draft', 'published']),
});

// Insert defaults tags to [] when omitted. The default lives only here, not on the
// update partial — otherwise a PATCH omitting tags would inject [] and wipe them.
export const postInsertSchema = postBase.extend({ tags: postBase.shape.tags.default([]) });

export const postUpdateSchema = postBase.partial();
