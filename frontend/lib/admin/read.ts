import type { DomainConfig } from "./config";
import { listDomain, listDomainAuthed } from "./api";

// Admin read path/key helpers. Most domains read and write the same `apiPath`, but
// posts reads `/api/posts/all` (drafts, authed) while writing to `/api/posts`. These
// helpers keep the list view, edit form, create/delete invalidations, and the
// dashboard count all agreeing on ONE cache key (the read path), so a write to the
// write path still refreshes the read entry.
export function adminReadPath(config: DomainConfig): string {
  return config.adminListPath ?? config.apiPath;
}

export function adminReadList<T = Record<string, unknown>>(config: DomainConfig): Promise<T[]> {
  const fetcher = config.adminAuthRead ? listDomainAuthed : listDomain;
  return fetcher<T>(adminReadPath(config));
}
