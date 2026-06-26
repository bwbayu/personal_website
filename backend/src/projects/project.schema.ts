import { z } from 'zod';
import { safeUrl, safeDate } from '../utils/schema.util';

const projectBase = z.object({
  name: z.string().min(1).max(200),
  date: safeDate,
  description: z.string().min(1).max(5000),
  technologies: z.array(z.string().min(1).max(200)).max(30),
  role: z.array(z.string().max(200)).max(10),
  category: z.array(z.string().max(200)).max(10),
  url: safeUrl.optional(),
  githubUrl: safeUrl.optional(),
  youtubeUrl: safeUrl.optional(),
  isShow: z.boolean().optional(),
});

// Insert defaults isShow to true (a new project is visible). The default lives only on
// the insert schema, not the update partial — otherwise a PATCH omitting isShow would
// re-show a deliberately hidden project. `validate` writes the parsed default to req.body.
export const projectInsertSchema = projectBase.extend({
  isShow: projectBase.shape.isShow.default(true),
});

export const projectUpdateSchema = projectBase.partial();
