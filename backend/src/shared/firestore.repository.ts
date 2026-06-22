import { Firestore } from '@google-cloud/firestore';
import { db as defaultDb } from '../config/firestore';

export class FirestoreRepository<T extends { id: string }> {
  constructor(private collection: string, private db: Firestore = defaultDb) {}

  async findAll(): Promise<T[]> {
    const snapshot = await this.db.collection(this.collection).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  async findAllOrdered(field: string, direction: 'asc' | 'desc' = 'desc'): Promise<T[]> {
    const snapshot = await this.db.collection(this.collection).orderBy(field, direction).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.db.collection(this.collection).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as T;
  }

  async findByField(field: string, value: unknown): Promise<T[]> {
    const snapshot = await this.db.collection(this.collection).where(field, '==', value).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  async findByFieldOrdered(
    field: string,
    value: unknown,
    orderField: string,
    direction: 'asc' | 'desc' = 'desc',
  ): Promise<T[]> {
    const snapshot = await this.db
      .collection(this.collection)
      .where(field, '==', value)
      .orderBy(orderField, direction)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  async save(data: T): Promise<T> {
    await this.db.collection(this.collection).doc(data.id).set(data);
    return data;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const ref = this.db.collection(this.collection).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.update(data as Record<string, any>);
    const updated = await ref.get();
    return updated.data() as T;
  }

  async remove(id: string): Promise<boolean> {
    const ref = this.db.collection(this.collection).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }

  // Atomically set the `order` of many docs in one write. `batch.update` requires
  // every target doc to already exist, so a missing id makes the whole commit reject
  // with nothing written (all-or-nothing). Other fields are left untouched.
  async reorder(updates: { id: string; order: number }[]): Promise<void> {
    const batch = this.db.batch();
    for (const { id, order } of updates) {
      batch.update(this.db.collection(this.collection).doc(id), { order });
    }
    await batch.commit();
  }
}
