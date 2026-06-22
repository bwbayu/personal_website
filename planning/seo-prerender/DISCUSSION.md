# SEO Pre-render of Public Pages (S6, T11) — Design Discussion

> Session S6 of the feature roadmap. Adds SEO to the three EXISTING public pages
> (home / projects / resume) in two levels: (L1) per-page metadata + OG/Twitter cards;
> (L2) convert those pages from client-fetch to build-time server render so content
> lands in the HTML. Reuses the S4 build-time-fetch + rebuild-on-publish foundation.
> The roadmap Decisions log
> ([planning/feature-roadmap/DISCUSSION.md](../feature-roadmap/DISCUSSION.md), T11) and the
> blog Decisions log ([planning/blog/DISCUSSION.md](../blog/DISCUSSION.md)) are LOCKED and
> must not be contradicted.

## 1. Objective

Give the three existing public pages real SEO. Today they have near-zero per-page SEO:
no page-specific Open Graph/Twitter cards, and all content is client-fetched (absent
from the server-rendered HTML, so crawlers/scrapers see an empty skeleton).

- **Level 1** — per-page metadata + OG/Twitter cards for home/projects/resume. (Sitemap
  entries + robots + metadataBase + default OG image already exist from S4 — see §2.)
- **Level 2** — convert those three pages from client-fetch (TanStack Query) to
  build-time server render so the actual content is in the static HTML. Order: Home
  first, then Projects, then Resume (roadmap priority Home >> Projects > Resume).

Accepted trade-off (locked in T11): once a page renders at build time, content edits
(about/projects/skills) require a rebuild to go live — the same "edit -> rebuild -> live"
model as the blog/daily-log, bridged by the existing manual "Rebuild site" button.

## 2. Grounding / data flow (verified against code)

### What S4 ALREADY laid (so it is NOT S6 work)
- **metadataBase + default OG/Twitter** in the root layout:
  [app/layout.tsx:17-35](../../frontend/app/layout.tsx#L17-L35) sets `metadataBase`,
  site `title`/`description`, and a default `openGraph`/`twitter` pointing at
  `/og-default.png` (the asset exists in `frontend/public/og-default.png`).
- **Canonical origin** resolved once from `NEXT_PUBLIC_SITE_URL` (empty-safe, trailing
  slash stripped): [lib/siteUrl.ts:12-15](../../frontend/lib/siteUrl.ts#L12-L15).
- **Sitemap already lists the three static routes** (+ `/blog` + per-post):
  [app/sitemap.ts:13-18](../../frontend/app/sitemap.ts#L13-L18) emits `/`, `/project`,
  `/resume`, `/blog`. So Level 1's "sitemap entries for home/projects/resume" are
  ALREADY PRESENT — no sitemap change needed (at most: verify/adjust priority).
- **robots.txt** allow-all + absolute sitemap pointer:
  [app/robots.ts:9-14](../../frontend/app/robots.ts#L9-L14).

> Implication: Level 1 is SMALL. The only missing piece is per-page `openGraph`/`twitter`
> blocks on the three pages — see below.

### Current per-page metadata (the Level 1 gap)
- **Home** has NO page-level metadata at all — [app/(public)/page.tsx:1-5](../../frontend/app/(public)/page.tsx#L1-L5)
  just returns `<HomeClient />`. It inherits ONLY the root layout's site-level OG.
- **Projects** sets `title` + `description` only, no `openGraph`/`twitter` —
  [app/(public)/project/page.tsx:4-7](../../frontend/app/(public)/project/page.tsx#L4-L7).
- **Resume** likewise title + description only —
  [app/(public)/resume/page.tsx:4-7](../../frontend/app/(public)/resume/page.tsx#L4-L7).
- None of the three defines its own `openGraph`/`twitter` block, so their social cards
  fall back to the generic site-level card. Level 1 = add explicit per-page OG/Twitter.

### The build-time-render reference pattern (what Level 2 copies)
The blog/daily pages are the template: a **server** `page.tsx` fetches at build time and
passes data as props into a `"use client"` child that keeps the interactivity.
- Blog list: [app/(public)/blog/page.tsx:12-15](../../frontend/app/(public)/blog/page.tsx#L12-L15)
  — `const posts = await getPublishedPosts(); return <BlogListClient posts={posts} />`.
- Post page: [app/(public)/blog/[slug]/page.tsx:22-50](../../frontend/app/(public)/blog/[slug]/page.tsx#L22-L50)
  shows `generateMetadata` deriving per-item OG (title/description/cover) at build.
- Daily: [app/(public)/daily/page.tsx:15-25](../../frontend/app/(public)/daily/page.tsx#L15-L25)
  — server page even renders markdown to nodes at build and hands them to a thin client
  wrapper (keeps react-markdown out of the client bundle). N/A for S6 (no markdown).
- **Build fetcher pattern** = `force-cache` (NOT `no-store`), one fetch shared by all
  build consumers via Next's build-time fetch dedup:
  [lib/blog/posts.ts:19-29](../../frontend/lib/blog/posts.ts#L19-L29),
  [lib/daily/logs.ts:12-22](../../frontend/lib/daily/logs.ts#L12-L22). They `throw` on
  HTTP error (build fails) and return `[]` on empty (valid state).

### The three target components are interactive client components (must stay client)
All three need a client boundary, so Level 2 keeps them `"use client"` and feeds them
DATA VIA PROPS (dropping the `useXxx()` hooks):
- **HomeClient** — [components/HomeClient/index.tsx:9](../../frontend/components/HomeClient/index.tsx#L9)
  uses `useAbout/useSkills/useCategories`; has `useEffect` role-rotation +
  `useState` contact toggle + flowbite `Accordion`/`Tooltip`
  ([:19-45](../../frontend/components/HomeClient/index.tsx#L19-L45)).
- **ProjectsClient** — [components/ProjectsClient/index.tsx:9](../../frontend/components/ProjectsClient/index.tsx#L9)
  uses `useProjects/useSkills` (skills fetched UNFILTERED to resolve project tech icons),
  flowbite `Accordion`/`Tooltip`/`Badge` ([:55-70](../../frontend/components/ProjectsClient/index.tsx#L55-L70)).
- **ResumeClient** — [components/ResumeClient/index.tsx:16](../../frontend/components/ResumeClient/index.tsx#L16)
  uses `useResume`; `useState` tab switcher + flowbite `Timeline`/`Tooltip`/`List`
  ([:28-35](../../frontend/components/ResumeClient/index.tsx#L28-L35)).

### Data layer today (what Level 2 displaces)
- Public reads = TanStack hooks `useAbout/useSkills/useCategories/useProjects/useResume`
  in [lib/queries.ts:22-56](../../frontend/lib/queries.ts#L22-L56), backed by `no-store`
  fetchers in [app/api/](../../frontend/app/api/) (e.g.
  [app/api/about.ts:4-7](../../frontend/app/api/about.ts#L4-L7),
  [app/api/projects.ts:3-14](../../frontend/app/api/projects.ts#L3-L14),
  [app/api/resume.ts:15-26](../../frontend/app/api/resume.ts#L15-L26)). Resume is a
  read-only backend aggregation (`/api/resume`).
- **`useMediaSocials` is the exception**: the navbar + footer (shared chrome in the public
  layout) client-fetch media-socials —
  [CustomNavbar/NavbarClient.tsx:13-16](../../frontend/components/CustomNavbar/NavbarClient.tsx#L13-L16),
  [CustomFooter/FooterClient.tsx:7-10](../../frontend/components/CustomFooter/FooterClient.tsx#L7-L10).
  These are NOT pages and not in S6 scope; they (and `useMediaSocials` +
  `app/api/mediaSocials.ts`) STAY client-fetched.

### Static export constraint
`output: 'export'` (`next.config.mjs`, locked): no Node runtime. A `no-store` fetch in a
server component is incompatible with static export — build-time fetches MUST be
`force-cache` (or default cache). This is exactly why the build fetchers above use
`force-cache`. (Same constraint that forced the blog's pattern.)

## 3. Key decisions

> Numbered; each UNDECIDED until Bayu locks it. Recommendations noted.

- **D1 — Ticket split & session scope.** LOCKED = **two tickets in ONE session,
  sequenced.** SEO-1 = Level 1 (per-page OG/Twitter for all three pages); SEO-2 = Level 2
  (build-time render conversion, Home -> Projects -> Resume). L1 is tiny (S4 already did
  sitemap/robots/metadataBase), so both fit one session.
- **D2 — Level 1 metadata source.** LOCKED = **static hand-written per-page strings**
  (title + description) + the existing default OG image. Independent of Level 2 (no build
  fetch needed), dead simple. Data-derived metadata (Home description from `about` bio) is
  parked.
- **D3 — Level 2 conversion shape.** LOCKED = **the blog/daily pattern.** `page.tsx`
  becomes a server component that awaits a `force-cache` build fetcher and passes data as
  PROPS to the existing `*Client` component; the component keeps `"use client"` + all
  interactivity but drops its `useXxx()` hooks and reads props instead. (Rejected alt:
  keep TanStack Query seeded via `initialData`/hydration — more complex and still leaves
  content out of the HTML.) `Providers` (QueryClientProvider) STAYS — admin + navbar/
  footer still use TanStack Query.
- **D4 — Build fetchers location/shape.** LOCKED = `force-cache` build fetchers mirroring
  `lib/blog/posts.ts` / `lib/daily/logs.ts`, one per endpoint (about, skills, categories,
  projects, resume), keyed by DATA domain (not page) so the shared `skills` fetch dedups
  across Home + Projects via Next's build-time fetch dedup. Exact file layout (e.g. a
  `lib/public/` module) is a PLAN detail.
- **D5 — Cleanup of now-dead client data layer.** LOCKED = **delete the dead hooks +
  fetchers.** After L2, remove the public hooks `useAbout/useSkills/useCategories/
  useProjects/useResume` from `lib/queries.ts` and their `no-store` fetchers
  `app/api/{about,skills,categories,projects,resume}.ts`. KEEP `useMediaSocials` +
  `app/api/mediaSocials.ts` (navbar/footer) and `adminKeys` (admin). Removes a full dead
  subsystem.

## 4. Edge cases
- **Empty states at build.** List endpoints returning `[]` is valid — the components
  already render empty states ("No skills to display", "No projects to display", "No
  education records"). Build fetchers return `[]` on empty (like blog/daily). About is a
  singleton: a missing `about` doc should fail the build (`throw`, like `fetchAbout`'s
  `!json.data` guard) since Home depends on name/email.
- **Backend unreachable at build -> build fails.** Accepted (same risk the deploy already
  runs a BE health check; same as the blog).
- **Loading/Error UI removed.** After conversion there is no client loading state; the
  `Loading` / `ErrorMessage` early-returns in the three components are dropped (data is
  baked in at build; failure = failed build). Confirm we are OK losing the runtime error
  fallback for these pages.
- **Skills filtering differs per page.** Home shows only `isShow` skills and groups by
  category; Projects needs the UNFILTERED skills (to resolve project tech icons incl.
  `isShow:false` project-only skills). The build fetcher must return the full skills
  list; the per-page filtering stays in each component (as today).
- **Navbar/footer stay client-fetched.** They render inside the public layout regardless;
  media-socials being client-fetched does not affect the three pages' content SEO. No
  flash-of-empty concern for SEO (chrome, not indexable content).
- **metadata merge nuance.** Setting only `title`/`description` on a page does NOT give it
  a page-specific OG card; Level 1 must add explicit `openGraph`/`twitter` blocks per page
  (or rely on Next auto-filling them from the page title — to be settled in PLAN).
- **Content-edit -> rebuild lag (accepted).** Editing about/projects/skills/resume no
  longer shows live until a rebuild; the existing manual "Rebuild site" button covers it.

## 5. Decisions log (the contract)
- 2026-06-22 — Session opened. Grounded against code. Correction to the task premise:
  S4 ALREADY ships sitemap entries for home/projects/resume + robots + metadataBase +
  default OG image, so Level 1 reduces to per-page OG/Twitter blocks (no sitemap work).
  D1-D5 drafted; all UNDECIDED pending Bayu.
- 2026-06-22 — D1 LOCKED: two tickets in one session — SEO-1 (Level 1 OG/Twitter) then
  SEO-2 (Level 2 build-time render, Home -> Projects -> Resume).
- 2026-06-22 — D2 LOCKED: Level 1 metadata = static hand-written per-page strings + the
  existing default OG image; data-derived metadata parked.
- 2026-06-22 — D3 LOCKED: Level 2 = blog/daily pattern (server page.tsx fetches at build,
  passes props to the still-client `*Client` component, which drops its `useXxx()` hooks).
  Providers/QueryClientProvider stays.
- 2026-06-22 — D4 LOCKED: per-endpoint `force-cache` build fetchers mirroring
  lib/blog/posts.ts + lib/daily/logs.ts; shared `skills` fetch dedups via Next build-fetch
  dedup; file layout is a PLAN detail.
- 2026-06-22 — D5 LOCKED: delete the now-dead public hooks (about/skills/categories/
  projects/resume) + their no-store fetchers; keep useMediaSocials + mediaSocials fetcher
  (navbar/footer) and adminKeys (admin).
- 2026-06-22 — All five decisions resolved (D1-D5 LOCKED via Bayu's answers).
- 2026-06-22 — DESIGN LOCKED by Bayu. Decisions log complete (D1-D5). Ready for /wf-plan.

## 6. Parking lot / later
- Data-derived per-page metadata (Home description/OG from `about` bio) — possible once
  L2 fetches that data at build; deferred to keep L1 static.
- `alternates.canonical` per page, web manifest / PWA icons, richer favicon set.
- JSON-LD structured data (Person/WebSite schema) for richer search results.
- Per-project OG pages (`/project/[slug]`) — projects are currently a single list page.
