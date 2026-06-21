import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCategoryService } from '../../src/categories/category.service';
import type { CategoryRepository } from '../../src/categories/category.repository';
import type { Category } from '../../src/categories/category.type';

// Proves create auto-assigns the next global `order` (max over all categories + 1) so
// new categories never collide on the default 0 and reorder has distinct values.
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
  }) satisfies CategoryRepository;

const category = (over: Partial<Category>): Category => ({
  id: 'x',
  name: 'X',
  order: 0,
  ...over,
});

describe('category service - auto-assign order on create', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createCategoryService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createCategoryService(repo);
    repo.save.mockImplementation(async (c: Category) => c);
  });

  it('first category gets order 0', async () => {
    repo.findAll.mockResolvedValue([]);
    const result = await service.insert(category({}));
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ order: 0 }));
    expect(result.order).toBe(0);
  });

  it('next category gets max(order) + 1 across all categories', async () => {
    repo.findAll.mockResolvedValue([
      category({ id: 'a', order: 0 }),
      category({ id: 'b', order: 3 }),
      category({ id: 'c', order: 1 }),
    ]);
    const result = await service.insert(category({ id: 'd' }));
    expect(result.order).toBe(4);
  });

  it('overrides any client-supplied order on create', async () => {
    repo.findAll.mockResolvedValue([category({ id: 'a', order: 2 })]);
    const result = await service.insert(category({ id: 'd', order: 99 }));
    expect(result.order).toBe(3);
  });
});
