import * as ProjectRepository from './project.repository';
import { Project } from './project.type';

export const getAll = (): Promise<Project[]> => {
  return ProjectRepository.findAll();
};

export const insert = (data: Project): Promise<Project> => {
  return ProjectRepository.save(data);
};

export const update = (id: string, data: Partial<Project>): Promise<Project | null> => {
  return ProjectRepository.update(id, data);
};

export const deleteById = (id: string): Promise<boolean> => {
  return ProjectRepository.remove(id);
};
