import { describe, it, expect } from 'vitest';
import { toSlug } from '../../src/utils/slug.util';

// Pure-function unit test — no mocks, no Firestore. Proves the unit harness
// (esbuild/CJS transpile + discovery + setup) runs end-to-end.
describe('toSlug', () => {
  it('lowercases the input', () => {
    expect(toSlug('FullStack')).toBe('fullstack');
  });

  it('replaces runs of non-alphanumeric characters with a single dash', () => {
    expect(toSlug('Node.js & Express')).toBe('node-js-express');
  });

  it('trims a trailing dash produced by trailing punctuation', () => {
    expect(toSlug('C++')).toBe('c');
    expect(toSlug('React!')).toBe('react');
  });

  it('keeps alphanumeric words joined by dashes', () => {
    expect(toSlug('Google Cloud Platform')).toBe('google-cloud-platform');
  });
});
