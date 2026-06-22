import { Firestore } from '@google-cloud/firestore';
import { DailyLog } from './dailyLog.type';
import { FirestoreRepository } from '../shared/firestore.repository';

// DI factory (parity with posts/projects): an optional `db` lets tests inject an
// emulator-backed client; when omitted the generic repository falls back to the
// default Firestore singleton.
export const createDailyLogRepository = (db?: Firestore) => {
  const repo = new FirestoreRepository<DailyLog>('dailyLogs', db);
  return {
    // Every entry has a `date`, so a single ordered query returns them all
    // newest-date-first (no drafts-missing-field edge like posts).
    findAllOrdered: () => repo.findAllOrdered('date', 'desc'),
    findById: (id: string) => repo.findById(id),
    save: (data: DailyLog) => repo.save(data),
    update: (id: string, data: Partial<DailyLog>) => repo.update(id, data),
    remove: (id: string) => repo.remove(id),
  };
};

export type DailyLogRepository = ReturnType<typeof createDailyLogRepository>;
