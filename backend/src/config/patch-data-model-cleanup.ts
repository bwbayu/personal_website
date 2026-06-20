import { Firestore, FieldValue } from '@google-cloud/firestore';
import { db } from './firestore';
import { toSlug } from '../utils/slug.util';
import { skillsSeed } from '../database/seeds/skills.seed';
import { categoriesSeed } from '../database/seeds/categories.seed';

// One-off, idempotent prod patch for the data-model cleanup. Transforms existing
// docs in place (preserving project UUIDs) to the new shapes. Re-runnable safely:
// deleting an absent field is a no-op, and the project transform tolerates already
// migrated string[] arrays. The category list and per-skill order/categoryId come
// from the seeds so seed and patch cannot drift.
export async function applyPatch(database: Firestore): Promise<void> {
  const batch = database.batch();

  // categories: upsert the canonical 6 docs (idempotent set).
  categoriesSeed.forEach(category => {
    batch.set(database.collection('categories').doc(category.id), category);
  });

  // skills: drop proficiency + the legacy category name, set categoryId + order.
  // Order/categoryId are sourced from the seed, matched by skill id, so a re-run
  // (where category is already gone) still resolves the same values.
  const skillMeta = new Map<string, { categoryId: string; order: number }>();
  skillsSeed.forEach(s => skillMeta.set(s.id, { categoryId: s.categoryId, order: s.order }));

  const skillsSnap = await database.collection('skills').get();
  skillsSnap.forEach(doc => {
    const data = doc.data();
    const meta = skillMeta.get(doc.id);
    const categoryId = meta?.categoryId ?? data.categoryId ?? toSlug(data.category ?? '');
    const order = meta?.order ?? (typeof data.order === 'number' ? data.order : 0);
    batch.update(doc.ref, {
      categoryId,
      order,
      proficiency: FieldValue.delete(),
      category: FieldValue.delete(),
    });
  });

  // projects: map technologies objects -> slug ids; guard idempotency so a second
  // run (already string[]) is a no-op.
  const projectsSnap = await database.collection('projects').get();
  projectsSnap.forEach(doc => {
    const data = doc.data();
    const technologies: string[] = (data.technologies ?? []).map((t: unknown) =>
      typeof t === 'string' ? t : toSlug((t as { name: string }).name),
    );
    batch.update(doc.ref, { technologies });
  });

  // about: drop the dead headline field on the fixed `main` doc.
  const aboutRef = database.collection('about').doc('main');
  const aboutDoc = await aboutRef.get();
  if (aboutDoc.exists) {
    batch.update(aboutRef, { headline: FieldValue.delete() });
  }

  await batch.commit();
  console.log(
    `[patch] categories upserted=${categoriesSeed.length}, skills=${skillsSnap.size}, ` +
      `projects=${projectsSnap.size}, about=${aboutDoc.exists ? 'main' : 'none'}`,
  );
}

// Run only when executed directly (ts-node entry), not when imported by tests.
if (require.main === module) {
  applyPatch(db).catch(console.error);
}
