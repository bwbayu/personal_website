// Shared date formatting. Deterministic UTC rendering of a YYYY-MM-DD (or ISO) string
// so the static export shows the same calendar date on any build host (no locale /
// timezone drift). Used by both the blog and daily-log feeds.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDateUTC(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
