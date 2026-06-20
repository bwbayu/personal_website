import { z } from 'zod';

export const aboutInsertSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
});

export const aboutUpdateSchema = aboutInsertSchema.partial();
