import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSkillService } from '../../src/skills/skill.service';
import type { SkillRepository } from '../../src/skills/skill.repository';
import type { Skill } from '../../src/skills/skill.type';

// Unit test for the skills service via DI: inject a fake repository (vi.fn stubs).
// No Firestore, no emulator — proves the mock seam established in TH-2.
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies SkillRepository;

const sampleSkill: Skill = {
  id: 'typescript',
  name: 'TypeScript',
  category: 'Programming Languages',
  proficiency: '3+ years',
  isShow: true,
};

describe('skill service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createSkillService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createSkillService(repo);
  });

  it('getAll passes through repo.findAll', async () => {
    repo.findAll.mockResolvedValue([sampleSkill]);
    const result = await service.getAll();
    expect(repo.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([sampleSkill]);
  });

  it('insert forwards the skill to repo.save', async () => {
    repo.save.mockResolvedValue(sampleSkill);
    const result = await service.insert(sampleSkill);
    expect(repo.save).toHaveBeenCalledWith(sampleSkill);
    expect(result).toEqual(sampleSkill);
  });

  it('update forwards id + partial and returns the updated skill', async () => {
    const partial = { proficiency: '4+ years' };
    const updated = { ...sampleSkill, ...partial };
    repo.update.mockResolvedValue(updated);
    const result = await service.update('typescript', partial);
    expect(repo.update).toHaveBeenCalledWith('typescript', partial);
    expect(result).toEqual(updated);
  });

  it('update returns null when the repo reports the doc is missing', async () => {
    repo.update.mockResolvedValue(null);
    const result = await service.update('missing', { isShow: false });
    expect(result).toBeNull();
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById('typescript')).toBe(true);

    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('missing')).toBe(false);
  });
});
