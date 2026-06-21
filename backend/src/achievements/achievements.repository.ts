import { Firestore } from '@google-cloud/firestore';
import { Achievement } from './achievements.type';
import { FirestoreRepository } from '../shared/firestore.repository';

// DI factory: an optional `db` lets tests inject an emulator-backed client; when
// omitted the generic repository falls back to the default Firestore singleton.
export const createAchievementRepository = (db?: Firestore) => {
  const repo = new FirestoreRepository<Achievement>('achievements', db);
  return {
    findAll: () => repo.findAllOrdered('date'),
    save:    (data: Achievement) => repo.save(data),
    update:  (id: string, data: Partial<Achievement>) => repo.update(id, data),
    remove:  (id: string) => repo.remove(id),
  };
};

export type AchievementRepository = ReturnType<typeof createAchievementRepository>;
