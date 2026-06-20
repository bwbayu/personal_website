import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProjectService } from '../../src/projects/project.service';
import type { ProjectRepository } from '../../src/projects/project.repository';
import type { Project } from '../../src/projects/project.type';

// Unit test via DI: inject a fake repository (vi.fn stubs). No Firestore.
// Proves the projects module is DI-wired like skills.
const makeFakeRepo = () =>
  ({
    findAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies ProjectRepository;

const sampleProject: Project = {
  id: 'a3f1c2d4-0000-4000-8000-000000000000',
  name: 'Sample Project',
  date: '2025-01-01',
  description: 'A sample project.',
  technologies: ['python', 'fastapi'],
  role: ['Back-End Developer'],
  category: ['Web'],
};

describe('project service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createProjectService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createProjectService(repo);
  });

  it('getAll passes through repo.findAll', async () => {
    repo.findAll.mockResolvedValue([sampleProject]);
    const result = await service.getAll();
    expect(repo.findAll).toHaveBeenCalledOnce();
    expect(result).toEqual([sampleProject]);
  });

  it('insert forwards the project to repo.save', async () => {
    repo.save.mockResolvedValue(sampleProject);
    const result = await service.insert(sampleProject);
    expect(repo.save).toHaveBeenCalledWith(sampleProject);
    expect(result).toEqual(sampleProject);
  });

  it('update forwards id + partial and returns the updated project', async () => {
    const partial = { technologies: ['python'] };
    const updated = { ...sampleProject, ...partial };
    repo.update.mockResolvedValue(updated);
    const result = await service.update(sampleProject.id, partial);
    expect(repo.update).toHaveBeenCalledWith(sampleProject.id, partial);
    expect(result).toEqual(updated);
  });

  it('update returns null when the repo reports the doc is missing', async () => {
    repo.update.mockResolvedValue(null);
    const result = await service.update('missing', { name: 'x' });
    expect(result).toBeNull();
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById(sampleProject.id)).toBe(true);

    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('missing')).toBe(false);
  });
});
