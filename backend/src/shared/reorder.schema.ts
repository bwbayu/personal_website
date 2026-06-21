import { z } from 'zod';

// Shared body schema for the bulk reorder endpoints (skills, categories). The body
// is a bare JSON array of { id, order } pairs; `express.json` parses it and the
// validate middleware's `safeParse` accepts a top-level array.
export const reorderSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(200),
      order: z.number().int(),
    }),
  )
  .min(1)
  .max(500)
  .refine(
    (updates) => new Set(updates.map((u) => u.id)).size === updates.length,
    { message: 'Duplicate id in reorder payload' },
  );

export type ReorderUpdates = z.infer<typeof reorderSchema>;
