// Enigma I configuration types. Pure data shapes shared by the engine and (later)
// the S2 UI. No logic lives here.

// Rotors available on the Enigma I (Wehrmacht / Heer). Left-to-right wheel order is
// chosen by EnigmaConfig.rotors below.
export type RotorId = 'I' | 'II' | 'III' | 'IV' | 'V';

// Reflectors (Umkehrwalze). UKW-A/B/C.
export type ReflectorId = 'A' | 'B' | 'C';

// A full machine setup.
//
// rotors    - the three installed wheels, ordered left-to-right: index 0 is the
//             leftmost/slowest, index 2 is the rightmost/fastest (adjacent to the
//             entry wheel). Matches the I-II-III known-answer vector.
// rings     - Ringstellung per rotor, 1..26 (1 = 'A' .. 26 = 'Z'), same order as rotors.
// positions - start window position per rotor, 1..26 (1 = 'A' .. 26 = 'Z'), same order.
// reflector - which UKW is fitted.
// plugboard - Steckerbrett pairs as 2-letter strings, e.g. ["AB","CD"]. Assumed valid
//             and disjoint; the engine treats unpaired letters as self-mapped. Pair
//             validation is the UI's responsibility, not the engine's.
export interface EnigmaConfig {
  rotors: [RotorId, RotorId, RotorId];
  rings: [number, number, number];
  positions: [number, number, number];
  reflector: ReflectorId;
  plugboard: string[];
}
