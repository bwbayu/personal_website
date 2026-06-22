// Build-time blog data (D11). The published list is fetched ONCE with force-cache so
// the three build consumers — generateStaticParams, the /blog list, and each
// /blog/[slug] (find-by-slug in memory) — share a single request. NOT no-store: that
// would refetch per consumer and per page.

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  cover?: string;
  content: string;
  tags: string[];
  status: "draft" | "published";
  publishedAt?: string;
  readingTime: number;
}

export async function getPublishedPosts(): Promise<Post[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const res = await fetch(`${base}/api/posts`, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Failed to fetch posts (HTTP ${res.status})`);
  }
  const json = (await res.json()) as { data?: Post[] };
  // Zero published posts is a valid state: the list page renders an empty state and
  // no [slug] pages are generated, but the build must still succeed.
  return json.data ?? [];
}

// Card text + meta/OG description (D12). Uses the explicit excerpt when set, else a
// ~160-char fallback derived from the markdown with the heaviest syntax stripped.
export function excerptOf(post: Post): string {
  if (post.excerpt && post.excerpt.trim() !== "") return post.excerpt.trim();
  const stripped = post.content
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> link text
    .replace(/[#>*_~`-]/g, " ") // leftover markdown punctuation
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 160 ? `${stripped.slice(0, 160).trimEnd()}...` : stripped;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Deterministic UTC date formatting (no locale/timezone drift between build hosts).
export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
