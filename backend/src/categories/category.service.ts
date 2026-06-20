import { Category } from './category.type';
import { CategoryRepository } from './category.repository';

export const createCategoryService = (repo: CategoryRepository) => ({
  getAll: (): Promise<Category[]> => repo.findAll(),

  insert: (data: Category): Promise<Category> => repo.save(data),

  update: (id: string, data: Partial<Category>): Promise<Category | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type CategoryService = ReturnType<typeof createCategoryService>;
