"use client";

import { useState } from "react";

// Sum the character codes (UTF-16 code units) of the input string. Iterating by code
// unit with charCodeAt is intentional: spaces, newlines and non-ASCII characters all
// count, and an empty string runs the loop zero times -> 0 (no NaN, no guard needed).
function asciiSum(text: string): number {
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += text.charCodeAt(i);
  }
  return total;
}

// Minimal "encryption box": one text input and a live total of its character codes.
// Computed synchronously on every render from state - no submit button, no per-character
// table, no hex/binary view (kept deliberately small).
export function AsciiSumClient() {
  const [text, setText] = useState("");
  const total = asciiSum(text);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-white">ASCII sum</h1>
      <p className="mb-6 text-sm text-gray-400">
        Add up the character codes of any text. The total is the sum of each
        character&apos;s code (UTF-16 code unit), so spaces, newlines and non-ASCII
        characters all count.
      </p>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <label
          htmlFor="ascii-sum-input"
          className="mb-1 block text-sm font-medium text-gray-300"
        >
          Text
        </label>
        <textarea
          id="ascii-sum-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-sm text-gray-400">Total</span>
          <span className="text-3xl font-semibold text-white">{total}</span>
        </div>
      </div>
    </div>
  );
}
