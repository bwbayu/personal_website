import * as ExperienceRepository from './experience.repository';
import { Experience } from './experience.type';

export const getAll = (): Promise<Experience[]> => {
  return ExperienceRepository.findAll();
};

export const insert = (data: Experience): Promise<Experience> => {
  return ExperienceRepository.save(data);
};

export const update = (id: string, data: Partial<Experience>): Promise<Experience | null> => {
  return ExperienceRepository.update(id, data);
};

export const deleteById = (id: string): Promise<boolean> => {
  return ExperienceRepository.remove(id);
};
