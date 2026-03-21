import { db } from '../config/firestore';

export class FirestoreRepository<T extends { id: string }> {
  constructor(private collection: string) {}

  async findAll(): Promise<T[]> {
    const snapshot = await db.collection(this.collection).get();
    return snapshot.docs.map(doc => doc.data() as T);
  }

  async findAllOrdered(field: string, direction: 'asc' | 'desc' = 'desc'): Promise<T[]> {
    const snapshot = await db.collection(this.collection).orderBy(field, direction).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  async save(data: T): Promise<T> {
    await db.collection(this.collection).doc(data.id).set(data);
    return data;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const ref = db.collection(this.collection).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    await ref.update(data as Record<string, any>);
    const updated = await ref.get();
    return updated.data() as T;
  }

  async remove(id: string): Promise<boolean> {
    const ref = db.collection(this.collection).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }
}
