import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMediaSocialService } from '../../src/mediaSocials/mediaSocial.service';
import type { MediaSocialRepository } from '../../src/mediaSocials/mediaSocial.repository';
import type { MediaSocial } from '../../src/mediaSocials/mediaSocial.type';

// Unit test for the media-socials service via DI: inject a fake repository (vi.fn stubs).
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies MediaSocialRepository;

const sampleMediaSocial: MediaSocial = {
  id: '55555555-5555-5555-5555-555555555555',
  name: 'GitHub',
  url: 'https://github.com/example',
  iconClass: 'fa-github',
};

describe('media social service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createMediaSocialService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createMediaSocialService(repo);
  });

  it('getAll passes through repo.findAll', async () => {
    repo.findAll.mockResolvedValue([sampleMediaSocial]);
    const result = await service.getAll();
    expect(repo.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([sampleMediaSocial]);
  });

  it('insert forwards the media social to repo.save', async () => {
    repo.save.mockResolvedValue(sampleMediaSocial);
    const result = await service.insert(sampleMediaSocial);
    expect(repo.save).toHaveBeenCalledWith(sampleMediaSocial);
    expect(result).toEqual(sampleMediaSocial);
  });

  it('update forwards id + partial and returns the updated media social', async () => {
    const partial = { name: 'GitHub Profile' };
    const updated = { ...sampleMediaSocial, ...partial };
    repo.update.mockResolvedValue(updated);
    const result = await service.update(sampleMediaSocial.id, partial);
    expect(repo.update).toHaveBeenCalledWith(sampleMediaSocial.id, partial);
    expect(result).toEqual(updated);
  });

  it('update returns null when the repo reports the doc is missing', async () => {
    repo.update.mockResolvedValue(null);
    const result = await service.update('missing', { url: 'https://example.org' });
    expect(result).toBeNull();
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById(sampleMediaSocial.id)).toBe(true);

    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('missing')).toBe(false);
  });
});
