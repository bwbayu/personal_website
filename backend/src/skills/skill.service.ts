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
});

export type SkillService = ReturnType<typeof createSkillService>;
