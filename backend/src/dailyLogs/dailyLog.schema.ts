import { z } from 'zod';
import { safeDate } from '../utils/schema.util';

// `id` is server-managed (uuid set on write) and deliberately NOT accepted from the
// client body — Zod strips it so it can't be injected.
const dailyLogBase = z.object({
  date: safeDate,
  content: z.string().min(1).max(5000),
  tags: z.array(z.string().min(1).max(50)).max(20),
});

// Insert defaults tags to [] when omitted. The default lives only here, not on the
// update partial — otherwise a PATCH omitting tags would inject [] and wipe them.
export const dailyLogInsertSchema = dailyLogBase.extend({ tags: dailyLogBase.shape.tags.default([]) });

export const dailyLogUpdateSchema = dailyLogBase.partial();
