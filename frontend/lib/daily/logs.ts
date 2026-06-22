// Build-time daily-log data (DL9). The full list is fetched ONCE with force-cache for
// the server-component build. There is no per-entry route, so this is the single build
// consumer. NOT no-store, which would refetch on every render.

export interface DailyLog {
  id: string;
  date: string;
  content: string;
  tags: string[];
}

export async function getDailyLogs(): Promise<DailyLog[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const res = await fetch(`${base}/api/daily-logs`, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Failed to fetch daily logs (HTTP ${res.status})`);
  }
  const json = (await res.json()) as { data?: DailyLog[] };
  // Zero entries is a valid state: the feed renders an empty state, but the build
  // must still succeed.
  return json.data ?? [];
}
