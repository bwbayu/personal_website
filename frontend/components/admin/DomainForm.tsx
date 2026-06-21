"use client";

import { useState, type FormEvent } from "react";
import type { DomainConfig } from "@/lib/admin/config";
import { FieldInput } from "./inputs";

export interface DomainFormProps {
  config: DomainConfig;
  mode: "new" | "edit";
  initialValues: Record<string, unknown>;
  submitting: boolean;
  error: string | null;
  notice?: string | null;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

// Presentational create/edit form. Renders one input per configured field via the
// input registry, runs a light required-field check before submit, and surfaces a
// form-level error (the backend's Zod message is the source of truth).
export function DomainForm({
  config,
  mode,
  initialValues,
  submitting,
  error,
  notice,
  onSubmit,
  onCancel,
}: DomainFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [missing, setMissing] = useState<string[]>([]);

  const setField = (key: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const missingLabels = config.fields
      .filter((field) => field.required && isEmpty(values[field.key]))
      .map((field) => field.label);
    if (missingLabels.length > 0) {
      setMissing(missingLabels);
      return;
    }
    setMissing([]);
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">
        {mode === "new" ? "New" : "Edit"} {config.label}
      </h1>

      {notice && (
        <p className="mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {missing.length > 0 && (
        <p className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Please fill in the required fields: {missing.join(", ")}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {config.fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-600"> *</span>}
            </label>
            <FieldInput
              field={field}
              value={values[field.key]}
              onChange={(value) => setField(field.key, value)}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
