import { Education } from './education.type';
import { FirestoreRepository } from '../shared/firestore.repository';

const repo = new FirestoreRepository<Education>('educations');

export const findAll = () => repo.findAllOrdered('endDate');
export const save    = (data: Education) => repo.save(data);
export const update  = (id: string, data: Partial<Education>) => repo.update(id, data);
export const remove  = (id: string) => repo.remove(id);
