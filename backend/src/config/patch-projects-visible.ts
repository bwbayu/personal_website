import { Firestore } from '@google-cloud/firestore';
import { db } from './firestore';

// One-off, idempotent prod patch: backfill the new `isShow` flag on existing project
// docs so every project is visible by default. Re-runnable safely — a doc that already
// carries a boolean isShow is left untouched, so a deliberate `false` is preserved on
// a second run.
export async function applyPatch(database: Firestore): Promise<void> {
  const snap = await database.collection('projects').get();

  const batch = database.batch();
  let patched = 0;
  snap.forEach(doc => {
    if (typeof doc.data().isShow !== 'boolean') {
      batch.update(doc.ref, { isShow: true });
      patched += 1;
    }
  });
  await batch.commit();

  console.log(`[patch] projects total=${snap.size}, isShow backfilled=${patched}`);
}

// Run only when executed directly (ts-node entry), not when imported by tests.
if (require.main === module) {
  applyPatch(db).catch(console.error);
}
