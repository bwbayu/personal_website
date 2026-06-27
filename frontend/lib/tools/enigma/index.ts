// Public surface of the Enigma I engine, consumed by the S2 UI. Kept deliberately
// minimal: the encode function, the config/id types, and the id lists the selects need.

export { encode } from './engine';
export type { EnigmaConfig, RotorId, ReflectorId } from './types';
export { ROTOR_IDS, REFLECTOR_IDS } from './data';
