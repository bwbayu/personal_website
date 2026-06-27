"use client";

import { useState } from "react";

import {
  encode,
  parsePlugboard,
  REFLECTOR_IDS,
  ROTOR_IDS,
  type EnigmaConfig,
  type ReflectorId,
  type RotorId,
} from "@/lib/tools/enigma";

// A-Z letters for the start-position selects and the rotor-window readout. The UI works
// in 0-based letter indices; the engine takes 1..26 (1 = 'A'), so positions are +1'd in
// the single buildConfig conversion below. Ring values are shown as 01..26 (Ringstellung
// convention) and pass straight through, since the engine already takes 1..26 for rings.
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const RING_VALUES = Array.from({ length: 26 }, (_, i) => i + 1);

// Slot order matches EnigmaConfig: index 0 = leftmost/slowest .. 2 = rightmost/fastest.
const SLOT_LABELS = ["Left", "Middle", "Right"] as const;

type Triple<T> = [T, T, T];

const fieldClass =
  "w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "mb-1 block text-sm font-medium text-gray-300";

// Enigma I "encryption box": configure the machine and watch the ciphertext update live.
// Output is recomputed through the pure engine on every render (no submit, no effects).
export function EnigmaClient() {
  const [input, setInput] = useState("");
  const [rotors, setRotors] = useState<Triple<RotorId>>(["I", "II", "III"]);
  const [reflector, setReflector] = useState<ReflectorId>("B");
  const [rings, setRings] = useState<Triple<number>>([1, 1, 1]); // 1..26
  const [positions, setPositions] = useState<Triple<number>>([0, 0, 0]); // 0..25 letter index
  const [plugRaw, setPlugRaw] = useState(""); // plugboard as free text, e.g. "AB CD EF"

  // Parse the raw plugboard text live into pairs. All-or-nothing: any problem yields an
  // empty plugboard (so the output stays valid) plus one inline hint; the pairs apply
  // only once the whole string parses cleanly.
  const { pairs: plugboard, error: plugError } = parsePlugboard(plugRaw);

  // Single UI -> engine conversion point: start positions are 0-based letter indices,
  // +1'd to the engine's 1..26; rings are already 1..26; plugboard is the parsed pair
  // list from above (empty whenever the raw text is invalid).
  const config: EnigmaConfig = {
    rotors,
    reflector,
    rings,
    positions: [positions[0] + 1, positions[1] + 1, positions[2] + 1],
    plugboard,
  };
  const output = encode(config, input);

  const setRotorAt = (slot: number, id: RotorId) =>
    setRotors((prev) => {
      const next = [...prev] as Triple<RotorId>;
      next[slot] = id;
      return next;
    });
  const setRingAt = (slot: number, value: number) =>
    setRings((prev) => {
      const next = [...prev] as Triple<number>;
      next[slot] = value;
      return next;
    });
  const setPositionAt = (slot: number, value: number) =>
    setPositions((prev) => {
      const next = [...prev] as Triple<number>;
      next[slot] = value;
      return next;
    });

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-semibold text-white">Enigma</h1>
      <p className="mb-6 text-sm text-gray-400">
        Encipher text with a simulated Enigma I machine. Letters only; spaces, digits and
        punctuation are ignored, so the output can be shorter than the input. The machine
        is self-reciprocal: re-enter the output under the same setup to recover the
        original text.
      </p>

      <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 p-6">
        <div className="mb-5 max-w-[8rem]">
          <label htmlFor="enigma-reflector" className={labelClass}>
            Reflector
          </label>
          <select
            id="enigma-reflector"
            value={reflector}
            onChange={(e) => setReflector(e.target.value as ReflectorId)}
            className={fieldClass}
          >
            {REFLECTOR_IDS.map((id) => (
              <option key={id} value={id}>
                UKW-{id}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {SLOT_LABELS.map((slotLabel, slot) => {
            return (
              <div
                key={slotLabel}
                className="rounded border border-gray-700 bg-gray-900/40 p-3"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {slotLabel} rotor
                </p>

                <label htmlFor={`enigma-rotor-${slot}`} className={labelClass}>
                  Wheel
                </label>
                <select
                  id={`enigma-rotor-${slot}`}
                  value={rotors[slot]}
                  onChange={(e) => setRotorAt(slot, e.target.value as RotorId)}
                  className={`${fieldClass} mb-3`}
                >
                  {ROTOR_IDS.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>

                <label htmlFor={`enigma-ring-${slot}`} className={labelClass}>
                  Ring
                </label>
                <select
                  id={`enigma-ring-${slot}`}
                  value={rings[slot]}
                  onChange={(e) => setRingAt(slot, Number(e.target.value))}
                  className={`${fieldClass} mb-3`}
                >
                  {RING_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {String(v).padStart(2, "0")}
                    </option>
                  ))}
                </select>

                <label htmlFor={`enigma-pos-${slot}`} className={labelClass}>
                  Start position
                </label>
                <select
                  id={`enigma-pos-${slot}`}
                  value={positions[slot]}
                  onChange={(e) => setPositionAt(slot, Number(e.target.value))}
                  className={fieldClass}
                >
                  {LETTERS.map((letter, i) => (
                    <option key={letter} value={i}>
                      {letter}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Rotor windows (DISCUSSION E2): a read-only echo of the configured start letters.
            The engine is untouched; this does not show live per-character stepping. */}
        <div className="mt-5">
          <p className={labelClass}>Rotor windows</p>
          <div className="flex gap-2">
            {positions.map((p, slot) => (
              <span
                key={SLOT_LABELS[slot]}
                className="inline-flex h-9 w-9 items-center justify-center rounded border border-gray-700 bg-gray-900 font-mono text-base text-gray-100"
              >
                {LETTERS[p]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 p-6">
        <label htmlFor="enigma-plugboard" className={labelClass}>
          Plugboard
        </label>
        <p className="mb-2 text-xs text-gray-500">
          Up to 10 pairs; each letter at most once. Two letters per pair; spaces are
          optional (e.g. AB CD EF).
        </p>
        <input
          id="enigma-plugboard"
          type="text"
          value={plugRaw}
          onChange={(e) => setPlugRaw(e.target.value)}
          placeholder="e.g. AB CD EF"
          className={fieldClass}
        />
        {plugError && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {plugError}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <label htmlFor="enigma-input" className={labelClass}>
            Input
          </label>
          <textarea
            id="enigma-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className={fieldClass}
          />
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <label htmlFor="enigma-output" className={labelClass}>
            Output
          </label>
          <textarea
            id="enigma-output"
            value={output}
            readOnly
            rows={6}
            className={`${fieldClass} tracking-wider`}
          />
        </div>
      </div>
    </div>
  );
}
