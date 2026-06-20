import { Skill } from './skill.type';
import { SkillRepository } from './skill.repository';

export const createSkillService = (repo: SkillRepository) => ({
  getAll: (): Promise<Skill[]> => repo.findAll(),

  insert: (data: Skill): Promise<Skill> => repo.save(data),

  update: (id: string, data: Partial<Skill>): Promise<Skill | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type SkillService = ReturnType<typeof createSkillService>;
