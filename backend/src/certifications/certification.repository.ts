import { Firestore } from '@google-cloud/firestore';
import { Certification } from './certification.type';
import { FirestoreRepository } from '../shared/firestore.repository';

// DI factory: an optional `db` lets tests inject an emulator-backed client; when
// omitted the generic repository falls back to the default Firestore singleton.
export const createCertificationRepository = (db?: Firestore) => {
  const repo = new FirestoreRepository<Certification>('certifications', db);
  return {
    findAll: () => repo.findAllOrdered('issued'),
    save:    (data: Certification) => repo.save(data),
    update:  (id: string, data: Partial<Certification>) => repo.update(id, data),
    remove:  (id: string) => repo.remove(id),
  };
};

export type CertificationRepository = ReturnType<typeof createCertificationRepository>;
