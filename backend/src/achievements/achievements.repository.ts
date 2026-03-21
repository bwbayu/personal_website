import { Achievement } from './achievements.type';
import { FirestoreRepository } from '../shared/firestore.repository';

const repo = new FirestoreRepository<Achievement>('achievements');

export const findAll = () => repo.findAllOrdered('date');
export const save    = (data: Achievement) => repo.save(data);
export const update  = (id: string, data: Partial<Achievement>) => repo.update(id, data);
export const remove  = (id: string) => repo.remove(id);
