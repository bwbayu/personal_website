import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createCategoryRepository } from '../../src/categories/category.repository';
import type { Category } from '../../src/categories/category.type';
import { clearFirestore } from '../helpers/emulator';

// Emulator-backed test for the categories deviation: findAll returns docs ordered
// by `order asc`, regardless of insertion order.
describe('category repository (emulator)', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  it('findAll returns categories sorted by order asc', async () => {
    const repo = createCategoryRepository();
    // Save out of order on purpose.
    const cloud: Category = { id: 'cloud-platforms', name: 'Cloud Platforms', order: 4 };
    const langs: Category = { id: 'programming-languages', name: 'Programming Languages', order: 0 };
    const dbs: Category = { id: 'databases', name: 'Databases', order: 3 };
    await repo.save(cloud);
    await repo.save(langs);
    await repo.save(dbs);

    const all = await repo.findAll();
    expect(all.map(c => c.order)).toEqual([0, 3, 4]);
    expect(all.map(c => c.id)).toEqual(['programming-languages', 'databases', 'cloud-platforms']);
  });
});
