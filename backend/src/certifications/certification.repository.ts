import { Certification } from './certification.type';
import { FirestoreRepository } from '../shared/firestore.repository';

const repo = new FirestoreRepository<Certification>('certifications');

export const findAll = () => repo.findAllOrdered('issued');
export const save    = (data: Certification) => repo.save(data);
export const update  = (id: string, data: Partial<Certification>) => repo.update(id, data);
export const remove  = (id: string) => repo.remove(id);
