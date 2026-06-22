import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDailyLogRepository } from '../../src/dailyLogs/dailyLog.repository';
import type { DailyLog } from '../../src/dailyLogs/dailyLog.type';
import { clearFirestore } from '../helpers/emulator';

// Emulator-backed test for the daily-logs repository against the real Firestore
// emulator: the date-desc ordered read, a save/findById/remove round-trip, and
// multiple entries sharing a date (DL2).
const makeLog = (over: Partial<DailyLog>): DailyLog => ({
  id: over.id ?? 'id-default',
  date: over.date ?? '2026-06-22',
  content: over.content ?? 'content',
  tags: over.tags ?? [],
  ...over,
});

describe('daily log repository (emulator)', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  it('findAllOrdered returns entries newest-date first', async () => {
    const repo = createDailyLogRepository();
    await repo.save(makeLog({ id: 'old', date: '2026-01-01' }));
    await repo.save(makeLog({ id: 'new', date: '2026-06-01' }));
    await repo.save(makeLog({ id: 'mid', date: '2026-03-01' }));

    const all = await repo.findAllOrdered();
    expect(all.map((l) => l.id)).toEqual(['new', 'mid', 'old']); // desc by date
  });

  it('save / findById / remove round-trip', async () => {
    const repo = createDailyLogRepository();
    await repo.save(makeLog({ id: 'l1' }));

    expect((await repo.findById('l1'))?.id).toBe('l1');
    expect(await repo.findById('ghost')).toBeNull();

    expect(await repo.remove('l1')).toBe(true);
    expect(await repo.findById('l1')).toBeNull();
    expect(await repo.remove('l1')).toBe(false); // already gone
  });

  it('returns every entry sharing the same date (DL2)', async () => {
    const repo = createDailyLogRepository();
    await repo.save(makeLog({ id: 'a', date: '2026-06-22' }));
    await repo.save(makeLog({ id: 'b', date: '2026-06-22' }));
    await repo.save(makeLog({ id: 'c', date: '2026-06-22' }));

    const all = await repo.findAllOrdered();
    expect(all.map((l) => l.id).sort()).toEqual(['a', 'b', 'c']);
  });
});
