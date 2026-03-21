import { z } from 'zod';
import { safeUrl, safeDate } from '../utils/schema.util';

const techSchema = z.object({
  name: z.string().min(1).max(200),
  iconClass: z.string().max(200).optional(),
  iconImage: z.string().max(500).optional(),
});

export const projectInsertSchema = z.object({
  name: z.string().min(1).max(200),
  date: safeDate,
  description: z.string().min(1).max(5000),
  technologies: z.array(techSchema).max(30),
  role: z.array(z.string().max(200)).max(10),
  category: z.array(z.string().max(200)).max(10),
  url: safeUrl.optional(),
  githubUrl: safeUrl.optional(),
});

export const projectUpdateSchema = projectInsertSchema.partial();
