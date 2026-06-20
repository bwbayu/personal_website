import { describe, it, expect } from 'vitest';
import { aboutInsertSchema, aboutUpdateSchema } from '../../src/about/about.schema';

// Unit test (no emulator): pins the new About shape after the headline removal.
// Zod strips unknowns by default, so we assert the parsed result carries no
// `headline` key rather than asserting strict rejection.
describe('about insert schema', () => {
  it('parses a valid { name, email } body', () => {
    const parsed = aboutInsertSchema.parse({ name: 'Bayu', email: 'bwbayuuu@gmail.com' });
    expect(parsed).toEqual({ name: 'Bayu', email: 'bwbayuuu@gmail.com' });
  });

  it('drops headline from the parsed result (field is gone from the schema)', () => {
    const parsed = aboutInsertSchema.parse({
      name: 'Bayu',
      email: 'bwbayuuu@gmail.com',
      headline: 'should be stripped',
    });
    expect(parsed).not.toHaveProperty('headline');
  });

  it('rejects a missing email', () => {
    const res = aboutInsertSchema.safeParse({ name: 'Bayu' });
    expect(res.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const res = aboutInsertSchema.safeParse({ name: 'Bayu', email: 'not-an-email' });
    expect(res.success).toBe(false);
  });

  it('update schema is partial and never carries headline', () => {
    const parsed = aboutUpdateSchema.parse({ headline: 'x' });
    expect(parsed).not.toHaveProperty('headline');
  });
});
