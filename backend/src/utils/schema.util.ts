import { z } from 'zod';

export const safeUrl = z.string().url().max(500).refine(
  (url) => url.startsWith('https://') || url.startsWith('http://'),
  { message: 'URL must use http or https protocol' }
);

export const safeDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine(
    (val) => !isNaN(new Date(val).getTime()) && new Date(val).toISOString().startsWith(val),
    { message: 'Date must be a valid calendar date' }
  );
