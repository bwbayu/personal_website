"use client";

import { useQuery } from "@tanstack/react-query";
import type { FieldInputProps } from "./index";
import { bySlug } from "@/lib/admin/config";
import { listDomain } from "@/lib/admin/api";
import { adminKeys } from "@/lib/queries";

type Category = { id: string; name: string };

const baseSelect =
  "w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

// Single-select category picker (D6b): a dropdown of categories that stores the
// category id (skill.categoryId). A current value missing from the list (e.g. a
// deleted category) stays selectable so it is not silently dropped.
export function CategorySelect({ field, value, onChange }: FieldInputProps) {
  const current = typeof value === "string" ? value : "";
  // Shares the admin categories list cache key, so opening a skill form reuses the
  // already-fetched categories (one request, deduped against the list/dashboard) and a
  // categories write invalidates this loader too.
  const { data, isPending, isError, error } = useQuery({
    queryKey: adminKeys.domain(bySlug["categories"].apiPath),
    queryFn: () => listDomain<Category>(bySlug["categories"].apiPath),
  });

  if (isPending) {
    return <p className="text-sm text-gray-400">Loading categories...</p>;
  }

  const categories: Category[] = data ?? [];
  const errorMessage = isError
    ? error instanceof Error
      ? error.message
      : "Failed to load categories"
    : null;
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
      {errorMessage && <p className="mt-1 text-xs text-amber-400">{errorMessage}</p>}
    </div>
  );
}
