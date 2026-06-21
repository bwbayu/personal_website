import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FirestoreRepository } from '../../src/shared/firestore.repository';
import { clearFirestore } from '../helpers/emulator';

// Emulator-backed test for FirestoreRepository.reorder against the real Firestore
// emulator. Direct repository calls (no HTTP, no rate limiter). Proves a multi-doc
// order update commits, and that a missing id makes the whole batch reject with
// nothing written (atomicity).
type Probe = { id: string; name: string; order: number };

const COLLECTION = 'acmp_reorder_probe';

const makeRepo = () => new FirestoreRepository<Probe>(COLLECTION);

describe('FirestoreRepository.reorder (emulator)', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  it('atomically updates the order of every listed doc, leaving other fields untouched', async () => {
    const repo = makeRepo();
    await repo.save({ id: 'a', name: 'Alpha', order: 0 });
    await repo.save({ id: 'b', name: 'Bravo', order: 1 });
    await repo.save({ id: 'c', name: 'Charlie', order: 2 });

    await repo.reorder([
      { id: 'a', order: 2 },
      { id: 'c', order: 0 },
    ]);

    const byId = Object.fromEntries((await repo.findAll()).map((d) => [d.id, d]));
    expect(byId['a']).toEqual({ id: 'a', name: 'Alpha', order: 2 });
    expect(byId['c']).toEqual({ id: 'c', name: 'Charlie', order: 0 });
    // untouched
    expect(byId['b']).toEqual({ id: 'b', name: 'Bravo', order: 1 });
  });

  it('rejects and writes nothing when any id is missing (atomic)', async () => {
    const repo = makeRepo();
    await repo.save({ id: 'a', name: 'Alpha', order: 0 });
    await repo.save({ id: 'b', name: 'Bravo', order: 1 });

    await expect(
      repo.reorder([
        { id: 'a', order: 9 },
        { id: 'ghost', order: 5 },
      ]),
    ).rejects.toThrow();

    // No doc was modified — the existing orders are unchanged.
    const byId = Object.fromEntries((await repo.findAll()).map((d) => [d.id, d]));
    expect(byId['a'].order).toBe(0);
    expect(byId['b'].order).toBe(1);
  });
});
