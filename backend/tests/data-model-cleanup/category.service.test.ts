import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCategoryService } from '../../src/categories/category.service';
import type { CategoryRepository } from '../../src/categories/category.repository';
import type { Category } from '../../src/categories/category.type';

// Unit test via DI: inject a fake repository (vi.fn stubs). No Firestore.
// Modeled on the skills service test.
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies CategoryRepository;

const sampleCategory: Category = {
  id: 'programming-languages',
  name: 'Programming Languages',
  order: 0,
};

describe('category service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createCategoryService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createCategoryService(repo);
  });

  it('getAll passes through repo.findAll', async () => {
    repo.findAll.mockResolvedValue([sampleCategory]);
    const result = await service.getAll();
    expect(repo.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([sampleCategory]);
  });

  it('insert forwards the category to repo.save', async () => {
    repo.save.mockResolvedValue(sampleCategory);
    const result = await service.insert(sampleCategory);
    expect(repo.save).toHaveBeenCalledWith(sampleCategory);
    expect(result).toEqual(sampleCategory);
  });

  it('update forwards id + partial and returns the updated category', async () => {
    const partial = { order: 3 };
    const updated = { ...sampleCategory, ...partial };
    repo.update.mockResolvedValue(updated);
    const result = await service.update('programming-languages', partial);
    expect(repo.update).toHaveBeenCalledWith('programming-languages', partial);
    expect(result).toEqual(updated);
  });

  it('update returns null when the repo reports the doc is missing', async () => {
    repo.update.mockResolvedValue(null);
    const result = await service.update('missing', { order: 1 });
    expect(result).toBeNull();
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById('programming-languages')).toBe(true);

    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('missing')).toBe(false);
  });
});
