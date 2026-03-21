import { MediaSocial } from './mediaSocial.type';
import { FirestoreRepository } from '../shared/firestore.repository';

const repo = new FirestoreRepository<MediaSocial>('mediaSocials');

export const findAll = () => repo.findAll();
export const save    = (data: MediaSocial) => repo.save(data);
export const update  = (id: string, data: Partial<MediaSocial>) => repo.update(id, data);
export const remove  = (id: string) => repo.remove(id);
