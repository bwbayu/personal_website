import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createExperienceService } from '../../src/experiences/experience.service';
import type { ExperienceRepository } from '../../src/experiences/experience.repository';
import type { Experience } from '../../src/experiences/experience.type';

// Unit test for the experiences service via DI: inject a fake repository (vi.fn
// stubs). No Firestore, no emulator - proves the factory seam from the DI conversion.
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies ExperienceRepository;

const sampleExperience: Experience = {
  id: '11111111-1111-1111-1111-111111111111',
  company: 'Acme',
  position: 'Engineer',
  description: ['Built things'],
  location: 'Remote',
  startDate: '2024-01-01',
};

describe('experience service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createExperienceService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createExperienceService(repo);
  });

  it('getAll passes through repo.findAll', async () => {
    repo.findAll.mockResolvedValue([sampleExperience]);
    const result = await service.getAll();
    expect(repo.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([sampleExperience]);
  });

  it('insert forwards the experience to repo.save', async () => {
    repo.save.mockResolvedValue(sampleExperience);
    const result = await service.insert(sampleExperience);
    expect(repo.save).toHaveBeenCalledWith(sampleExperience);
    expect(result).toEqual(sampleExperience);
  });

  it('update forwards id + partial and returns the updated experience', async () => {
    const partial = { position: 'Senior Engineer' };
    const updated = { ...sampleExperience, ...partial };
    repo.update.mockResolvedValue(updated);
    const result = await service.update(sampleExperience.id, partial);
    expect(repo.update).toHaveBeenCalledWith(sampleExperience.id, partial);
    expect(result).toEqual(updated);
  });

  it('update returns null when the repo reports the doc is missing', async () => {
    repo.update.mockResolvedValue(null);
    const result = await service.update('missing', { location: 'Onsite' });
    expect(result).toBeNull();
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById(sampleExperience.id)).toBe(true);

    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('missing')).toBe(false);
  });
});
