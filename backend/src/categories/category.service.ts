import { Category } from './category.type';
import { CategoryRepository } from './category.repository';

export const createCategoryService = (repo: CategoryRepository) => ({
  getAll: (): Promise<Category[]> => repo.findAll(),

  // Auto-assign the next `order` on create so reordering always has distinct values.
  // Categories share one global order: next = max(order over all categories) + 1
  // (0 for the first category). Any client-supplied order is ignored on create.
  insert: async (data: Category): Promise<Category> => {
    const existing = (await repo.findAll()) ?? [];
    const orders = existing
      .map((c) => c.order)
      .filter((o): o is number => Number.isFinite(o));
    const order = orders.length ? Math.max(...orders) + 1 : 0;
    return repo.save({ ...data, order });
  },

  update: (id: string, data: Partial<Category>): Promise<Category | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type CategoryService = ReturnType<typeof createCategoryService>;
