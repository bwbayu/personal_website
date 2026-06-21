import { Skill } from './skill.type';
import { SkillRepository } from './skill.repository';

export const createSkillService = (repo: SkillRepository) => ({
  getAll: (): Promise<Skill[]> => repo.findAll(),

  // Auto-assign the next `order` on create so reordering always has distinct values.
  // Order is scoped per category: next = max(order of skills in the same categoryId) + 1
  // (0 for the first skill in a category). Any client-supplied order is ignored on create.
  insert: async (data: Skill): Promise<Skill> => {
    const existing = (await repo.findAll()) ?? [];
    const orders = existing
      .filter((s) => s.categoryId === data.categoryId)
      .map((s) => s.order)
      .filter((o): o is number => Number.isFinite(o));
    const order = orders.length ? Math.max(...orders) + 1 : 0;
    return repo.save({ ...data, order });
  },

  update: (id: string, data: Partial<Skill>): Promise<Skill | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),

  // Bulk-reorder skills atomically. Validates that every id exists before touching
  // Firestore; on any unknown id it returns the offenders and writes nothing.
  reorder: async (
    updates: { id: string; order: number }[],
  ): Promise<{ ok: true } | { ok: false; missing: string[] }> => {
    const ids = new Set((await repo.findAll()).map((s) => s.id));
    const missing = updates.filter((u) => !ids.has(u.id)).map((u) => u.id);
    if (missing.length) return { ok: false, missing };
    await repo.reorder(updates);
    return { ok: true };
  },
});

export type SkillService = ReturnType<typeof createSkillService>;
