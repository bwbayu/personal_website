import { z } from 'zod';
import { safeUrl, safeDate } from '../utils/schema.util';

export const certificationInsertSchema = z.object({
  company_name: z.string().min(1).max(500),
  title: z.string().min(1).max(500),
  issued: safeDate,
  expires: safeDate.optional(),
  url: safeUrl.optional(),
});

export const certificationUpdateSchema = certificationInsertSchema.partial();
