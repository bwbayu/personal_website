import { describe, it, expect } from 'vitest';
import { projectsSeed } from '../../src/database/seeds/projects.seed';
import { skillsSeed } from '../../src/database/seeds/skills.seed';

// Cheap build-data drift guard (no emulator): every technology id referenced by a
// project must be a slug that exists in the skills seed (referential sanity).
describe('project seed referential integrity', () => {
  const skillIds = new Set(skillsSeed.map(s => s.id));

  it('every project technology id resolves to a seeded skill', () => {
    const dangling: string[] = [];
    for (const project of projectsSeed) {
      for (const techId of project.technologies) {
        if (!skillIds.has(techId)) {
          dangling.push(`${project.name} -> ${techId}`);
        }
      }
    }
    expect(dangling).toEqual([]);
  });

  it('stores technologies as non-empty slug-id string arrays', () => {
    for (const project of projectsSeed) {
      expect(Array.isArray(project.technologies)).toBe(true);
      for (const techId of project.technologies) {
        expect(typeof techId).toBe('string');
        expect(techId).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    }
  });
});
