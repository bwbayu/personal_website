import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'crypto';
import { db } from '../../src/config/firestore';
import { createProjectRepository } from '../../src/projects/project.repository';
import { skillsSeed } from '../../src/database/seeds/skills.seed';
import { projectsSeed } from '../../src/database/seeds/projects.seed';
import type { Project } from '../../src/projects/project.type';
import { clearFirestore } from '../helpers/emulator';

// Emulator-backed referential test (D7/D10): a seeded project's technologies are
// slug ids that resolve to existing skill docs, and findAll keeps date-desc order.
describe('project repository (emulator)', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  it('technologies resolve to seeded skill docs and findAll orders by date desc', async () => {
    // Seed skills with their slug doc ids so technology ids have a target to resolve to.
    const skillBatch = db.batch();
    skillsSeed.forEach(skill => skillBatch.set(db.collection('skills').doc(skill.id), skill));
    await skillBatch.commit();

    // Two projects with explicit UUID ids and distinct dates (newest first expected).
    const newer: Project = { ...projectsSeed[0], id: randomUUID() }; // 2025-09-01
    const older: Project = { ...projectsSeed[6], id: randomUUID() }; // 2024-10-01
    const repo = createProjectRepository();
    await repo.save(older);
    await repo.save(newer);

    // (a) referential: every technology id resolves to an existing skill doc.
    expect(newer.technologies.length).toBeGreaterThan(0);
    for (const techId of newer.technologies) {
      const doc = await db.collection('skills').doc(techId).get();
      expect(doc.exists).toBe(true);
    }

    // (b) findAll orders by `date` descending (default direction).
    const all = await repo.findAll();
    expect(all.map(p => p.date)).toEqual(['2025-09-01', '2024-10-01']);
  });
});
