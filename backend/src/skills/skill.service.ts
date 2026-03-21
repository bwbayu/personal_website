import * as SkillRepository from './skill.repository';
import { Skill } from './skill.type';

export const getAll = (): Promise<Skill[]> => {
  return SkillRepository.findAll();
};

export const insert = (data: Skill): Promise<Skill> => {
  return SkillRepository.save(data);
};

export const update = (id: string, data: Partial<Skill>): Promise<Skill | null> => {
  return SkillRepository.update(id, data);
};

export const deleteById = (id: string): Promise<boolean> => {
  return SkillRepository.remove(id);
};
