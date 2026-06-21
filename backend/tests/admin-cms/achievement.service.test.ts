import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAchievementService } from '../../src/achievements/achievements.service';
import type { AchievementRepository } from '../../src/achievements/achievements.repository';
import type { Achievement } from '../../src/achievements/achievements.type';

// Unit test for the achievements service via DI: inject a fake repository (vi.fn stubs).
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies AchievementRepository;

const sampleAchievement: Achievement = {
  id: '44444444-4444-4444-4444-444444444444',
  event_name: 'Hackathon',
  org_name: 'TechOrg',
  date: '2024-03-15',
  descriptions: ['Won first place'],
};

describe('achievement service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createAchievementService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createAchievementService(repo);
  });

  it('getAll passes through repo.findAll', async () => {
    repo.findAll.mockResolvedValue([sampleAchievement]);
    const result = await service.getAll();
    expect(repo.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([sampleAchievement]);
  });

  it('insert forwards the achievement to repo.save', async () => {
    repo.save.mockResolvedValue(sampleAchievement);
    const result = await service.insert(sampleAchievement);
    expect(repo.save).toHaveBeenCalledWith(sampleAchievement);
    expect(result).toEqual(sampleAchievement);
  });

  it('update forwards id + partial and returns the updated achievement', async () => {
    const partial = { descriptions: ['Won first place', 'Best UI award'] };
    const updated = { ...sampleAchievement, ...partial };
    repo.update.mockResolvedValue(updated);
    const result = await service.update(sampleAchievement.id, partial);
    expect(repo.update).toHaveBeenCalledWith(sampleAchievement.id, partial);
    expect(result).toEqual(updated);
  });

  it('update returns null when the repo reports the doc is missing', async () => {
    repo.update.mockResolvedValue(null);
    const result = await service.update('missing', { org_name: 'OtherOrg' });
    expect(result).toBeNull();
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById(sampleAchievement.id)).toBe(true);

    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('missing')).toBe(false);
  });
});
