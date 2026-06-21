"use client";

import { useEffect, useState } from "react";
import type { FieldInputProps } from "./index";
import { bySlug } from "@/lib/admin/config";
import { listDomain } from "@/lib/admin/api";

type Skill = { id: string; name: string };

const baseSelect = "w-full rounded border border-gray-300 px-3 py-2 text-sm";

// Project tech-picker (D6a): multi-select of skill ids shown by skill name. Stores the
// skill ids. An id that no longer matches a skill (dangling reference) still renders as
// a chip and can be removed.
export function TechPicker({ value, onChange }: FieldInputProps) {
  const selected = Array.isArray(value) ? value.map((entry) => String(entry)) : [];
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listDomain<Skill>(bySlug["skills"].apiPath)
      .then((data) => {
        if (active) setSkills(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setSkills([]);
        setError(err instanceof Error ? err.message : "Failed to load skills");
      });
    return () => {
      active = false;
    };
  }, []);

  const nameFor = (id: string) =>
    skills?.find((skill) => skill.id === id)?.name ?? `${id} (unknown)`;
  const add = (id: string) => {
    if (id && !selected.includes(id)) onChange([...selected, id]);
  };
  const remove = (id: string) => onChange(selected.filter((entry) => entry !== id));

  const available = (skills ?? []).filter((skill) => !selected.includes(skill.id));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {selected.length === 0 && (
          <span className="text-xs text-gray-500">No technologies selected.</span>
        )}
        {selected.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs"
          >
            {nameFor(id)}
            <button
              type="button"
              aria-label={`Remove ${nameFor(id)}`}
              onClick={() => remove(id)}
              className="text-red-600 hover:text-red-700"
            >
              x
            </button>
          </span>
        ))}
      </div>
      {skills === null ? (
        <p className="text-sm text-gray-500">Loading skills...</p>
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
      {error && <p className="mt-1 text-xs text-amber-600">{error}</p>}
    </div>
  );
}
