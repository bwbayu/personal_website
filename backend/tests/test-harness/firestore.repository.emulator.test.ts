import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FirestoreRepository } from '../../src/shared/firestore.repository';
import { db } from '../../src/config/firestore';
import { clearFirestore } from '../helpers/emulator';

// Emulator-backed test for the generic FirestoreRepository against the real
// Firestore emulator (project demo-test, no GCP credentials). Covers the
// doc.exists null/false branches and findAllOrdered direction.
type Probe = { id: string; name: string; rank: number };

const COLLECTION = 'th_emulator_probe';

const makeRepo = () => new FirestoreRepository<Probe>(COLLECTION);

describe('FirestoreRepository (emulator)', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  it('save then findAll returns the persisted document', async () => {
    const repo = makeRepo();
    const doc: Probe = { id: 'a', name: 'Alpha', rank: 1 };
    await repo.save(doc);
    const all = await repo.findAll();
    expect(all).toEqual([doc]);
  });

  it('findAll projects the doc id even when the stored body omits it', async () => {
    // Write a raw doc whose body has NO embedded `id` field; findAll must still
    // surface the document id (parity with findAllOrdered).
    await db.collection(COLLECTION).doc('zeta').set({ name: 'Zeta', rank: 9 });
    const [only] = await makeRepo().findAll();
    expect(only).toEqual({ id: 'zeta', name: 'Zeta', rank: 9 });
  });

  it('findAllOrdered honors ascending and default-descending direction', async () => {
    const repo = makeRepo();
    await repo.save({ id: 'a', name: 'Alpha', rank: 1 });
    await repo.save({ id: 'b', name: 'Bravo', rank: 2 });
    await repo.save({ id: 'c', name: 'Charlie', rank: 3 });

    const asc = await repo.findAllOrdered('rank', 'asc');
    expect(asc.map(d => d.rank)).toEqual([1, 2, 3]);

    // default direction is descending
    const desc = await repo.findAllOrdered('rank');
    expect(desc.map(d => d.rank)).toEqual([3, 2, 1]);
  });

  it('update merges fields on an existing doc and returns null when missing', async () => {
    const repo = makeRepo();
    await repo.save({ id: 'a', name: 'Alpha', rank: 1 });

    const updated = await repo.update('a', { name: 'Alpha Prime' });
    expect(updated).toMatchObject({ id: 'a', name: 'Alpha Prime', rank: 1 });

    const missing = await repo.update('does-not-exist', { name: 'x' });
    expect(missing).toBeNull();
  });

  it('remove returns true for an existing doc and false when missing', async () => {
    const repo = makeRepo();
    await repo.save({ id: 'a', name: 'Alpha', rank: 1 });

    expect(await repo.remove('a')).toBe(true);
    expect(await repo.findAll()).toEqual([]);

    expect(await repo.remove('does-not-exist')).toBe(false);
  });
});
