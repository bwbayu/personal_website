import { z } from 'zod';
import { safeDate } from '../utils/schema.util';

export const educationInsertSchema = z.object({
  institution: z.string().min(1).max(500),
  title: z.string().min(1).max(500),
  startDate: safeDate,
  endDate: safeDate,
  description: z.string().min(1).max(5000),
});

export const educationUpdateSchema = educationInsertSchema.partial();
