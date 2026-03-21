import { db } from './firestore';

const REMOVE_CLASSES = ['text-4xl', 'bg-white'];

async function patchMediaSocials() {
  const snapshot = await db.collection('mediaSocials').get();
  if (snapshot.empty) {
    console.log('No mediaSocials documents found.');
    return;
  }

  const batch = db.batch();
  let patchCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const original: string = data.iconClass ?? '';
    const cleaned = original
      .split(' ')
      .filter((cls) => !REMOVE_CLASSES.includes(cls))
      .join(' ');

    if (cleaned !== original) {
      batch.update(doc.ref, { iconClass: cleaned });
      console.log(`[patch] ${doc.id}: "${original}" → "${cleaned}"`);
      patchCount++;
    }
  });

  if (patchCount === 0) {
    console.log('Nothing to patch.');
    return;
  }

  await batch.commit();
  console.log(`\nDone. Patched ${patchCount} document(s).`);
}

patchMediaSocials().catch(console.error);
