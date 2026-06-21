import { Firestore } from '@google-cloud/firestore';
import { Education } from './education.type';
import { FirestoreRepository } from '../shared/firestore.repository';

// DI factory: an optional `db` lets tests inject an emulator-backed client; when
// omitted the generic repository falls back to the default Firestore singleton.
export const createEducationRepository = (db?: Firestore) => {
  const repo = new FirestoreRepository<Education>('educations', db);
  return {
    findAll: () => repo.findAllOrdered('endDate'),
    save:    (data: Education) => repo.save(data),
    update:  (id: string, data: Partial<Education>) => repo.update(id, data),
    remove:  (id: string) => repo.remove(id),
  };
};

export type EducationRepository = ReturnType<typeof createEducationRepository>;
