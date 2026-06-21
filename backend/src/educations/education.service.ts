import { Education } from './education.type';
import { EducationRepository } from './education.repository';

export const createEducationService = (repo: EducationRepository) => ({
  getAll: (): Promise<Education[]> => repo.findAll(),

  insert: (data: Education): Promise<Education> => repo.save(data),

  update: (id: string, data: Partial<Education>): Promise<Education | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type EducationService = ReturnType<typeof createEducationService>;
