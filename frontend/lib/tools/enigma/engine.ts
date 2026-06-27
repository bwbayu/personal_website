// Enigma I engine. Pure, deterministic, side-effect free. No React/Next/DOM imports.
// Works internally in 0-25 letter indices; the 1..26 ring/position config inputs are
// converted on entry (minus 1).

import { ALPHABET, REFLECTORS, ROTORS } from './data';
import type { EnigmaConfig, RotorId, ReflectorId } from './types';

const A_CODE = 65; // 'A'

// Positive modulo 26 (handles negative operands from the -shift terms).
const mod26 = (n: number): number => ((n % 26) + 26) % 26;
const toIndex = (ch: string): number => ch.charCodeAt(0) - A_CODE;

interface RotorState {
  forward: number[]; // input index -> output index, at the rotor's zero rotation
  backward: number[]; // inverse permutation of `forward`
  notch: number; // window index (0-25) that turns over the rotor to the left
  ring: number; // Ringstellung as 0-25
  pos: number; // current window position as 0-25 (mutated as the rotor steps)
}

function buildRotor(id: RotorId, ring: number, pos: number): RotorState {
  const wiring = ROTORS[id].wiring;
  const forward = new Array<number>(26);
  const backward = new Array<number>(26);
  for (let i = 0; i < 26; i++) {
    const o = wiring.charCodeAt(i) - A_CODE;
    forward[i] = o;
    backward[o] = i;
  }
  return { forward, backward, notch: toIndex(ROTORS[id].notch), ring, pos };
}

// Net rotational offset of a rotor: position advances the contact, the ring retards it.
const shiftOf = (r: RotorState): number => r.pos - r.ring;

// Forward pass (entry side, signal travelling toward the reflector): +shift in, map,
// -shift out, all mod 26.
function passForward(r: RotorState, c: number): number {
  const s = shiftOf(r);
  return mod26(r.forward[mod26(c + s)] - s);
}

// Backward pass (return side, signal travelling away from the reflector): same offset
// math through the inverse wiring.
function passBackward(r: RotorState, c: number): number {
  const s = shiftOf(r);
  return mod26(r.backward[mod26(c + s)] - s);
}

const atNotch = (r: RotorState): boolean => r.pos === r.notch;

// Advance the rotors before a keypress, implementing the double-stepping anomaly:
// - the right rotor always steps;
// - if the right rotor is at its notch, the middle steps;
// - if the middle rotor is at its notch, it steps AND carries the left (so the middle
//   steps on two consecutive presses).
// Both notch tests read the positions BEFORE any stepping this press.
function step(left: RotorState, middle: RotorState, right: RotorState): void {
  const rightAtNotch = atNotch(right);
  const middleAtNotch = atNotch(middle);
  if (rightAtNotch || middleAtNotch) middle.pos = mod26(middle.pos + 1);
  if (middleAtNotch) left.pos = mod26(left.pos + 1);
  right.pos = mod26(right.pos + 1);
}

// Build the plugboard involution from 2-letter pairs. Unpaired letters map to
// themselves. Assumes valid disjoint pairs (UI validates; the engine does not).
function buildPlugboard(pairs: string[]): number[] {
  const map = Array.from({ length: 26 }, (_, i) => i);
  for (const pair of pairs) {
    const p = pair.toUpperCase();
    const a = p.charCodeAt(0) - A_CODE;
    const b = p.charCodeAt(1) - A_CODE;
    map[a] = b;
    map[b] = a;
  }
  return map;
}

// Encipher `text` under `config`. Lowercase a-z is uppercased; every non-letter
// (digits, spaces, punctuation, non-ASCII) is stripped, so the output is A-Z only.
// Self-reciprocal: encode(config, encode(config, s)) === s for any all-letter s.
export function encode(config: EnigmaConfig, text: string): string {
  const left = buildRotor(config.rotors[0], config.rings[0] - 1, config.positions[0] - 1);
  const middle = buildRotor(config.rotors[1], config.rings[1] - 1, config.positions[1] - 1);
  const right = buildRotor(config.rotors[2], config.rings[2] - 1, config.positions[2] - 1);
  const plug = buildPlugboard(config.plugboard);
  const reflector: string = REFLECTORS[config.reflector as ReflectorId];

  let out = '';
  for (const raw of text) {
    let ch: string;
    if (raw >= 'a' && raw <= 'z') ch = raw.toUpperCase();
    else if (raw >= 'A' && raw <= 'Z') ch = raw;
    else continue; // strip non-letters

    step(left, middle, right);

    let c = toIndex(ch);
    c = plug[c];
    c = passForward(right, c);
    c = passForward(middle, c);
    c = passForward(left, c);
    c = reflector.charCodeAt(c) - A_CODE;
    c = passBackward(left, c);
    c = passBackward(middle, c);
    c = passBackward(right, c);
    c = plug[c];
    out += ALPHABET[c];
  }
  return out;
}
