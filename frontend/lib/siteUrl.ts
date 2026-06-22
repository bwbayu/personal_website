// Canonical site origin, resolved once from the build-time env (NEXT_PUBLIC_SITE_URL).
// Shared by metadataBase (layout), the sitemap, and robots so the canonical URL, OG image
// resolution, sitemap <loc> values, and the robots sitemap pointer all agree.
//
// Empty-safe: GitHub Actions sets an UNSET secret to an empty STRING (not undefined), so a
// plain `?? default` would keep that "" — making `new URL("")` throw and breaking the static
// export. Trimming + `||` treat "" (or whitespace) as absent and fall back to the production
// default. The trailing slash is stripped so callers can append `/path` without doubling the
// separator.
const DEFAULT_SITE_URL = "https://bwbayu.space";

export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim() || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}
