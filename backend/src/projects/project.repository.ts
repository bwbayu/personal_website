import { Project } from './project.type';
import { FirestoreRepository } from '../shared/firestore.repository';

const repo = new FirestoreRepository<Project>('projects');

export const findAll = () => repo.findAllOrdered('date');
export const save    = (data: Project) => repo.save(data);
export const update  = (id: string, data: Partial<Project>) => repo.update(id, data);
export const remove  = (id: string) => repo.remove(id);
