// Backend API origin for build-time fetchers (NEXT_PUBLIC_API_URL). Shared by the
// public/blog/daily build fetchers so the base resolution lives in one place. Empty
// string when unset so callers append `/api/...` (mirrors the previous inline default).
export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}
