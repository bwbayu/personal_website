import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCategoryService } from '../../src/categories/category.service';
import type { CategoryRepository } from '../../src/categories/category.repository';
import type { Category } from '../../src/categories/category.type';

// Proves the service validates the id set before writing: all-exist commits via
// repo.reorder; any unknown id short-circuits with { ok: false, missing } and never writes.
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

describe('category service - reorder', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createCategoryService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createCategoryService(repo);
  });

  it('commits the updates and returns ok when every id exists', async () => {
    repo.findAll.mockResolvedValue([category({ id: 'a' }), category({ id: 'b' })]);
    const updates = [
      { id: 'a', order: 1 },
      { id: 'b', order: 0 },
    ];
    const result = await service.reorder(updates);
    expect(result).toEqual({ ok: true });
    expect(repo.reorder).toHaveBeenCalledWith(updates);
  });

  it('returns the missing ids and does NOT write when any id is unknown', async () => {
    repo.findAll.mockResolvedValue([category({ id: 'a' })]);
    const result = await service.reorder([
      { id: 'a', order: 1 },
      { id: 'ghost', order: 0 },
    ]);
    expect(result).toEqual({ ok: false, missing: ['ghost'] });
    expect(repo.reorder).not.toHaveBeenCalled();
  });
});
