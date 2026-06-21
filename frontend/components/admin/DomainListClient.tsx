"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Modal, type CustomFlowbiteTheme } from "flowbite-react";
import { bySlug, type DomainConfig } from "@/lib/admin/config";
import { listDomain, deleteItem, reorderItems, ApiError } from "@/lib/admin/api";
import { adminKeys } from "@/lib/queries";
import { SingletonForm } from "./DomainFormPage";
import { useAdminToast } from "./ToastProvider";

type Row = Record<string, unknown> & { id: string };

// Force the Flowbite modal onto the layered-dark palette in both OS color schemes
// (the admin is dark-always; Flowbite defaults to a light panel with a dark: variant).
const confirmModalTheme: CustomFlowbiteTheme["modal"] = {
  content: {
    inner:
      "relative flex max-h-[90dvh] flex-col rounded-lg border border-gray-700 bg-gray-800 shadow",
  },
  header: {
    base: "flex items-start justify-between rounded-t border-b border-gray-700 p-5",
    title: "text-xl font-medium text-white",
    close: {
      base: "ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-700 hover:text-white",
      icon: "h-5 w-5",
    },
  },
  footer: {
    base: "flex items-center space-x-2 rounded-b border-gray-700 p-6",
  },
};

// Reorder grouping: skills are ordered within their category; other reorderable
// domains (categories) share one global group.
function reorderGroupKey(config: DomainConfig, row: Row): string {
  return config.slug === "skills" ? String(row.categoryId ?? "") : "";
}

// Display order for reorderable domains: group rows, then sort each group by `order`
// so same-group rows are adjacent and up/down moves are intuitive.
function sortForReorder(config: DomainConfig, rows: Row[]): Row[] {
  return [...rows].sort((a, b) => {
    const keyA = reorderGroupKey(config, a);
    const keyB = reorderGroupKey(config, b);
    if (keyA !== keyB) return keyA < keyB ? -1 : 1;
    return Number(a.order ?? 0) - Number(b.order ?? 0);
  });
}

// Neighbour id (within the same group, sorted by `order`) for each row, so up/down can
// swap order with the correct adjacent item and be disabled at the group ends.
function buildReorderNeighbors(
  config: DomainConfig,
  rows: Row[],
): Map<string, { prevId?: string; nextId?: string }> {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = reorderGroupKey(config, row);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  const neighbors = new Map<string, { prevId?: string; nextId?: string }>();
  for (const group of Array.from(groups.values())) {
    const sorted = [...group].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
    sorted.forEach((row, index) => {
      neighbors.set(row.id, {
        prevId: index > 0 ? sorted[index - 1].id : undefined,
        nextId: index < sorted.length - 1 ? sorted[index + 1].id : undefined,
      });
    });
  }
  return neighbors;
}

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
    <div className="text-sm text-gray-400">
      <h1 className="mb-2 text-xl font-semibold text-white">Section not found</h1>
      <p>
        No admin section matches this URL.{" "}
        <Link href="/admin" className="text-blue-500 hover:text-blue-400">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}

function DomainList({ config }: { config: DomainConfig }) {
  const { show } = useAdminToast();
  const queryClient = useQueryClient();
  const queryKey = adminKeys.domain(config.apiPath);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const {
    data,
    isPending,
    isError,
    error: queryError,
  } = useQuery({ queryKey, queryFn: () => listDomain<Row>(config.apiPath) });

  // Display rows: reorderable domains are grouped + ordered for intuitive up/down;
  // others render as-fetched. On a load error rows are treated as empty (the error
  // banner explains why).
  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    return config.reorderable ? sortForReorder(config, data) : data;
  }, [config, data]);

  // Combined banner: a write/reorder error (state) takes precedence, else the load error.
  const displayError =
    error ??
    (isError ? (queryError instanceof Error ? queryError.message : "Failed to load data") : null);

  // Reorder via the atomic bulk endpoint: swap `order` with the adjacent item in the
  // same group in ONE request (server writes both in a single batch, so no partial /
  // duplicate order is possible), then invalidate to reflect server state.
  const move = async (row: Row, direction: "up" | "down") => {
    const neighbors = buildReorderNeighbors(config, rows);
    const neighborId =
      direction === "up" ? neighbors.get(row.id)?.prevId : neighbors.get(row.id)?.nextId;
    const neighbor = neighborId ? rows.find((candidate) => candidate.id === neighborId) : undefined;
    if (!neighbor) return;

    setReordering(true);
    setError(null);
    setNotice(null);
    try {
      await reorderItems(config.apiPath, [
        { id: row.id, order: Number(neighbor.order ?? 0) },
        { id: neighbor.id, order: Number(row.order ?? 0) },
      ]);
      await queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
    } finally {
      setReordering(false);
    }
  };

  // Open the confirm modal for a row (replaces the native window.confirm).
  const requestDelete = (id: string) => {
    setNotice(null);
    setError(null);
    setPendingDeleteId(id);
  };

  // Dismiss the confirm modal, unless a delete is already in flight.
  const cancelDelete = () => {
    if (deletingId) return;
    setPendingDeleteId(null);
  };

  const confirmDelete = async () => {
    const id = pendingDeleteId;
    if (!id) return;
    setDeletingId(id);
    setNotice(null);
    setError(null);
    try {
      await deleteItem(config.apiPath, id);
      show("Deleted");
      await queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotice("That item was already removed. The list has been refreshed.");
        await queryClient.invalidateQueries({ queryKey });
      } else {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  const neighbors = config.reorderable ? buildReorderNeighbors(config, rows) : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">{config.label}</h1>
        <Link
          href={`/admin/${config.slug}/new`}
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          New
        </Link>
      </div>

      {notice && (
        <p className="mb-3 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          {notice}
        </p>
      )}
      {displayError && (
        <p className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {displayError}
        </p>
      )}

      {isPending ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400">No items yet. Use the New button to add one.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                {config.columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 font-medium text-gray-400">
                    {col.label}
                  </th>
                ))}
                {config.reorderable && (
                  <th className="px-3 py-2 font-medium text-gray-400">Reorder</th>
                )}
                <th className="px-3 py-2 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-gray-300">
                      {formatCell(row[col.key])}
                    </td>
                  ))}
                  {config.reorderable && (
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => move(row, "up")}
                          disabled={reordering || !neighbors?.get(row.id)?.prevId}
                          className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-40"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => move(row, "down")}
                          disabled={reordering || !neighbors?.get(row.id)?.nextId}
                          className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 disabled:opacity-40"
                        >
                          Down
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/${config.slug}/edit?id=${encodeURIComponent(row.id)}`}
                        className="text-blue-500 hover:text-blue-400"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => requestDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50"
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

      <Modal
        show={pendingDeleteId !== null}
        size="md"
        dismissible
        onClose={cancelDelete}
        theme={confirmModalTheme}
      >
        <Modal.Header>Delete item</Modal.Header>
        <Modal.Body>
          <p className="text-sm text-gray-300">
            Delete this item? This cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deletingId !== null}
            className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deletingId !== null ? "Deleting..." : "Delete"}
          </button>
          <button
            type="button"
            onClick={cancelDelete}
            disabled={deletingId !== null}
            className="rounded border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </Modal.Footer>
      </Modal>
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
