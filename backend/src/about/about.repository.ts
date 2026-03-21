import { db } from '../config/firestore';
import { About } from './about.type';

const docRef = () => db.collection('about').doc('main');

export const findOne = async (): Promise<About | null> => {
  const doc = await docRef().get();
  if (!doc.exists) return null;
  return doc.data() as About;
};

export const save = async (data: About): Promise<About> => {
  await docRef().set(data);
  return data;
};

export const update = async (_id: string, data: Partial<About>): Promise<About | null> => {
  const ref = docRef();
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update(data as Record<string, any>);
  const updated = await ref.get();
  return updated.data() as About;
};

export const remove = async (_id: string): Promise<boolean> => {
  const ref = docRef();
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
};
