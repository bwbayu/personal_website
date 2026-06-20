import { Firestore } from '@google-cloud/firestore';
import { Skill } from './skill.type';
import { FirestoreRepository } from '../shared/firestore.repository';

// DI factory: an optional `db` lets tests inject an emulator-backed client; when
// omitted the generic repository falls back to the default Firestore singleton.
export const createSkillRepository = (db?: Firestore) => {
  const repo = new FirestoreRepository<Skill>('skills', db);
  return {
    findAll: () => repo.findAll(),
    save:    (data: Skill) => repo.save(data),
    update:  (id: string, data: Partial<Skill>) => repo.update(id, data),
    remove:  (id: string) => repo.remove(id),
  };
};

export type SkillRepository = ReturnType<typeof createSkillRepository>;
