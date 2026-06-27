// Enigma I wiring data. Source of truth: the security-tools roadmap reference tables
// (rotors I-V, reflectors UKW-A/B/C). Copied verbatim, NOT re-derived. A typo in any
// key is a compile error because the tables are typed Record<RotorId|ReflectorId, ...>.

import type { ReflectorId, RotorId } from './types';

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Rotor wiring + turnover notch. `wiring` is the right-to-left substitution read at
// position 'A': the i-th letter is what input letter i maps to on the forward pass.
// `notch` is the window letter at which the rotor, when it steps, turns over the rotor
// to its left.
export interface RotorSpec {
  wiring: string;
  notch: string;
}

export const ROTORS: Record<RotorId, RotorSpec> = {
  I: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  II: { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
  IV: { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J' },
  V: { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 'Z' },
};

// Reflector wiring. Each is a derangement (no letter maps to itself) and an involution
// (a <-> b), which is what makes encode() self-reciprocal.
export const REFLECTORS: Record<ReflectorId, string> = {
  A: 'EJMZALYXVBWFCRQUONTSPIKHGD',
  B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
  C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL',
};

// Convenience lists for the S2 UI selects.
export const ROTOR_IDS: RotorId[] = ['I', 'II', 'III', 'IV', 'V'];
export const REFLECTOR_IDS: ReflectorId[] = ['A', 'B', 'C'];

// Known-answer vectors (asserted by the throwaway scratch check, also kept here so the
// data file documents its own correctness contract):
//
// 1. Primary (published): rotors I-II-III (left-to-right), reflector B, rings A-A-A,
//    start A-A-A, no plugboard, input "AAAAA" -> "BDZGO".
// 2. Self-reciprocity: encode(cfg, encode(cfg, s)) === s for any all-letter s
//    (reflectors A/B/C are derangements + involutions).
// 3. Double-stepping: rotors I-II-III, reflector B, rings A-A-A, start A-D-U, no
//    plugboard, "AAAAAAAAAA" -> "EQIBMGFJBW". From A-D-U the window advances
//    ADV, AEW, BFX, BFY (Wikipedia), so rotor II crosses its notch 'E' and double-steps
//    on the 3rd press.
// 4. Non-A ring (Ringstellung): rotors I-II-III, reflector B, rings C-E-B, start A-A-A,
//    no plugboard, "HELLOWORLD" -> "UXFQYPAGJP".
