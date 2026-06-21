import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAboutService } from '../../src/about/about.service';
import type { AboutRepository } from '../../src/about/about.repository';
import type { About } from '../../src/about/about.type';

// Unit test for the about singleton service via DI: inject a fake repository (vi.fn
// stubs). The about repo has a custom shape (findOne, not findAll) for the single doc.
const makeFakeRepo = () =>
  ({
    findOne: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies AboutRepository;

const sampleAbout: About = {
  id: 'main',
  name: 'Bayu',
  email: 'bayu@example.com',
};

describe('about service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createAboutService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createAboutService(repo);
  });

  it('get passes through repo.findOne', async () => {
    repo.findOne.mockResolvedValue(sampleAbout);
    const result = await service.get();
    expect(repo.findOne).toHaveBeenCalledOnce();
    expect(result).toEqual(sampleAbout);
  });

  it('get returns null when the singleton doc is missing', async () => {
    repo.findOne.mockResolvedValue(null);
    expect(await service.get()).toBeNull();
  });

  it('insert forwards the about to repo.save', async () => {
    repo.save.mockResolvedValue(sampleAbout);
    const result = await service.insert(sampleAbout);
    expect(repo.save).toHaveBeenCalledWith(sampleAbout);
    expect(result).toEqual(sampleAbout);
  });

  it('update forwards id + partial and returns the updated about', async () => {
    const partial = { name: 'Bayu W' };
    const updated = { ...sampleAbout, ...partial };
    repo.update.mockResolvedValue(updated);
    const result = await service.update('main', partial);
    expect(repo.update).toHaveBeenCalledWith('main', partial);
    expect(result).toEqual(updated);
  });

  it('update returns null when the singleton doc is missing', async () => {
    repo.update.mockResolvedValue(null);
    const result = await service.update('main', { email: 'new@example.com' });
    expect(result).toBeNull();
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById('main')).toBe(true);

    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('main')).toBe(false);
  });
});
