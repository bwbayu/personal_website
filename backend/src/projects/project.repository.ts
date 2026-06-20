import { Firestore } from '@google-cloud/firestore';
import { Project } from './project.type';
import { FirestoreRepository } from '../shared/firestore.repository';

// DI factory (parity with skills): an optional `db` lets tests inject an
// emulator-backed client; when omitted the generic repository falls back to the
// default Firestore singleton. `findAll` keeps the date ordering (default desc).
export const createProjectRepository = (db?: Firestore) => {
  const repo = new FirestoreRepository<Project>('projects', db);
  return {
    findAll: () => repo.findAllOrdered('date'),
    save:    (data: Project) => repo.save(data),
    update:  (id: string, data: Partial<Project>) => repo.update(id, data),
    remove:  (id: string) => repo.remove(id),
  };
};

export type ProjectRepository = ReturnType<typeof createProjectRepository>;
