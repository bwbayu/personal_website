import { z } from 'zod';

const SKILL_CATEGORIES = [
  'Programming Languages',
  'Web/Cross Platform Framework & Libraries',
  'DevOps Tools',
  'Databases',
  'Cloud Platforms',
  'Data/AI Framework & Libraries',
] as const;

export const skillInsertSchema = z.object({
  name: z.string().min(1).max(200),
  iconClass: z.string().max(200).optional(),
  iconImage: z.string().max(500).optional(),
  category: z.enum(SKILL_CATEGORIES),
  proficiency: z.string().min(1).max(200),
  isShow: z.boolean(),
});

export const skillUpdateSchema = skillInsertSchema.partial();
