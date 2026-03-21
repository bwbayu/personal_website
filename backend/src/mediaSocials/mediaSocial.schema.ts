import { z } from 'zod';
import { safeUrl } from '../utils/schema.util';

export const mediaSocialInsertSchema = z.object({
  name: z.string().min(1).max(500),
  url: safeUrl,
  iconClass: z.string().min(1).max(200),
});

export const mediaSocialUpdateSchema = mediaSocialInsertSchema.partial();
