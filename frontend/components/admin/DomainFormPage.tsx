"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { bySlug, type DomainConfig, type FieldType } from "@/lib/admin/config";
import {
  ApiError,
  createItem,
  getSingleton,
  listDomain,
  updateItem,
} from "@/lib/admin/api";
import { DomainForm } from "./DomainForm";

type Item = Record<string, unknown> & { id: string };

// The about doc ignores the id on update but its route still runs validateId (UUID),
// so any format-valid UUID works for the singleton PATCH.
const SINGLETON_PATCH_ID = "00000000-0000-0000-0000-000000000000";

function defaultForType(type: FieldType): unknown {
  switch (type) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "string-array":
    case "tech-picker":
      return [];
    default:
      return "";
  }
}

function buildInitialValues(config: DomainConfig): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of config.fields) values[field.key] = defaultForType(field.type);
  return values;
}

function seedFromRecord(
  config: DomainConfig,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of config.fields) {
    values[field.key] = record[field.key] ?? defaultForType(field.type);
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backHref = `/admin/${config.slug}`;

  const onSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    try {
      await createItem(config.apiPath, buildPayload(config, values));
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
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const backHref = `/admin/${config.slug}`;

  const [item, setItem] = useState<Item | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // D2: no GET /:id. Fetch the list and select the item by id (works on a direct
  // refresh of the edit URL with nothing in memory).
  useEffect(() => {
    let active = true;
    setItem(undefined);
    setLoadError(null);
    (async () => {
      try {
        const rows = await listDomain<Item>(config.apiPath);
        if (!active) return;
        setItem(rows.find((row) => row.id === id) ?? null);
      } catch (err) {
        if (!active) return;
        setItem(null);
        setLoadError(errorMessage(err));
      }
    })();
    return () => {
      active = false;
    };
  }, [config, id]);

  const onSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    try {
      await updateItem(config.apiPath, id, buildPayload(config, values));
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

  if (item === undefined) return <Loading />;
  if (item === null) {
    return (
      <NotFound
        message={loadError ?? "This item could not be found. It may have been deleted."}
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
  const [record, setRecord] = useState<Record<string, unknown> | null | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRecord(undefined);
    setLoadError(null);
    try {
      const data = await getSingleton<Record<string, unknown>>(config.apiPath);
      setRecord(data ?? {});
    } catch (err) {
      // 404 = the single record has not been created yet; allow editing an empty form.
      if (err instanceof ApiError && err.status === 404) setRecord({});
      else {
        setRecord(null);
        setLoadError(errorMessage(err));
      }
    }
  }, [config]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const onSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await updateItem(config.apiPath, SINGLETON_PATCH_ID, buildPayload(config, values));
      setNotice("Saved.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (record === undefined) return <Loading />;
  if (record === null) {
    return <NotFound message={loadError ?? "Could not load this record."} backHref="/admin" />;
  }

  return (
    <DomainForm
      config={config}
      mode="edit"
      initialValues={seedFromRecord(config, record)}
      submitting={submitting}
      error={error}
      notice={notice}
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
