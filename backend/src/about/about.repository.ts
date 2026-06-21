import { Firestore } from '@google-cloud/firestore';
import { db as defaultDb } from '../config/firestore';
import { About } from './about.type';

// DI factory for the about singleton. Unlike the other domains this does NOT use the
// generic FirestoreRepository: it targets a single fixed `about/main` doc, so the id
// is ignored on update/remove. An optional `db` lets tests inject an emulator client.
export const createAboutRepository = (db?: Firestore) => {
  const database = db ?? defaultDb;
  const docRef = () => database.collection('about').doc('main');

  return {
    findOne: async (): Promise<About | null> => {
      const doc = await docRef().get();
      if (!doc.exists) return null;
      return doc.data() as About;
    },

    save: async (data: About): Promise<About> => {
      await docRef().set(data);
      return data;
    },

    update: async (_id: string, data: Partial<About>): Promise<About | null> => {
      const ref = docRef();
      const doc = await ref.get();
      if (!doc.exists) return null;
      await ref.update(data as Record<string, any>);
      const updated = await ref.get();
      return updated.data() as About;
    },

    remove: async (_id: string): Promise<boolean> => {
      const ref = docRef();
      const doc = await ref.get();
      if (!doc.exists) return false;
      await ref.delete();
      return true;
    },
  };
};

export type AboutRepository = ReturnType<typeof createAboutRepository>;
