import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSkillService } from '../../src/skills/skill.service';
import type { SkillRepository } from '../../src/skills/skill.repository';
import type { Skill } from '../../src/skills/skill.type';

// Proves create auto-assigns the next per-category `order` so two new skills never
// collide on the default 0 and reorder always has distinct values.
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies SkillRepository;

const skill = (over: Partial<Skill>): Skill => ({
  id: 'x',
  name: 'X',
  categoryId: 'frontend',
  order: 0,
  isShow: true,
  ...over,
});

describe('skill service - auto-assign order on create', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createSkillService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createSkillService(repo);
    repo.save.mockImplementation(async (s: Skill) => s);
  });

  it('first skill in a category gets order 0', async () => {
    repo.findAll.mockResolvedValue([]);
    const result = await service.insert(skill({ categoryId: 'frontend' }));
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ order: 0 }));
    expect(result.order).toBe(0);
  });

  it('next skill in the same category gets max(order) + 1', async () => {
    repo.findAll.mockResolvedValue([
      skill({ id: 'a', categoryId: 'frontend', order: 0 }),
      skill({ id: 'b', categoryId: 'frontend', order: 2 }),
    ]);
    const result = await service.insert(skill({ id: 'c', categoryId: 'frontend' }));
    expect(result.order).toBe(3);
  });

  it('scopes order per category (ignores other categories)', async () => {
    repo.findAll.mockResolvedValue([
      skill({ id: 'a', categoryId: 'backend', order: 9 }),
      skill({ id: 'b', categoryId: 'frontend', order: 1 }),
    ]);
    const result = await service.insert(skill({ id: 'c', categoryId: 'frontend' }));
    expect(result.order).toBe(2);
  });

  it('overrides any client-supplied order on create', async () => {
    repo.findAll.mockResolvedValue([skill({ id: 'a', categoryId: 'frontend', order: 4 })]);
    const result = await service.insert(skill({ id: 'c', categoryId: 'frontend', order: 99 }));
    expect(result.order).toBe(5);
  });
});
