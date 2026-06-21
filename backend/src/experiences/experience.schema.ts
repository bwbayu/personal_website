import { z } from 'zod';
import { safeDate } from '../utils/schema.util';

export const experienceInsertSchema = z.object({
  company: z.string().min(1).max(500),
  position: z.string().min(1).max(500),
  description: z.array(z.string().min(1).max(2000)).max(20),
  location: z.string().min(1).max(500),
  startDate: safeDate,
  endDate: safeDate.optional(),
});

export const experienceUpdateSchema = experienceInsertSchema.partial();
