import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCertificationService } from '../../src/certifications/certification.service';
import type { CertificationRepository } from '../../src/certifications/certification.repository';
import type { Certification } from '../../src/certifications/certification.type';

// Unit test for the certifications service via DI: inject a fake repository (vi.fn stubs).
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies CertificationRepository;

const sampleCertification: Certification = {
  id: '33333333-3333-3333-3333-333333333333',
  company_name: 'Cloud Provider',
  title: 'Associate Cloud Engineer',
  issued: '2023-05-01',
};

describe('certification service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createCertificationService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createCertificationService(repo);
  });

  it('getAll passes through repo.findAll', async () => {
    repo.findAll.mockResolvedValue([sampleCertification]);
    const result = await service.getAll();
    expect(repo.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([sampleCertification]);
  });

  it('insert forwards the certification to repo.save', async () => {
    repo.save.mockResolvedValue(sampleCertification);
    const result = await service.insert(sampleCertification);
    expect(repo.save).toHaveBeenCalledWith(sampleCertification);
    expect(result).toEqual(sampleCertification);
  });

  it('update forwards id + partial and returns the updated certification', async () => {
    const partial = { title: 'Professional Cloud Engineer' };
    const updated = { ...sampleCertification, ...partial };
    repo.update.mockResolvedValue(updated);
    const result = await service.update(sampleCertification.id, partial);
    expect(repo.update).toHaveBeenCalledWith(sampleCertification.id, partial);
    expect(result).toEqual(updated);
  });

  it('update returns null when the repo reports the doc is missing', async () => {
    repo.update.mockResolvedValue(null);
    const result = await service.update('missing', { url: 'https://example.com' });
    expect(result).toBeNull();
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById(sampleCertification.id)).toBe(true);

    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('missing')).toBe(false);
  });
});
