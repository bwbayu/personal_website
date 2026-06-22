import { describe, it, expect } from 'vitest';
import { dailyLogInsertSchema, dailyLogUpdateSchema } from '../../src/dailyLogs/dailyLog.schema';

// Unit test (no emulator): pins the DailyLog write contract. Zod strips unknown keys
// by default, so the server-set `id` can never be injected through the body (AC3).
const validBody = {
  date: '2026-06-22',
  content: 'Shipped the daily log feature.',
  tags: ['ship'],
};

describe('daily log insert schema', () => {
  it('parses a valid body and defaults tags to [] when omitted', () => {
    const { tags, ...noTags } = validBody;
    const parsed = dailyLogInsertSchema.parse(noTags);
    expect(parsed.tags).toEqual([]);
  });

  it('strips a client-supplied id from the body', () => {
    const parsed = dailyLogInsertSchema.parse({ ...validBody, id: 'client-supplied' });
    expect(parsed).not.toHaveProperty('id');
  });

  it('rejects a bad date and accepts a valid calendar date', () => {
    expect(dailyLogInsertSchema.safeParse({ ...validBody, date: '2026-13-40' }).success).toBe(false);
    expect(dailyLogInsertSchema.safeParse({ ...validBody, date: 'not-a-date' }).success).toBe(false);
    expect(dailyLogInsertSchema.safeParse({ ...validBody, date: '2026-06-22' }).success).toBe(true);
  });

  it('rejects empty content and content over 5000 chars', () => {
    expect(dailyLogInsertSchema.safeParse({ ...validBody, content: '' }).success).toBe(false);
    expect(dailyLogInsertSchema.safeParse({ ...validBody, content: 'x'.repeat(5001) }).success).toBe(false);
    expect(dailyLogInsertSchema.safeParse({ ...validBody, content: 'x'.repeat(5000) }).success).toBe(true);
  });
});

describe('daily log update schema', () => {
  it('is partial (an empty patch parses)', () => {
    expect(dailyLogUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('does not introduce a tags key when tags are omitted (no-wipe, AC4)', () => {
    const parsed = dailyLogUpdateSchema.parse({ content: 'edited' });
    expect(parsed).not.toHaveProperty('tags');
  });

  it('still strips a client-supplied id on update', () => {
    const parsed = dailyLogUpdateSchema.parse({ content: 'New', id: 'x' });
    expect(parsed).toEqual({ content: 'New' });
  });
});
