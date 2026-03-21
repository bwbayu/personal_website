import * as EducationRepository from './education.repository';
import { Education } from './education.type';

export const getAll = (): Promise<Education[]> => {
  return EducationRepository.findAll();
};

export const insert = (data: Education): Promise<Education> => {
  return EducationRepository.save(data);
};

export const update = (id: string, data: Partial<Education>): Promise<Education | null> => {
  return EducationRepository.update(id, data);
};

export const deleteById = (id: string): Promise<boolean> => {
  return EducationRepository.remove(id);
};
