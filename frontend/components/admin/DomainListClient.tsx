"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { bySlug, type DomainConfig } from "@/lib/admin/config";
import { listDomain, deleteItem, ApiError } from "@/lib/admin/api";
import { SingletonForm } from "./DomainFormPage";

type Row = Record<string, unknown> & { id: string };

// Renders a value for a table cell. Booleans become Yes/No, arrays become a short
// summary, everything else is stringified.
function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length === 0 ? "-" : value.join(", ");
  return String(value);
}

function NotFoundView() {
  return (
    <div className="text-sm text-gray-600">
      <h1 className="mb-2 text-xl font-semibold text-gray-900">Section not found</h1>
      <p>
        No admin section matches this URL.{" "}
        <Link href="/admin" className="text-blue-600 hover:underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}

function DomainList({ config }: { config: DomainConfig }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listDomain<Row>(config.apiPath);
      const sorted = config.reorderable
        ? [...data].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
        : data;
      setRows(sorted);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
  }, [config]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    setDeletingId(id);
    setNotice(null);
    setError(null);
    try {
      await deleteItem(config.apiPath, id);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotice("That item was already removed. The list has been refreshed.");
        await load();
      } else {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{config.label}</h1>
        <Link
          href={`/admin/${config.slug}/new`}
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          New
        </Link>
      </div>

      {notice && (
        <p className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {rows === null ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-600">No items yet. Use the New button to add one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {config.columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 font-medium text-gray-700">
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-gray-800">
                      {formatCell(row[col.key])}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/${config.slug}/edit?id=${encodeURIComponent(row.id)}`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === row.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Dispatches on the looked-up domain config: unknown slug -> not found; singleton ->
// single-record view; otherwise the generic list.
export function DomainListClient({ slug }: { slug: string }) {
  const config = bySlug[slug];
  if (!config) return <NotFoundView />;
  if (config.singleton) return <SingletonForm config={config} />;
  return <DomainList config={config} />;
}
