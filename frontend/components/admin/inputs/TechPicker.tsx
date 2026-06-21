"use client";

import { useQuery } from "@tanstack/react-query";
import type { FieldInputProps } from "./index";
import { bySlug } from "@/lib/admin/config";
import { listDomain } from "@/lib/admin/api";
import { adminKeys } from "@/lib/queries";

type Skill = { id: string; name: string };

const baseSelect =
  "w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

// Project tech-picker (D6a): multi-select of skill ids shown by skill name. Stores the
// skill ids. An id that no longer matches a skill (dangling reference) still renders as
// a chip and can be removed.
export function TechPicker({ value, onChange }: FieldInputProps) {
  const selected = Array.isArray(value) ? value.map((entry) => String(entry)) : [];
  // Shares the admin skills list cache key, so opening a project form reuses the
  // already-fetched skills (one request, deduped against the list/dashboard) and a
  // skills write invalidates this loader too.
  const { data, isPending, isError, error } = useQuery({
    queryKey: adminKeys.domain(bySlug["skills"].apiPath),
    queryFn: () => listDomain<Skill>(bySlug["skills"].apiPath),
  });
  const skills: Skill[] = data ?? [];
  const errorMessage = isError
    ? error instanceof Error
      ? error.message
      : "Failed to load skills"
    : null;

  const nameFor = (id: string) =>
    skills.find((skill) => skill.id === id)?.name ?? `${id} (unknown)`;
  const add = (id: string) => {
    if (id && !selected.includes(id)) onChange([...selected, id]);
  };
  const remove = (id: string) => onChange(selected.filter((entry) => entry !== id));

  const available = skills.filter((skill) => !selected.includes(skill.id));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {selected.length === 0 && (
          <span className="text-xs text-gray-400">No technologies selected.</span>
        )}
        {selected.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-xs text-gray-200"
          >
            {nameFor(id)}
            <button
              type="button"
              aria-label={`Remove ${nameFor(id)}`}
              onClick={() => remove(id)}
              className="text-red-400 hover:text-red-300"
            >
              x
            </button>
          </span>
        ))}
      </div>
      {isPending ? (
        <p className="text-sm text-gray-400">Loading skills...</p>
      ) : (
        <select
          value=""
          onChange={(e) => add(e.target.value)}
          className={baseSelect}
          aria-label="Add a technology"
        >
          <option value="">Add a technology...</option>
          {available.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name}
            </option>
          ))}
        </select>
      )}
      {errorMessage && <p className="mt-1 text-xs text-amber-400">{errorMessage}</p>}
    </div>
  );
}
