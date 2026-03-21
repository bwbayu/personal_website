import { z } from 'zod';
import { safeUrl, safeDate } from '../utils/schema.util';

export const achievementInsertSchema = z.object({
  event_name: z.string().min(1).max(500),
  org_name: z.string().min(1).max(500),
  achievement: z.string().min(1).max(500).optional(),
  date: safeDate,
  descriptions: z.array(z.string().min(1).max(2000)).max(20),
  githubUrl: z.array(safeUrl).max(10).optional(),
  resultUrl: z.array(safeUrl).max(10).optional(),
});

export const achievementUpdateSchema = achievementInsertSchema.partial();
