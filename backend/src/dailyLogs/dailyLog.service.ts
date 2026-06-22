import { DailyLog } from './dailyLog.type';
import { DailyLogRepository } from './dailyLog.repository';

// Insert payload: the controller supplies `id` (uuid). No derived fields, so the
// insert shape is just the full DailyLog.
export type DailyLogInsert = DailyLog;
export type DailyLogUpdate = Partial<Omit<DailyLog, 'id'>>;

export const createDailyLogService = (repo: DailyLogRepository) => ({
  getAll: (): Promise<DailyLog[]> => repo.findAllOrdered(),

  insert: (data: DailyLogInsert): Promise<DailyLog> => repo.save(data),

  update: async (id: string, data: DailyLogUpdate): Promise<DailyLog | null> => {
    const current = await repo.findById(id);
    if (!current) return null;
    return repo.update(id, data);
  },

  deleteById: (id: string): Promise<boolean> => repo.remove(id),
});

export type DailyLogService = ReturnType<typeof createDailyLogService>;
