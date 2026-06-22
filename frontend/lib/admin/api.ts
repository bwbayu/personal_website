// Admin API client. Reads are public GETs; writes go through `authedFetch` (which
// attaches a fresh Firebase ID token and retries once on 401). Every call unwraps the
// `{ success, message, data }` envelope and throws an `ApiError` on a non-OK response
// so list/form views can surface the backend's 400/403/404 message text (D10).

import { authedFetch } from '../authedFetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Envelope = { data?: unknown; message?: string };

async function unwrap<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => null)) as Envelope | null;
  if (!res.ok) {
    const message = json?.message ?? `Request failed (HTTP ${res.status})`;
    throw new ApiError(res.status, message);
  }
  return (json?.data ?? null) as T;
}

export async function listDomain<T = Record<string, unknown>>(apiPath: string): Promise<T[]> {
  const res = await fetch(`${API_URL}${apiPath}`, { cache: 'no-store' });
  return unwrap<T[]>(res);
}

// Authed variant for domains whose admin read is private (posts: /api/posts/all
// exposes drafts and is gated by the Firebase token).
export async function listDomainAuthed<T = Record<string, unknown>>(apiPath: string): Promise<T[]> {
  const res = await authedFetch(`${API_URL}${apiPath}`, { cache: 'no-store' });
  return unwrap<T[]>(res);
}

// Public GET for a singleton domain (about) whose endpoint returns one object, not a
// list. Throws ApiError(404) when the single record has not been created yet.
export async function getSingleton<T = Record<string, unknown>>(apiPath: string): Promise<T> {
  const res = await fetch(`${API_URL}${apiPath}`, { cache: 'no-store' });
  return unwrap<T>(res);
}

export async function createItem<T = Record<string, unknown>>(
  apiPath: string,
  body: unknown,
): Promise<T> {
  const res = await authedFetch(`${API_URL}${apiPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return unwrap<T>(res);
}

export async function updateItem<T = Record<string, unknown>>(
  apiPath: string,
  id: string,
  body: unknown,
): Promise<T> {
  const res = await authedFetch(`${API_URL}${apiPath}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return unwrap<T>(res);
}

export async function deleteItem(apiPath: string, id: string): Promise<void> {
  const res = await authedFetch(`${API_URL}${apiPath}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  await unwrap<null>(res);
}

// Atomic bulk reorder: one PATCH to `${apiPath}/reorder` with a bare array of
// { id, order } pairs (the server writes them in a single Firestore batch). The
// Content-Type header is required so the array body is parsed as JSON.
export async function reorderItems(
  apiPath: string,
  updates: { id: string; order: number }[],
): Promise<void> {
  const res = await authedFetch(`${API_URL}${apiPath}/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  await unwrap<null>(res);
}
