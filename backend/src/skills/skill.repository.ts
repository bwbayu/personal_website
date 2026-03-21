import { Skill } from './skill.type';
import { FirestoreRepository } from '../shared/firestore.repository';

const repo = new FirestoreRepository<Skill>('skills');

export const findAll = () => repo.findAll();
export const save    = (data: Skill) => repo.save(data);
export const update  = (id: string, data: Partial<Skill>) => repo.update(id, data);
export const remove  = (id: string) => repo.remove(id);
