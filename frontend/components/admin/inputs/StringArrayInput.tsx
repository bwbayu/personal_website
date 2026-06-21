"use client";

import type { FieldInputProps } from "./index";

// Array-of-strings editor (D6d): add / edit / remove rows. Used by list-valued fields
// such as role, category, descriptions, and the url-array fields. Empty rows are left
// for the backend to validate (it is the source of truth).
const rowInput =
  "flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export function StringArrayInput({ field, value, onChange }: FieldInputProps) {
  const items = Array.isArray(value) ? value.map((entry) => String(entry)) : [];

  const commit = (next: string[]) => onChange(next);
  const setAt = (index: number, next: string) =>
    commit(items.map((item, i) => (i === index ? next : item)));
  const removeAt = (index: number) => commit(items.filter((_, i) => i !== index));
  const add = () => commit([...items, ""]);

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && <p className="text-xs text-gray-400">No entries.</p>}
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            aria-label={`${field.label} ${index + 1}`}
            value={item}
            onChange={(e) => setAt(index, e.target.value)}
            className={rowInput}
          />
          <button
            type="button"
            onClick={() => removeAt(index)}
            className="rounded border border-gray-700 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start rounded border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
      >
        Add
      </button>
    </div>
  );
}
