import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../src/config/firestore';
import { applyPatch } from '../../src/config/patch-data-model-cleanup';
import { clearFirestore } from '../helpers/emulator';

// Emulator-backed test for the one-off prod patch: write OLD-shape docs, run the
// patch, assert the NEW shape, then run it again and assert nothing changes
// (idempotency) and it does not throw.
describe('data-model cleanup patch (emulator)', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  it('transforms OLD-shape docs to the new shape and is idempotent', async () => {
    // OLD-shape skill (proficiency + category name); id matches a seeded skill so
    // the patch can resolve categoryId + order from the seed.
    await db.collection('skills').doc('python').set({
      id: 'python',
      name: 'Python',
      iconClass: 'devicon-python-plain colored text-3xl',
      category: 'Programming Languages',
      proficiency: '1+ years',
      isShow: true,
    });

    // OLD-shape project (Tech objects); UUID doc id must be preserved.
    const projectId = 'a3f1c2d4-0000-4000-8000-000000000000';
    await db.collection('projects').doc(projectId).set({
      id: projectId,
      name: 'StopJudol',
      date: '2025-09-01',
      description: 'desc',
      technologies: [
        { name: 'Python', iconClass: 'devicon-python-plain colored text-3xl' },
        { name: 'FastAPI', iconClass: 'devicon-fastapi-plain colored text-3xl' },
      ],
      role: ['Full-Stack Developer'],
      category: ['Web'],
    });

    // OLD-shape about with the dead headline field.
    await db.collection('about').doc('main').set({
      id: 'main',
      name: 'Bayu',
      email: 'bwbayuuu@gmail.com',
      headline: 'dead field',
    });

    // --- first run ---
    await applyPatch(db);

    const skill1 = (await db.collection('skills').doc('python').get()).data()!;
    expect(skill1.categoryId).toBe('programming-languages');
    expect(skill1.order).toBe(0);
    expect(skill1.proficiency).toBeUndefined();
    expect(skill1.category).toBeUndefined();

    const project1 = (await db.collection('projects').doc(projectId).get()).data()!;
    expect(project1.technologies).toEqual(['python', 'fastapi']);
    expect(project1.id).toBe(projectId); // UUID preserved

    const about1 = (await db.collection('about').doc('main').get()).data()!;
    expect(about1.headline).toBeUndefined();
    expect(about1.name).toBe('Bayu');

    const categories1 = await db.collection('categories').get();
    expect(categories1.size).toBe(6);

    // --- second run: idempotent + must not throw ---
    await expect(applyPatch(db)).resolves.toBeUndefined();

    const skill2 = (await db.collection('skills').doc('python').get()).data()!;
    expect(skill2).toEqual(skill1);

    const project2 = (await db.collection('projects').doc(projectId).get()).data()!;
    expect(project2.technologies).toEqual(['python', 'fastapi']);

    const about2 = (await db.collection('about').doc('main').get()).data()!;
    expect(about2.headline).toBeUndefined();

    const categories2 = await db.collection('categories').get();
    expect(categories2.size).toBe(6);
  });
});
