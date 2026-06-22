import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

// getSiteUrl strips any trailing slash, so `${siteUrl}/sitemap.xml` never doubles up.
const siteUrl = getSiteUrl();

// Emitted as /robots.txt in the static export: allow all crawlers and point them at
// the absolute sitemap URL.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
