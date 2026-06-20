import { z } from 'zod';
import { safeUrl, safeDate } from '../utils/schema.util';

export const projectInsertSchema = z.object({
  name: z.string().min(1).max(200),
  date: safeDate,
  description: z.string().min(1).max(5000),
  technologies: z.array(z.string().min(1).max(200)).max(30),
  role: z.array(z.string().max(200)).max(10),
  category: z.array(z.string().max(200)).max(10),
  url: safeUrl.optional(),
  githubUrl: safeUrl.optional(),
  youtubeUrl: safeUrl.optional(),
});

export const projectUpdateSchema = projectInsertSchema.partial();
