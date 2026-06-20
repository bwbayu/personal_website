import { Project } from './project.type';
import { ProjectRepository } from './project.repository';

export const createProjectService = (repo: ProjectRepository) => ({
  getAll: (): Promise<Project[]> => repo.findAll(),

  insert: (data: Project): Promise<Project> => repo.save(data),

  update: (id: string, data: Partial<Project>): Promise<Project | null> => repo.update(id, data),

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type ProjectService = ReturnType<typeof createProjectService>;
