"use client";

import { Suspense, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { bySlug, type DomainConfig, type FieldConfig } from "@/lib/admin/config";
import {
  ApiError,
  createItem,
  getSingleton,
  updateItem,
} from "@/lib/admin/api";
import { adminReadList, adminReadPath } from "@/lib/admin/read";
import { adminKeys } from "@/lib/queries";
import { DomainForm } from "./DomainForm";
import { useAdminToast } from "./ToastProvider";

type Item = Record<string, unknown> & { id: string };

// The about doc ignores the id on update but its route still runs validateId (UUID),
// so any format-valid UUID works for the singleton PATCH.
const SINGLETON_PATCH_ID = "00000000-0000-0000-0000-000000000000";

function defaultForType(field: FieldConfig): unknown {
  switch (field.type) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "string-array":
    case "tech-picker":
      return [];
    case "select":
      // Default a new record to the first option (e.g. a post starts as 'draft').
      return field.options?.[0]?.value ?? "";
    case "markdown":
      return "";
    default:
      return "";
  }
}

function buildInitialValues(config: DomainConfig): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of config.fields) values[field.key] = defaultForType(field);
  return values;
}

function seedFromRecord(
  config: DomainConfig,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of config.fields) {
    values[field.key] = record[field.key] ?? defaultForType(field);
  }
  return values;
}

// Build the request body: omit empty strings (optional/blank fields), keep numbers,
// booleans, and arrays. Never includes an id - create generates it server-side and
// edit/singleton carry the id in the URL.
function buildPayload(
  config: DomainConfig,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of config.fields) {
    const value = values[field.key];
    if (typeof value === "string") {
      if (value.trim() === "") continue;
      payload[field.key] = value;
    } else {
      payload[field.key] = value;
    }
  }
  return payload;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

function Loading() {
  return <p className="text-sm text-gray-400">Loading...</p>;
}

function NotFound({ message, backHref }: { message: string; backHref: string }) {
  return (
    <div className="text-sm text-gray-400">
      <h1 className="mb-2 text-xl font-semibold text-white">Not found</h1>
      <p className="mb-3">{message}</p>
      <Link href={backHref} className="text-blue-500 hover:text-blue-400">
        Back to list
      </Link>
    </div>
  );
}

function CreateForm({ config }: { config: DomainConfig }) {
  const router = useRouter();
  const { show } = useAdminToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backHref = `/admin/${config.slug}`;

  const onSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    try {
      await createItem(config.apiPath, buildPayload(config, values));
      show("Created");
      await queryClient.invalidateQueries({ queryKey: adminKeys.domain(adminReadPath(config)) });
      router.push(backHref);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <DomainForm
      config={config}
      mode="new"
      initialValues={buildInitialValues(config)}
      submitting={submitting}
      error={error}
      onSubmit={onSubmit}
      onCancel={() => router.push(backHref)}
    />
  );
}

function EditForm({ config }: { config: DomainConfig }) {
  const router = useRouter();
  const { show } = useAdminToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const backHref = `/admin/${config.slug}`;
  const queryKey = adminKeys.domain(adminReadPath(config));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // D2: no GET /:id. Fetch the list (cached, shared with the list view) and select the
  // item by id — works on a direct refresh of the edit URL with nothing in memory.
  const {
    data: rows,
    isPending,
    isError,
    error: queryError,
  } = useQuery({ queryKey, queryFn: () => adminReadList<Item>(config) });

  const onSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    try {
      await updateItem(config.apiPath, id, buildPayload(config, values));
      show("Updated");
      await queryClient.invalidateQueries({ queryKey });
      router.push(backHref);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("This item no longer exists. It may have been deleted in another tab.");
      } else {
        setError(errorMessage(err));
      }
      setSubmitting(false);
    }
  };

  if (isPending) return <Loading />;
  if (isError) {
    return <NotFound message={errorMessage(queryError)} backHref={backHref} />;
  }
  const item = (rows ?? []).find((row: Item) => row.id === id) ?? null;
  if (item === null) {
    return (
      <NotFound
        message="This item could not be found. It may have been deleted."
        backHref={backHref}
      />
    );
  }

  return (
    <DomainForm
      config={config}
      mode="edit"
      initialValues={seedFromRecord(config, item)}
      submitting={submitting}
      error={error}
      onSubmit={onSubmit}
      onCancel={() => router.push(backHref)}
    />
  );
}

// Edit-only form for the about singleton (no create/delete). GET returns one object;
// PATCH targets the fixed doc with a placeholder id.
export function SingletonForm({ config }: { config: DomainConfig }) {
  const router = useRouter();
  const { show } = useAdminToast();
  const queryClient = useQueryClient();
  const queryKey = adminKeys.domain(adminReadPath(config));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A 404 means the single record has not been created yet, so don't retry it — treat
  // it as an editable empty form below.
  const {
    data,
    isPending,
    isError,
    error: queryError,
  } = useQuery({
    queryKey,
    queryFn: () => getSingleton<Record<string, unknown>>(config.apiPath),
    retry: false,
  });

  const onSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    try {
      await updateItem(config.apiPath, SINGLETON_PATCH_ID, buildPayload(config, values));
      show("Saved");
      await queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending) return <Loading />;
  const is404 = queryError instanceof ApiError && queryError.status === 404;
  if (isError && !is404) {
    return <NotFound message={errorMessage(queryError)} backHref="/admin" />;
  }
  // 404 (not yet created) -> empty form; otherwise the loaded record (or {} if null).
  const record = is404 ? {} : (data ?? {});

  return (
    <DomainForm
      config={config}
      mode="edit"
      initialValues={seedFromRecord(config, record)}
      submitting={submitting}
      error={error}
      onSubmit={onSubmit}
      onCancel={() => router.push("/admin")}
    />
  );
}

// Route-level entry for the create/edit pages (non-singleton domains). The edit
// branch reads ?id= via useSearchParams, so it lives under a Suspense boundary.
export function DomainFormPage({ slug, mode }: { slug: string; mode: "new" | "edit" }) {
  const config = bySlug[slug];
  if (!config || config.singleton) {
    return <NotFound message="No editable section matches this URL." backHref="/admin" />;
  }
  if (mode === "new") return <CreateForm config={config} />;
  return (
    <Suspense fallback={<Loading />}>
      <EditForm config={config} />
    </Suspense>
  );
}
