"use client";

import { useState } from "react";

import {
  encode,
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
  const [pairs, setPairs] = useState<Array<[string, string]>>([]); // plugboard rows; "" = unset

  // Only fully-set rows reach the engine (DISCUSSION E3/E4): a half-entered pair is skipped
  // so the output stays a valid A-Z string while the user finishes choosing the partner.
  const plugboard = pairs.filter(([a, b]) => a !== "" && b !== "").map(([a, b]) => a + b);

  // Single UI -> engine conversion point (DISCUSSION E5): start positions are 0-based
  // letter indices, +1'd to the engine's 1..26; rings are already 1..26; plugboard carries
  // only the complete pairs assembled above.
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

  const addPair = () => setPairs((prev) => [...prev, ["", ""]]);
  const removePair = (row: number) =>
    setPairs((prev) => prev.filter((_, i) => i !== row));
  const setPairCell = (row: number, pos: number, letter: string) =>
    setPairs((prev) =>
      prev.map((pair, i) => {
        if (i !== row) return pair;
        const next = [...pair] as [string, string];
        next[pos] = letter;
        return next;
      }),
    );

  // Letters selectable in one plugboard cell: every letter except those already used in
  // another cell (DISCUSSION E3). The cell's own current value is kept (it is excluded from
  // the "used" set), and its row partner is excluded, so reuse and self-pairing are
  // unrepresentable. A free letter is one not used by any pair.
  const lettersFor = (row: number, pos: number): string[] => {
    const used = new Set<string>();
    pairs.forEach((pair, r) =>
      pair.forEach((letter, c) => {
        if (letter && !(r === row && c === pos)) used.add(letter);
      }),
    );
    return LETTERS.filter((l) => !used.has(l));
  };
  const freeLetters = 26 - pairs.reduce((n, [a, b]) => n + (a ? 1 : 0) + (b ? 1 : 0), 0);
  const canAddPair = pairs.length < 10 && freeLetters >= 2;

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
            // Rotor exclusion (DISCUSSION E4): a slot may pick its own current rotor or any
            // rotor not held by the other two slots, so duplicates are unrepresentable.
            const usedByOthers = rotors.filter((_, i) => i !== slot);
            const rotorOptions = ROTOR_IDS.filter((id) => !usedByOthers.includes(id));
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
                  {rotorOptions.map((id) => (
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-300">Plugboard</p>
            <p className="text-xs text-gray-500">
              Up to 10 pairs. A letter can be used in at most one pair.
            </p>
          </div>
          <button
            type="button"
            onClick={addPair}
            disabled={!canAddPair}
            className="shrink-0 rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-100 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add pair
          </button>
        </div>

        {pairs.length === 0 ? (
          <p className="text-sm text-gray-500">No pairs - letters map to themselves.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pairs.map((pair, row) => (
              <div key={row} className="flex items-center gap-2">
                {[0, 1].map((pos) => (
                  <select
                    key={pos}
                    aria-label={`Plugboard pair ${row + 1} letter ${pos + 1}`}
                    value={pair[pos]}
                    onChange={(e) => setPairCell(row, pos, e.target.value)}
                    className={`${fieldClass} w-20`}
                  >
                    <option value="">--</option>
                    {lettersFor(row, pos).map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                ))}
                <button
                  type="button"
                  onClick={() => removePair(row)}
                  aria-label={`Remove plugboard pair ${row + 1}`}
                  className="rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
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
