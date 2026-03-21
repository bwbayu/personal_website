import { Experience } from './experience.type';
import { FirestoreRepository } from '../shared/firestore.repository';

const repo = new FirestoreRepository<Experience>('experiences');

export const findAll = () => repo.findAllOrdered('startDate');
export const save    = (data: Experience) => repo.save(data);
export const update  = (id: string, data: Partial<Experience>) => repo.update(id, data);
export const remove  = (id: string) => repo.remove(id);
