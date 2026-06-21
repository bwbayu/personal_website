import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSkillService } from '../../src/skills/skill.service';
import type { SkillRepository } from '../../src/skills/skill.repository';
import type { Skill } from '../../src/skills/skill.type';

// Proves the service validates the id set before writing: all-exist commits via
// repo.reorder; any unknown id short-circuits with { ok: false, missing } and never writes.
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
  }) satisfies SkillRepository;

const skill = (over: Partial<Skill>): Skill => ({
  id: 'x',
  name: 'X',
  categoryId: 'frontend',
  order: 0,
  isShow: true,
  ...over,
});

describe('skill service - reorder', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createSkillService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createSkillService(repo);
  });

  it('commits the updates and returns ok when every id exists', async () => {
    repo.findAll.mockResolvedValue([skill({ id: 'a' }), skill({ id: 'b' })]);
    const updates = [
      { id: 'a', order: 1 },
      { id: 'b', order: 0 },
    ];
    const result = await service.reorder(updates);
    expect(result).toEqual({ ok: true });
    expect(repo.reorder).toHaveBeenCalledWith(updates);
  });

  it('returns the missing ids and does NOT write when any id is unknown', async () => {
    repo.findAll.mockResolvedValue([skill({ id: 'a' })]);
    const result = await service.reorder([
      { id: 'a', order: 1 },
      { id: 'ghost', order: 0 },
    ]);
    expect(result).toEqual({ ok: false, missing: ['ghost'] });
    expect(repo.reorder).not.toHaveBeenCalled();
  });
});
