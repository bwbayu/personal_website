"use client";

import { useEffect, useState } from "react";
import type { FieldInputProps } from "./index";
import { bySlug } from "@/lib/admin/config";
import { listDomain } from "@/lib/admin/api";

type Category = { id: string; name: string };

const baseSelect = "w-full rounded border border-gray-300 px-3 py-2 text-sm";

// Single-select category picker (D6b): a dropdown of categories that stores the
// category id (skill.categoryId). A current value missing from the list (e.g. a
// deleted category) stays selectable so it is not silently dropped.
export function CategorySelect({ field, value, onChange }: FieldInputProps) {
  const current = typeof value === "string" ? value : "";
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listDomain<Category>(bySlug["categories"].apiPath)
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setCategories([]);
        setError(err instanceof Error ? err.message : "Failed to load categories");
      });
    return () => {
      active = false;
    };
  }, []);

  if (categories === null) {
    return <p className="text-sm text-gray-500">Loading categories...</p>;
  }

  const knownCurrent = current === "" || categories.some((category) => category.id === current);

  return (
    <div>
      <select
        id={field.key}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className={baseSelect}
      >
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
        {!knownCurrent && <option value={current}>{current} (unknown)</option>}
      </select>
      {error && <p className="mt-1 text-xs text-amber-600">{error}</p>}
    </div>
  );
}
