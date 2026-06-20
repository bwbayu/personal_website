import { Firestore } from '@google-cloud/firestore';
import { Category } from './category.type';
import { FirestoreRepository } from '../shared/firestore.repository';

// DI factory (parity with skills): an optional `db` lets tests inject an
// emulator-backed client; when omitted the generic repository falls back to the
// default Firestore singleton. `findAll` returns categories ordered by `order asc`.
export const createCategoryRepository = (db?: Firestore) => {
  const repo = new FirestoreRepository<Category>('categories', db);
  return {
    findAll: () => repo.findAllOrdered('order', 'asc'),
    save:    (data: Category) => repo.save(data),
    update:  (id: string, data: Partial<Category>) => repo.update(id, data),
    remove:  (id: string) => repo.remove(id),
  };
};

export type CategoryRepository = ReturnType<typeof createCategoryRepository>;
