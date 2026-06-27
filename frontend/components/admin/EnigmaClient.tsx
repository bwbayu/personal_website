"use client";

import { useState } from "react";

import { encode, type EnigmaConfig } from "@/lib/tools/enigma";

// Default machine setup (E7): rotors I-II-III, reflector B, rings A-A-A, start A-A-A,
// no plugboard. Under this config "AAAAA" -> "BDZGO", the engine's primary known-answer
// vector, so the page doubles as a built-in sanity check on first load.
const DEFAULT_CONFIG: EnigmaConfig = {
  rotors: ["I", "II", "III"],
  reflector: "B",
  rings: [1, 1, 1],
  positions: [1, 1, 1],
  plugboard: [],
};

// Enigma I "encryption box": text in, ciphertext out, recomputed live through the pure
// engine on every render (no submit, no effects). Interactive machine controls are added
// in later tickets; for now the config is hardcoded to the default setup.
export function EnigmaClient() {
  const [input, setInput] = useState("");
  const output = encode(DEFAULT_CONFIG, input);

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-semibold text-white">Enigma</h1>
      <p className="mb-6 text-sm text-gray-400">
        Encipher text with a simulated Enigma I machine. Letters only; spaces, digits and
        punctuation are ignored, so the output can be shorter than the input. The machine
        is self-reciprocal: re-enter the output under the same setup to recover the
        original text.
      </p>

      {/* Machine setup panel - interactive rotor/ring/position/plugboard controls are
          added in later tickets; the config is hardcoded to the default for now. */}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <label
            htmlFor="enigma-input"
            className="mb-1 block text-sm font-medium text-gray-300"
          >
            Input
          </label>
          <textarea
            id="enigma-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <label
            htmlFor="enigma-output"
            className="mb-1 block text-sm font-medium text-gray-300"
          >
            Output
          </label>
          <textarea
            id="enigma-output"
            value={output}
            readOnly
            rows={6}
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm tracking-wider text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
