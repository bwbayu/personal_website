"use client";

import { type ComponentType } from "react";
import type { FieldConfig, FieldType } from "@/lib/admin/config";
import { isSafeUrl } from "@/lib/url";
import { StringArrayInput } from "./StringArrayInput";
import { CategorySelect } from "./CategorySelect";
import { TechPicker } from "./TechPicker";
import { MarkdownInput } from "./MarkdownInput";
import { SelectInput } from "./SelectInput";

// One input component per simple field type. Complex types (string-array,
// category-ref, tech-picker) are added to the registry in a later step; until then
// they fall back to a read-only placeholder that preserves the current value.
export interface FieldInputProps {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}

const baseInput =
  "w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function TextInput({ field, value, onChange }: FieldInputProps) {
  return (
    <input
      type="text"
      id={field.key}
      value={asString(value)}
      onChange={(e) => onChange(e.target.value)}
      className={baseInput}
    />
  );
}

function TextareaInput({ field, value, onChange }: FieldInputProps) {
  return (
    <textarea
      id={field.key}
      value={asString(value)}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className={baseInput}
    />
  );
}

function NumberInput({ field, value, onChange }: FieldInputProps) {
  return (
    <input
      type="number"
      id={field.key}
      value={typeof value === "number" ? value : 0}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      className={baseInput}
    />
  );
}

function BooleanInput({ field, value, onChange }: FieldInputProps) {
  const isOn = value === true;
  return (
    <div className="flex gap-6">
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input
          type="radio"
          id={field.key}
          name={field.key}
          checked={isOn}
          onChange={() => onChange(true)}
          className="size-4 accent-blue-600"
        />
        Yes
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input
          type="radio"
          name={field.key}
          checked={!isOn}
          onChange={() => onChange(false)}
          className="size-4 accent-blue-600"
        />
        No
      </label>
    </div>
  );
}

function DateInput({ field, value, onChange }: FieldInputProps) {
  return (
    <input
      type="date"
      id={field.key}
      value={asString(value)}
      onChange={(e) => onChange(e.target.value)}
      className={baseInput}
    />
  );
}

function UrlInput({ field, value, onChange }: FieldInputProps) {
  const text = asString(value);
  const warn = text.trim() !== "" && !isSafeUrl(text);
  return (
    <div>
      <input
        type="text"
        id={field.key}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className={baseInput}
      />
      {warn && (
        <p className="mt-1 text-xs text-amber-400">
          This does not look like an http(s) URL; the server will reject an invalid value.
        </p>
      )}
    </div>
  );
}

// Fallback for field types whose dedicated widget is not wired yet. Read-only so the
// existing value is preserved on save instead of being dropped.
function PlaceholderInput({ value }: FieldInputProps) {
  const summary = Array.isArray(value)
    ? value.length === 0
      ? "(empty)"
      : value.join(", ")
    : asString(value) || "(empty)";
  return (
    <div className="rounded border border-dashed border-gray-700 px-3 py-2 text-sm text-gray-400">
      <span className="break-words">{summary}</span>
      <span className="ml-2 italic">- dedicated editor coming soon</span>
    </div>
  );
}

export const fieldInputRegistry: Partial<Record<FieldType, ComponentType<FieldInputProps>>> = {
  text: TextInput,
  textarea: TextareaInput,
  number: NumberInput,
  boolean: BooleanInput,
  date: DateInput,
  url: UrlInput,
  "string-array": StringArrayInput,
  "category-ref": CategorySelect,
  "tech-picker": TechPicker,
  markdown: MarkdownInput,
  select: SelectInput,
};

export function FieldInput(props: FieldInputProps) {
  const Component = fieldInputRegistry[props.field.type] ?? PlaceholderInput;
  return <Component {...props} />;
}
