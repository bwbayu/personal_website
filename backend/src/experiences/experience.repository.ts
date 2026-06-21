import { Firestore } from '@google-cloud/firestore';
import { Experience } from './experience.type';
import { FirestoreRepository } from '../shared/firestore.repository';

// DI factory: an optional `db` lets tests inject an emulator-backed client; when
// omitted the generic repository falls back to the default Firestore singleton.
export const createExperienceRepository = (db?: Firestore) => {
  const repo = new FirestoreRepository<Experience>('experiences', db);
  return {
    findAll: () => repo.findAllOrdered('startDate'),
    save:    (data: Experience) => repo.save(data),
    update:  (id: string, data: Partial<Experience>) => repo.update(id, data),
    remove:  (id: string) => repo.remove(id),
  };
};

export type ExperienceRepository = ReturnType<typeof createExperienceRepository>;
