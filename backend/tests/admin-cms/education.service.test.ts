import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEducationService } from '../../src/educations/education.service';
import type { EducationRepository } from '../../src/educations/education.repository';
import type { Education } from '../../src/educations/education.type';

// Unit test for the educations service via DI: inject a fake repository (vi.fn stubs).
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies EducationRepository;

const sampleEducation: Education = {
  id: '22222222-2222-2222-2222-222222222222',
  institution: 'State University',
  title: 'BSc Computer Science',
  startDate: '2018-09-01',
  endDate: '2022-06-30',
  description: 'Studied software engineering',
};

describe('education service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createEducationService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createEducationService(repo);
  });

  it('getAll passes through repo.findAll', async () => {
    repo.findAll.mockResolvedValue([sampleEducation]);
    const result = await service.getAll();
    expect(repo.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([sampleEducation]);
  });

  it('insert forwards the education to repo.save', async () => {
    repo.save.mockResolvedValue(sampleEducation);
    const result = await service.insert(sampleEducation);
    expect(repo.save).toHaveBeenCalledWith(sampleEducation);
    expect(result).toEqual(sampleEducation);
  });

  it('update forwards id + partial and returns the updated education', async () => {
    const partial = { title: 'MSc Computer Science' };
    const updated = { ...sampleEducation, ...partial };
    repo.update.mockResolvedValue(updated);
    const result = await service.update(sampleEducation.id, partial);
    expect(repo.update).toHaveBeenCalledWith(sampleEducation.id, partial);
    expect(result).toEqual(updated);
  });

  it('update returns null when the repo reports the doc is missing', async () => {
    repo.update.mockResolvedValue(null);
    const result = await service.update('missing', { description: 'x' });
    expect(result).toBeNull();
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById(sampleEducation.id)).toBe(true);

    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('missing')).toBe(false);
  });
});
