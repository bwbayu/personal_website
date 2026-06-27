// Pure plugboard (Steckerbrett) parser for the Enigma UI. Turns a single free-text
// field into validated 2-letter pairs. Pure, deterministic, no React/DOM imports
// (mirrors engine.ts discipline).
//
// Tokenizing: whitespace is the ONLY ignorable character (a separator); every other
// character must be a letter. The remaining letters are uppercased and sliced into
// 2-char chunks, so "AB CD", "ABCD" and "ab  cd" all yield ["AB", "CD"].
//
// Validation is all-or-nothing: on ANY problem the caller gets an empty pair list plus
// one short hint, so the engine receives a clean (empty) plugboard until the whole
// string parses cleanly. When fully valid, every pair applies.

export interface PlugboardParseResult {
  pairs: string[];
  error: string | null;
}

export function parsePlugboard(raw: string): PlugboardParseResult {
  // Empty / whitespace-only: a plugboard with no pairs is valid and silent.
  if (raw.trim() === "") return { pairs: [], error: null };

  // Whitespace is the only non-letter we tolerate; anything else (digit, punctuation,
  // non-ASCII) is a hard error rather than being silently stripped.
  if (/[^a-zA-Z\s]/.test(raw)) return { pairs: [], error: "letters and spaces only" };

  const letters = raw.replace(/\s+/g, "").toUpperCase();

  // A lone trailing letter cannot form a pair (odd letter count, e.g. mid-typing).
  if (letters.length % 2 !== 0) return { pairs: [], error: "incomplete pair" };

  const pairs: string[] = [];
  const used = new Set<string>();
  for (let i = 0; i < letters.length; i += 2) {
    const a = letters[i];
    const b = letters[i + 1];
    if (a === b) return { pairs: [], error: "a letter cannot pair with itself" };
    if (used.has(a) || used.has(b)) return { pairs: [], error: "letter used twice" };
    used.add(a);
    used.add(b);
    pairs.push(a + b);
  }

  if (pairs.length > 10) return { pairs: [], error: "at most 10 pairs" };

  return { pairs, error: null };
}
