import { z } from 'zod';

export const skillInsertSchema = z.object({
  name: z.string().min(1).max(200),
  iconClass: z.string().max(200).optional(),
  iconImage: z.string().max(500).optional(),
  categoryId: z.string().min(1).max(200),
  order: z.number().int(),
  isShow: z.boolean(),
});

export const skillUpdateSchema = skillInsertSchema.partial();
