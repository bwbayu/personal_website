import { randomUUID } from 'crypto';
import { db } from './firestore';
import { skillsSeed }         from '../database/seeds/skills.seed';
import { projectsSeed }       from '../database/seeds/projects.seed';
import { experiencesSeed }    from '../database/seeds/experiences.seed';
import { educationsSeed }     from '../database/seeds/educations.seed';
import { achievementsSeed }   from '../database/seeds/achievements.seed';
import { certificationsSeed } from '../database/seeds/certifications.seed';
import { mediaSocialsSeed }   from '../database/seeds/mediaSocials.seed';
import { aboutSeed }          from '../database/seeds/about.seed';

async function seedCollection(
  collectionName: string,
  items: Record<string, any>[]
) {
  const snapshot = await db.collection(collectionName).limit(1).get();
  if (!snapshot.empty) {
    console.log(`[skip] '${collectionName}' already has data`);
    return;
  }

  const batch = db.batch();
  items.forEach((item) => {
    const ref = db.collection(collectionName).doc(randomUUID());
    batch.set(ref, item);
  });
  await batch.commit();
  console.log(`[done] '${collectionName}' seeded with ${items.length} documents`);
}

async function seedSkills() {
  const snapshot = await db.collection('skills').limit(1).get();
  if (!snapshot.empty) {
    console.log(`[skip] 'skills' already has data`);
    return;
  }

  const batch = db.batch();
  // skills use name-slug as doc ID (also stored as id field)
  skillsSeed.forEach(skill => {
    const ref = db.collection('skills').doc(skill.id);
    batch.set(ref, skill);
  });
  await batch.commit();
  console.log(`[done] 'skills' seeded with ${skillsSeed.length} documents`);
}

async function seedAbout() {
  const ref = db.collection('about').doc('main');
  const doc = await ref.get();
  if (doc.exists) {
    console.log(`[skip] 'about' already has data`);
    return;
  }
  await ref.set(aboutSeed);
  console.log(`[done] 'about' seeded`);
}

async function migrate() {
  console.log('Starting migration...\n');

  await seedSkills();
  await seedCollection('projects',       projectsSeed       as Record<string, any>[]);
  await seedCollection('experiences',    experiencesSeed    as Record<string, any>[]);
  await seedCollection('educations',     educationsSeed     as Record<string, any>[]);
  await seedCollection('achievements',   achievementsSeed   as Record<string, any>[]);
  await seedCollection('certifications', certificationsSeed as Record<string, any>[]);
  await seedCollection('mediaSocials',   mediaSocialsSeed   as Record<string, any>[]);
  await seedAbout();

  console.log('\nMigration complete.');
}

migrate().catch(console.error);
