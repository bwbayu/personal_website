import { Experience } from './experience.type';
import { ExperienceRepository } from './experience.repository';

export const createExperienceService = (repo: ExperienceRepository) => ({
  getAll: (): Promise<Experience[]> => repo.findAll(),

  insert: (data: Experience): Promise<Experience> => repo.save(data),

  update: (id: string, data: Partial<Experience>): Promise<Experience | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type ExperienceService = ReturnType<typeof createExperienceService>;
