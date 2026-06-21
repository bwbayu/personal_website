import { Firestore } from '@google-cloud/firestore';
import { MediaSocial } from './mediaSocial.type';
import { FirestoreRepository } from '../shared/firestore.repository';

// DI factory: an optional `db` lets tests inject an emulator-backed client; when
// omitted the generic repository falls back to the default Firestore singleton.
export const createMediaSocialRepository = (db?: Firestore) => {
  const repo = new FirestoreRepository<MediaSocial>('mediaSocials', db);
  return {
    findAll: () => repo.findAll(),
    save:    (data: MediaSocial) => repo.save(data),
    update:  (id: string, data: Partial<MediaSocial>) => repo.update(id, data),
    remove:  (id: string) => repo.remove(id),
  };
};

export type MediaSocialRepository = ReturnType<typeof createMediaSocialRepository>;
