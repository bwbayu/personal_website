import { z } from 'zod';

export const categoryInsertSchema = z.object({
  name: z.string().min(1).max(200),
  order: z.number().int(),
});

export const categoryUpdateSchema = categoryInsertSchema.partial();
