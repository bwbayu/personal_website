"use client";

import type { FieldInputProps } from "./index";

// Single-select of fixed enum options (e.g. post status). Stores the option value
// string. Options come from the field config (`field.options`).
const baseInput =
  "w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export function SelectInput({ field, value, onChange }: FieldInputProps) {
  const options = field.options ?? [];
  return (
    <select
      id={field.key}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      className={baseInput}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
