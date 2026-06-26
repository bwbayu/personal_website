import { describe, it, expect } from 'vitest';
import { projectInsertSchema, projectUpdateSchema } from '../../src/projects/project.schema';

// The `isShow` visibility flag is the only projects schema deviation worth a unit test:
// it must default to visible on create yet still accept an explicit hide.
const base = {
  name: 'Sample',
  date: '2025-01-01',
  description: 'A sample project.',
  technologies: ['python'],
  role: ['Back-End Developer'],
  category: ['Web'],
};

describe('project insert schema isShow', () => {
  it('defaults isShow to true when omitted', () => {
    const parsed = projectInsertSchema.parse(base);
    expect(parsed.isShow).toBe(true);
  });

  it('keeps an explicit isShow: false', () => {
    const parsed = projectInsertSchema.parse({ ...base, isShow: false });
    expect(parsed.isShow).toBe(false);
  });

  it('rejects a non-boolean isShow', () => {
    expect(projectInsertSchema.safeParse({ ...base, isShow: 'yes' }).success).toBe(false);
  });
});

describe('project update schema isShow', () => {
  it('is optional on a partial update and does not inject a default', () => {
    const parsed = projectUpdateSchema.parse({ name: 'Renamed' });
    expect('isShow' in parsed).toBe(false);
  });

  it('accepts toggling isShow on update', () => {
    expect(projectUpdateSchema.parse({ isShow: false }).isShow).toBe(false);
  });
});
