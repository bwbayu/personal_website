import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDailyLogService } from '../../src/dailyLogs/dailyLog.service';
import type { DailyLogRepository } from '../../src/dailyLogs/dailyLog.repository';
import type { DailyLog } from '../../src/dailyLogs/dailyLog.type';

// Unit test via DI: inject a fake repository (vi.fn stubs). No Firestore. Exercises
// the thin daily-log service: the date-ordered read, pass-through insert/update,
// the missing-id 404 path, and the delete boolean.
const makeFakeRepo = () =>
  ({
    findAllOrdered: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }) satisfies DailyLogRepository;

const sample: DailyLog = {
  id: 'a3f1c2d4-0000-4000-8000-000000000000',
  date: '2026-06-22',
  content: 'Shipped the daily log.',
  tags: ['ship'],
};

describe('daily log service', () => {
  let repo: ReturnType<typeof makeFakeRepo>;
  let service: ReturnType<typeof createDailyLogService>;

  beforeEach(() => {
    repo = makeFakeRepo();
    service = createDailyLogService(repo);
    repo.save.mockImplementation(async (d: DailyLog) => d);
    repo.update.mockImplementation(async (_id: string, patch: Partial<DailyLog>) => patch as DailyLog);
  });

  it('getAll reads the date-ordered repo query once', async () => {
    repo.findAllOrdered.mockResolvedValue([sample]);
    await service.getAll();
    expect(repo.findAllOrdered).toHaveBeenCalledOnce();
  });

  it('insert saves the passed data including the controller-set id', async () => {
    const saved = await service.insert(sample);
    expect(repo.save).toHaveBeenCalledWith(sample);
    expect(saved.id).toBe(sample.id);
  });

  describe('update', () => {
    it('returns null and does not call repo.update when the entry does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      expect(await service.update('missing', { content: 'x' })).toBeNull();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('passes the patch straight through when the entry exists', async () => {
      repo.findById.mockResolvedValue(sample);
      await service.update(sample.id, { content: 'edited' });
      expect(repo.update).toHaveBeenCalledWith(sample.id, { content: 'edited' });
    });
  });

  it('deleteById returns the boolean from repo.remove', async () => {
    repo.remove.mockResolvedValue(true);
    expect(await service.deleteById(sample.id)).toBe(true);
    repo.remove.mockResolvedValue(false);
    expect(await service.deleteById('missing')).toBe(false);
  });
});
