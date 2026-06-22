# Blog (S4, T9 part 1: posts) — Design Discussion

> Session S4 of the feature roadmap. Builds the blog `posts` feature: a new Firestore
> collection + BE domain, an admin widget for authoring posts, public `/blog` +
> `/blog/[slug]` pages, and the rebuild-on-publish mechanism (shared foundation reused
> by S5 daily-log). The roadmap Decisions log
> ([planning/feature-roadmap/DISCUSSION.md](../feature-roadmap/DISCUSSION.md)) and the
> admin-cms Decisions log ([planning/admin-cms/DISCUSSION.md](../admin-cms/DISCUSSION.md))
> are LOCKED and must not be contradicted.

## 1. Objective

Add a Medium-like blog to the personal website so Bayu can write and publish posts.
Concretely (roadmap T9 part 1):
- New `posts` Firestore collection + BE domain (per-domain controller/service/repository/
  routes/schema/type), fields: title, slug, cover, content, tags[], status
  (draft/published), publishedAt, derived reading time.
- Admin authoring widget: a markdown (or WYSIWYG) editor with custom fields (status,
  tags, cover, slug), wired into the existing config-driven scaffold.
- Public pages: `/blog` (list of published posts) and `/blog/[slug]` (a post),
  statically pre-rendered at build for full SEO/OG (roadmap Option B).
- Rebuild-on-publish: publishing from admin triggers a frontend rebuild+deploy via
  GitHub `workflow_dispatch` (the foundation S5 will reuse).

## 2. Grounding / data flow (verified against code)

### Backend per-domain pattern (the template to copy)
- A domain = `<x>.controller.ts / .service.ts / .repository.ts / .routes.ts /
  .schema.ts / .type.ts`, registered in
  [routes/index.ts](../../backend/src/routes/index.ts:19-28). Reference: projects
  ([project.routes.ts](../../backend/src/projects/project.routes.ts)) is factory-DI:
  `createXxxRepository(db?) -> createXxxService(repo) -> createXxxController(service)`,
  wired once as the composition root in `*.routes.ts`.
- Generic [FirestoreRepository<T>](../../backend/src/shared/firestore.repository.ts):
  `findAll`, `findAllOrdered(field)`, `save`, `update`, `remove`, `reorder` — **no
  `findById` / `findBySlug` yet** (admin D2 deliberately avoids GET/:id).
- Route order: `validateId|validateSlugId -> authMiddleware -> validate(schema) ->
  controller`. Writes are gated by [authMiddleware](../../backend/src/middlewares/auth.middleware.ts)
  (Firebase Bearer token OR x-api-key); **GET is public** across every domain.
- ID generation: uuid domains use `randomUUID()` in the controller + `validateId`;
  slug domains (skills, categories) use `toSlug(name)` as the doc id + `validateSlugId`.
  [toSlug](../../backend/src/utils/slug.util.ts) = lowercase, non-alphanumerics -> `-`.
- Validation helpers in [schema.util.ts](../../backend/src/utils/schema.util.ts):
  `safeUrl` (http/https, max 500), `safeDate` (YYYY-MM-DD). Zod is the source of truth.
- Config ([env.ts](../../backend/src/config/env.ts)) parses `apiKey`, `adminEmails`,
  `firebaseProjectId`, etc. A rebuild-trigger token would be a new env var here.

### Admin scaffold (S3 / S3.1 / S3.2 — the thing the post widget plugs into)
- Config-driven: a per-domain `DomainConfig` in
  [lib/admin/config.ts](../../frontend/lib/admin/config.ts) declares `slug, label,
  apiPath, idKind, singleton?, reorderable?, columns[], fields[]`. One shared list view
  + one shared form view render from it. `FieldType` today =
  `text | textarea | number | boolean | date | url | string-array | category-ref |
  tech-picker`. Custom widgets live in
  [components/admin/inputs/](../../frontend/components/admin/inputs/) and are dispatched
  by field type. **No `markdown`, `select`, or `slug` field type yet** — posts adds at
  least one custom widget.
- Admin API client [lib/admin/api.ts](../../frontend/lib/admin/api.ts): reads are
  **public GET** (`listDomain` uses plain `fetch`, no token); writes use `authedFetch`
  (Firebase token). TanStack Query keys: `adminKeys.domain(apiPath)` — writes
  `invalidateQueries` the domain (S3.2).
- A `posts` admin list that must show DRAFTS is the **first domain whose admin read
  needs auth** (every existing domain's data is fully public).

### Public rendering — the DEPARTURE (locked Option B)
- Every existing public page is a thin server wrapper around a `"use client"` component
  that fetches at RUNTIME via TanStack Query
  ([project/page.tsx](../../frontend/app/(public)/project/page.tsx) -> `ProjectsClient`;
  hooks in [lib/queries.ts](../../frontend/lib/queries.ts)). Per-page metadata is static
  (`export const metadata` is a fixed string) — there is **no per-item OG/SEO** anywhere.
- [next.config.mjs](../../frontend/next.config.mjs) = `output: 'export'` (pure static,
  no Node server, `images.unoptimized`). A dynamic route `/blog/[slug]` therefore
  REQUIRES `generateStaticParams()` to enumerate slugs at build, and content must be
  fetched at BUILD time inside a server component to land in the HTML for SEO/OG.
- Consequence (accepted, from Option B): the FE build now reads the backend at build
  time; only PUBLISHED posts get pages; publishing has a few-minutes publish->live delay
  bridged by the rebuild trigger. Drafts are previewed in admin via client fetch.

> **Why a rebuild is required at all (Q raised 2026-06-21).** Static export = no runtime
> server; each page is a frozen HTML file written at build time. Flipping `status` to
> `published` in Firestore changes DATA but creates no page file, so `/blog/<slug>` 404s
> until a build runs. The other domains (projects/home/resume) avoid this because they
> client-fetch at runtime — but that yields NO per-post SEO/OG (social scrapers + first-
> pass crawlers read raw HTML, which for a client-fetched page is an empty skeleton). The
> three models: (a) client-fetch like projects = instant, no rebuild, but no SEO; (b)
> static pre-render + rebuild-on-publish = full SEO, ~minutes delay, free static hosting
> (LOCKED Option B); (c) SSR/ISR on a Node server = SEO + instant but drops the cheap
> static architecture (paid always-on server). With `output: export`, even a client-
> fetched blog still needs `generateStaticParams` at build, so a NEW slug 404s until a
> rebuild regardless — (c) is the only way to get both SEO and instant, and it is out of
> scope. Hence the rebuild button.

### CI/CD (the rebuild target)
- [frontend-deploy.yml](../../.github/workflows/frontend-deploy.yml) already has a
  `workflow_dispatch:` trigger and a `check (typecheck) -> build-deploy` flow that builds
  the static export with `NEXT_PUBLIC_*` secrets and deploys to Firebase Hosting `live`.
  So the rebuild-on-publish hook = a `workflow_dispatch` on this existing workflow
  (ref `main`); no new workflow needed, only a caller that holds a GitHub token.
- The browser must NOT hold a GitHub token -> the trigger is proxied by an authed BE
  endpoint that calls the GitHub REST API server-side.

## 3. Key decisions

> ALL decisions D1-D12 LOCKED by Bayu (2026-06-21). See the Decisions log (§5).

- **D1 — Editor format / content storage.** LOCKED = **markdown editor component**.
  Authoring widget = `@uiw/react-md-editor` (formatting toolbar + split preview), loaded
  client-side in the admin form (dynamic import, `ssr: false`). Content is stored as raw
  **markdown text** (not HTML). NOTE: the in-admin editor preview is separate from the
  PUBLIC render — public pages render markdown through the controlled build-time pipeline
  in D5, not via the editor.
- **D2 — Slug strategy.** LOCKED = **uuid doc id + editable unique `slug` field**. Doc id
  = `randomUUID()` (stable internal ref, `validateId`); `slug` is a separate editable
  field, the public URL is `/blog/<slug>`. Slugs can be renamed and titles can repeat.
  Uniqueness enforced by a `findBySlug` check on create/update (see edge cases). Default
  the slug from `toSlug(title)` in the admin form, but it stays editable.
- **D3 — Rebuild trigger UX.** LOCKED = **manual "Rebuild site" button**. No auto-fire on
  publish. The button calls a SHARED, domain-agnostic authed BE endpoint
  `POST /api/rebuild` (NOT under `/posts` — S5 daily-log reuses it) that proxies a GitHub
  `workflow_dispatch` on [frontend-deploy.yml](../../.github/workflows/frontend-deploy.yml)
  (ref `main`). The GitHub token lives only in BE config (new env var, e.g.
  `GITHUB_DISPATCH_TOKEN`, a fine-grained PAT with repo `actions: write`); repo owner/name
  + workflow filename also configured. Used for both first-publish and re-deploying edits.
- **D4 — Draft API exposure.** LOCKED = **separate authed admin route** (recommended).
  Public `GET /api/posts` is ALWAYS published-only and structurally never queries drafts;
  the admin list reads `GET /api/posts/all` gated by the existing `authMiddleware`. The
  posts `DomainConfig` gets an `adminListPath` override (`/api/posts/all`) for reads;
  writes still target `/api/posts` (+ `/:id`). Build-time fetch uses the public
  published-only route (no token).

- **D5 — Markdown pipeline (public render).** LOCKED: render at BUILD time in a server
  component via the `react-markdown` family: `remark-gfm` (tables/strikethrough/task
  lists), `rehype-sanitize` (XSS defense-in-depth on the rendered output), and
  **`rehype-highlight`** (highlight.js — lightweight, build-time code highlighting; Shiki
  rejected as heavier than needed). Distinct from the D1 authoring editor.
- **D6 — Reading time.** LOCKED: BE derives + stores on write (`ceil(words/200)` min);
  FE just displays. Keeps it consistent and out of the render path.
- **D7 — publishedAt semantics.** LOCKED: BE sets `publishedAt` the first time status
  flips to `published` and it is unset; never auto-cleared on unpublish. Stored ISO date.
  Public list ordered by `publishedAt` desc.
- **D8 — Cover image.** LOCKED: a URL text field (honors admin D5 = URL/text assets,
  no upload). Cover doubles as the OG image. Guarded by `safeUrl`.
- **D9 — Tags.** LOCKED: `string[]` via the existing `string-array` widget; displayed
  on cards + post header; simple client-side tag filter on `/blog`. Dedicated
  `/blog/tag/<tag>` landing pages = parking lot.
- **D10 — New scaffold field types.** LOCKED: add a `markdown` widget (D1) + a generic
  `select` (enum options, for `status`) field type to the field-type registry; `slug` is a
  normal `text` field (D2). Add the `posts` `DomainConfig` with the `adminListPath`
  override (D4), and a `Blog` section in the admin sidebar nav groups.
- **D11 — Build-time fetch + public nav.** LOCKED: a dedicated build fetcher (force-cache,
  NOT `no-store`) fetches the published list ONCE, reused by `generateStaticParams`, the
  `/blog` list page, and each `/blog/[slug]` (which finds its post in memory by slug — no
  per-slug endpoint needed). `dynamicParams = false` so unknown/draft slugs 404. The
  published list payload includes `content` (acceptable at personal scale). Add a `Blog`
  link to the public navbar; `/blog` + `/blog/[slug]` live in the `(public)` route group
  but are server components (the SEO departure).
- **D12 — Excerpt field.** LOCKED: add an optional `excerpt` field (short summary)
  used for the `/blog` card text + the per-post meta description / OG description. If
  omitted, derive a fallback from the first ~160 chars of content (markdown-stripped).

### 3.1 Proposed `posts` shape + endpoints (concrete)

```
Post {
  id: string            // randomUUID (D2)
  slug: string          // editable, unique; URL = /blog/<slug>
  title: string
  excerpt?: string      // D12; fallback derived from content
  cover?: string        // safeUrl; OG image (D8)
  content: string       // raw markdown (D1); generous max (~50k-100k)
  tags: string[]        // D9
  status: 'draft' | 'published'
  publishedAt?: string  // ISO; set on first publish (D7)
  readingTime: number   // minutes, derived on write (D6)
}
```

Endpoints (per-domain pattern + the two posts-specific deviations):
- `GET  /api/posts`        public, **published-only**, ordered by `publishedAt` desc (build + public).
- `GET  /api/posts/all`    authed (D4), all statuses (admin list).
- `POST /api/posts`        authed; BE sets id=uuid, derives readingTime, checks slug unique.
- `PATCH /api/posts/:id`   authed; re-derives readingTime, re-checks slug, manages publishedAt.
- `DELETE /api/posts/:id`  authed.
- `POST /api/rebuild`      authed, shared (D3); proxies the GitHub workflow_dispatch.

Tests (roadmap S4 = new domain): unit (service: reading-time, publishedAt transition,
slug-uniqueness reject) + emulator slice (findBySlug, published-only ordered query).

## 4. Edge cases (collecting)
- Draft must never be reachable publicly: not in the public API, not as a built page,
  not via direct `/blog/<draft-slug>` (404). Verify both API + build filter on status.
- Slug uniqueness: if D2 = separate slug field, two published posts must not share a
  slug (Firestore has no unique constraint) -> enforce with a findBySlug check on write.
  If D2 = slug-as-id, uniqueness is automatic but a duplicate title would collide/
  overwrite, and the slug cannot change after create.
- Backend unreachable at build time -> FE build fails. Acceptable (same risk the deploy
  already runs a BE health check); decide whether an empty blog (zero published) builds
  cleanly (it must: `/blog` renders an empty state, no `[slug]` pages).
- Editing an already-published post needs a rebuild to reflect changes -> a standalone
  rebuild action is required regardless of D3.
- Rebuild storms: firing a deploy on every small edit. Mitigation = manual button or
  debounce/"rebuild pending" state (parking lot if auto).
- Large content payload: build fetches full markdown for all posts in one list call —
  fine at personal scale; set a generous Zod `content` max (e.g. 50k-100k chars).
- Markdown XSS: even single-author, sanitize on render (rehype-sanitize) and/or constrain
  raw HTML. WYSIWYG path MUST sanitize stored HTML.
- Unpublishing a live post: flip to draft + rebuild removes its page; old URL then 404s
  (acceptable). Note for D7 (publishedAt retained).
- about-style singleton does NOT apply — posts is a normal multi-item CRUD domain.

## 5. Decisions log (the contract)
- 2026-06-21 — Session opened. Grounded against code; roadmap T9 + admin-cms locks
  carried in. Surfaced the key tension: blog public pages are a deliberate departure
  from the site-wide client-fetch pattern (build-time server-component render for SEO,
  per locked Option B). D1-D11 drafted; D1-D4 pending user decision.
- 2026-06-21 — D1 LOCKED: markdown editor component (`@uiw/react-md-editor`, client-only
  dynamic import) for authoring; content stored as raw markdown. Editor preview != public
  render (D5).
- 2026-06-21 — D2 LOCKED: uuid doc id + editable unique `slug` field; URL = `/blog/<slug>`;
  slug defaulted from `toSlug(title)` but editable; uniqueness via `findBySlug` on write.
- 2026-06-21 — D3 LOCKED: rebuild = manual "Rebuild site" button -> authed BE endpoint
  proxies a GitHub `workflow_dispatch` on the existing frontend-deploy workflow (ref
  `main`); GitHub token held in BE config only. No auto-fire on publish.
- 2026-06-21 — D4 LOCKED: drafts kept private via a SEPARATE authed admin route. Public
  `GET /api/posts` is always published-only (never queries drafts); admin reads
  `GET /api/posts/all` behind `authMiddleware`; posts `DomainConfig` gets an
  `adminListPath` override. Build fetch uses the public published-only route.
- 2026-06-21 — D5 LOCKED: public render = `react-markdown` + `remark-gfm` +
  `rehype-sanitize` + `rehype-highlight` (highlight.js), at build time in a server
  component. Shiki rejected (heavier than needed).
- 2026-06-21 — D6 LOCKED: reading time derived + stored on write (`ceil(words/200)` min).
- 2026-06-21 — D7 LOCKED: `publishedAt` set on first draft->published flip, never cleared;
  public list ordered by `publishedAt` desc.
- 2026-06-21 — D8 LOCKED: cover = `safeUrl` text field, doubles as OG image (no upload).
- 2026-06-21 — D9 LOCKED: tags = `string[]` (string-array widget) + client-side filter on
  `/blog`; `/blog/tag/<tag>` pages parked.
- 2026-06-21 — D10 LOCKED: add `markdown` + `select` field types to the scaffold; `slug` is
  a plain text field; `posts` `DomainConfig` with `adminListPath` override + a `Blog` admin
  sidebar section.
- 2026-06-21 — D11 LOCKED: single force-cached build fetch of the published list, reused by
  `generateStaticParams` + `/blog` + `/blog/[slug]` (find-by-slug in memory);
  `dynamicParams = false`; add a `Blog` public navbar link.
- 2026-06-21 — D12 LOCKED: add optional `excerpt` field (card text + meta/OG description),
  fallback = first ~160 chars of content.
- 2026-06-21 — T11/S6 added to the roadmap (SEO pre-render of existing public pages
  deferred to its own session; S4 stays blog-only, laying only the shared SEO plumbing the
  blog forces). Recorded in [planning/feature-roadmap/DISCUSSION.md](../feature-roadmap/DISCUSSION.md).
- 2026-06-21 — DESIGN LOCKED by Bayu. Decisions log complete (D1-D12). Ready for /wf-plan.

## 6. Parking lot / later
- **Site-wide SEO pre-render — candidate new roadmap session S6 (raised 2026-06-21).**
  Today NO public page emits Open Graph/Twitter/sitemap/robots/metadataBase, and the home
  page (the most important SEO target) has no own `metadata` export at all; all content is
  client-fetched (not in HTML). Proposal: a dedicated session AFTER S4/S5 that reuses the
  S4 rebuild webhook + build-time-fetch pattern to (Level 1) add per-page metadata +
  OG/Twitter + default OG image + sitemap + robots across home/projects/resume, and
  (Level 2) convert those pages from client-fetch to build-time server render so content
  lands in the HTML. Priority Home >> Projects > Resume. Trade-off to accept: pre-rendering
  makes content edits (about/projects/skills) require a rebuild to go live (site-wide
  "edit -> rebuild -> live", same model as the blog). NOTE: S4 itself lays the minimal
  shared SEO plumbing the blog forces anyway (metadataBase, default OG image, a sitemap
  that can also list static routes, robots.txt); S6 builds per-page OG + content
  conversion on top. Needs to be added to the roadmap (planning/feature-roadmap) if Bayu
  approves.
- Dedicated tag landing pages `/blog/tag/<tag>` + tag index.
- Firebase Storage cover/image uploads (admin D5 parked uploads globally).
- RSS/Atom feed + sitemap entry for posts.
- Full-text search (roadmap T10: simple filtering now, search service only if needed).
- Scheduled publish (publish at a future date) — needs a cron/rebuild scheduler.
- Rebuild debounce / "rebuild in progress" indicator if auto-trigger is chosen.
- Draft preview via a shareable tokenized link (currently admin-only client preview).
