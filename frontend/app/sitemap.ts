import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog/posts";
import { getSiteUrl } from "@/lib/siteUrl";

// Generated into the static export at build. Lists the static public routes plus one
// entry per published post (drafts excluded — they are never in getPublishedPosts).
// Reuses the BLOG-5 build fetcher (force-cache, so no extra network call). Sitemap
// <loc> values must be ABSOLUTE (the protocol requires it, and Next does not prefix
// them with metadataBase), so build them from the canonical site origin.
const base = getSiteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/project`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/resume`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const posts = await getPublishedPosts();
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
