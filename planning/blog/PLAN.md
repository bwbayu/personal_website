# Blog (S4, T9 part 1: posts) — Implementation Plan

Derived from [DISCUSSION.md](DISCUSSION.md) (decisions D1-D12 LOCKED). Each ticket is
one commit, independently shippable + testable. Backend lands before the frontend that
consumes it. Tests are scoped per ticket under `backend/tests/blog/` (unit, repo mocked)
plus the shared emulator slice run locally before any Firestore-touching commit.

Branch: `feat/blog` (cut from `develop`).

## Scope confirmations (resolved 2026-06-21 in /wf-plan)
- **SEO plumbing = FULL** (per the parking-lot note): per-post OG **plus** site-wide
  `metadataBase`, default OG image, `sitemap.xml` (static routes + published posts),
  `robots.txt`. -> dedicated ticket **BLOG-6**.
- **Rebuild button placement** = admin dashboard **and** the Blog (posts) list header.
  -> **BLOG-7**.

## New shape (from §3.1, the contract)
```
Post {
  id: string            // randomUUID (D2)
  slug: string          // editable, unique; URL = /blog/<slug>
  title: string
  excerpt?: string      // D12
  cover?: string        // safeUrl; OG image (D8)
  content: string       // raw markdown (D1)
  tags: string[]        // D9
  status: 'draft' | 'published'
  publishedAt?: string  // ISO; set on first publish (D7)
  readingTime: number   // minutes, derived on write (D6)
}
```

## Ticket sequence
| Ticket | Title | Depends on |
|--------|-------|-----------|
| BLOG-1 | Backend `posts` domain (CRUD + service logic) | — |
| BLOG-2 | Backend `POST /api/rebuild` shared endpoint + env | — |
| BLOG-3 | Admin scaffold: `markdown` + `select` field widgets + types | — |
| BLOG-4 | Admin posts integration (authed `/all` read + posts config + nav) | BLOG-1, BLOG-3 |
| BLOG-5 | Public `/blog` + `/blog/[slug]` pages + markdown render + navbar link | BLOG-1 |
| BLOG-6 | Site-wide SEO plumbing (metadataBase, default OG, sitemap, robots) | BLOG-5 |
| BLOG-7 | Admin Rebuild button (dashboard + Blog list header) | BLOG-2, BLOG-4 |

---

## BLOG-1 — Backend `posts` domain (CRUD + service logic)

**Status: DONE — commit `e5e69c3`.** Deviation: admin `findAll` sorts in memory
(published newest-first, drafts last) instead of a Firestore `orderBy('publishedAt')`,
which would drop drafts (Firestore excludes docs missing the ordered field). The
published-only query (`status == published` + `orderBy publishedAt`) needs a composite
index in prod.

**Scope.** New per-domain module `backend/src/posts/` following the projects factory-DI
pattern (`createXxxRepository -> Service -> Controller`, composition root in
`*.routes.ts`). Implements the full Post shape, the two posts-specific GET routes
(public published-only + authed `/all`), reading-time derivation (D6), `publishedAt`
transition (D7), and slug-uniqueness enforcement (D2). Adds a generic `findById` to the
shared repository (repo-level only — does NOT add a `GET /:id` HTTP route, so D2 stands).

**Files to touch.**
- `backend/src/posts/post.type.ts` — `Post` interface + `PostStatus = 'draft' | 'published'`.
- `backend/src/posts/post.schema.ts` — Zod `postInsertSchema` / `postUpdateSchema`:
  - `title` `z.string().min(1).max(200)`
  - `slug` `z.string().min(1).max(200).regex(/^[a-z0-9-]+$/)` (URL-safe; mirror `toSlug` charset)
  - `excerpt` `z.string().max(500).optional()`
  - `cover` `safeUrl.optional()`
  - `content` `z.string().min(1).max(100000)` (generous max per edge case)
  - `tags` `z.array(z.string().min(1).max(50)).max(20)` (default `[]`)
  - `status` `z.enum(['draft','published'])`
  - NOTE: `id`, `publishedAt`, `readingTime` are server-managed — NOT accepted from the
    client body (omit from schema so they can't be injected). `postUpdateSchema =
    postInsertSchema.partial()`.
- `backend/src/posts/post.repository.ts` — factory `createPostRepository(db?)` exposing:
  - `findAllPublished()` -> generic `findByFieldOrdered('status','published','publishedAt','desc')`
    (published-only, ordered by `publishedAt` desc — D7). See generic addition below.
  - `findAll()` -> all statuses for admin `/all` (ordered by `publishedAt` desc, drafts
    last/with nulls — acceptable; admin just needs the rows).
  - `findById(id)`, `findBySlug(slug)`, `save`, `update`, `remove`.
- `backend/src/shared/firestore.repository.ts` — add two generic methods:
  - `findById(id): Promise<T | null>` (doc get).
  - `findByField(field, value): Promise<T[]>` and/or
    `findByFieldOrdered(field, value, orderField, dir)` (a `.where(field,'==',value)
    .orderBy(orderField, dir)` query) — used by published-only ordered read.
  - Keep existing methods unchanged.
- `backend/src/posts/post.service.ts` — `createPostService(repo)`:
  - `getPublished()` -> `repo.findAllPublished()`.
  - `getAllAdmin()` -> `repo.findAll()`.
  - `insert(data)`:
    - reject if `findBySlug(slug)` already exists -> throw `Object.assign(new Error('Slug already in use'), { status: 409 })`.
    - derive `readingTime = ceil(words/200)` via a new `backend/src/utils/readingTime.util.ts`.
    - set `publishedAt = new Date().toISOString()` iff `status === 'published'`, else leave unset.
    - `repo.save({ ...data, readingTime, publishedAt? })` (id is set in controller).
  - `update(id, data)`:
    - load current via `repo.findById(id)`; if null -> return null (controller -> 404).
    - if `data.slug` present and differs: `findBySlug` -> if found and `found.id !== id`
      -> throw 409.
    - if `data.content` present: re-derive `readingTime`.
    - `publishedAt`: if resulting status is `published` AND current `publishedAt` is unset
      -> set now; never clear on unpublish (D7).
    - `repo.update(id, patch)`.
  - `deleteById(id)` -> `repo.remove(id)`.
- `backend/src/posts/post.controller.ts` — mirror projects controller; `getAll`
  (public published), `getAllAdmin`, `insert` (sets `id: randomUUID()` — D2), `update`,
  `remove`. 409/404 surface via `next(err)` (error middleware honors `err.status`).
- `backend/src/posts/post.routes.ts` — composition root + routes, order matters:
  - `GET  /`        -> `controller.getAll`   (public, published-only)
  - `GET  /all`     -> `authMiddleware, controller.getAllAdmin`  (literal, before `/:id`-style)
  - `POST /`        -> `authMiddleware, validate(postInsertSchema), controller.insert`
  - `PATCH /:id`    -> `validateId, authMiddleware, validate(postUpdateSchema), controller.update`
  - `DELETE /:id`   -> `validateId, authMiddleware, controller.remove`
- `backend/src/routes/index.ts` — `import postRoutes` + `router.use('/posts', postRoutes)`.
- `backend/src/utils/readingTime.util.ts` — `readingTime(content: string): number`
  (`Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / 200))`).

**Acceptance criteria.**
1. `POST /api/posts` (authed) creates a post: id is a uuid, `readingTime` derived,
   `publishedAt` set only when `status==='published'`.
2. Creating a second post with an existing slug returns 409 (not a silent overwrite).
3. `GET /api/posts` returns ONLY `published` posts, ordered by `publishedAt` desc; never
   returns drafts.
4. `GET /api/posts/all` requires auth (401/403 without a valid token/key) and returns all
   statuses.
5. `PATCH` flipping draft->published sets `publishedAt` once; a later edit does not move it;
   flipping back to draft does NOT clear it.
6. `PATCH` changing `content` re-derives `readingTime`; changing `slug` to one used by a
   different post returns 409; changing to its own slug is allowed.
7. Client-supplied `id`/`publishedAt`/`readingTime` in the body are ignored (not persisted).

**Scoped tests** (`backend/tests/blog/`):
- `post.service.test.ts` (repo mocked) — reading-time math; publishedAt set-on-first-publish
  + never-cleared; slug-uniqueness reject on insert and on update (and self-slug allowed);
  readingTime re-derive on content change; id/publishedAt/readingTime not taken from body.
  Run: `npx vitest run tests/blog`.
- Emulator slice (run as a whole, local gate): add
  `backend/tests/blog/post.repository.emulator.test.ts` — `findBySlug` finds/does-not-find;
  `findAllPublished` returns published-only ordered by `publishedAt` desc; `findById`.
  Add `backend/tests/blog/post.endpoint.emulator.test.ts` — auth gate on `POST /api/posts`
  + `GET /api/posts/all`; public `GET /api/posts` excludes a draft; one CRUD round-trip.
  Keep total writes under the 10/min write limiter. Run: `cd backend; npm run test:emulator`.

---

## BLOG-2 — Backend `POST /api/rebuild` shared endpoint + env (D3)

**Status: DONE — commit `026cf15`.**

**Scope.** A shared, domain-agnostic authed endpoint that proxies a GitHub
`workflow_dispatch` on the existing `frontend-deploy.yml` (ref `main`). NOT under
`/posts` (S5 daily-log reuses it). Uses Node global `fetch` (no new dependency).

**Files to touch.**
- `backend/src/config/env.ts` — add:
  - `githubDispatchToken: process.env.GITHUB_DISPATCH_TOKEN`
  - `githubRepo: process.env.GITHUB_REPO` (e.g. `bwbayu/personal-website`)
  - `githubWorkflowFile: process.env.GITHUB_WORKFLOW_FILE ?? 'frontend-deploy.yml'`
  - `githubWorkflowRef: process.env.GITHUB_WORKFLOW_REF ?? 'main'`
  - (Do NOT add a hard production throw for these unless the user wants rebuild mandatory;
    instead the endpoint returns 503 'Rebuild not configured' if token/repo missing — see AC.)
- `backend/.env.example` — document the four new vars.
- `backend/src/rebuild/rebuild.controller.ts` — `trigger`: if token/repo unset -> 503;
  else `POST https://api.github.com/repos/{repo}/actions/workflows/{file}/dispatches`
  with headers `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`,
  `X-GitHub-Api-Version: 2022-11-28`, body `{ ref }`. GitHub returns 204 on success ->
  respond `sendSuccess(res, null, 202)`. On non-204 -> `next(Object.assign(new Error('GitHub dispatch failed'), { status: 502 }))`.
- `backend/src/rebuild/rebuild.routes.ts` — `router.post('/', authMiddleware, controller.trigger)`.
- `backend/src/routes/index.ts` — `router.use('/rebuild', rebuildRoutes)`.

**Acceptance criteria.**
1. `POST /api/rebuild` requires auth (401/403 without token/key).
2. With config set + GitHub returning 204 -> 202 `{ success: true }`; calls the correct
   GitHub URL with `ref: main`.
3. Missing `GITHUB_DISPATCH_TOKEN`/`GITHUB_REPO` -> 503 with a clear message (no crash).
4. GitHub non-204 -> 502.
5. The browser never sees the token (it lives only in BE config).

**Scoped tests** (`backend/tests/blog/`):
- `rebuild.controller.test.ts` — stub global `fetch` (`vi.stubGlobal('fetch', ...)`):
  204 -> 202 + asserts URL/headers/body; non-204 -> 502; unset config -> 503. Run:
  `npx vitest run tests/blog`.
- (No emulator test — endpoint does not touch Firestore.)

---

## BLOG-3 — Admin scaffold: `markdown` + `select` field widgets + types (D10)

**Status: DONE — commit `ea2c190`.** CSS path = `@uiw/react-md-editor/markdown-editor.css`
(v4.1.1).

**Scope.** Extend the config-driven field-type registry with a `markdown` widget
(`@uiw/react-md-editor`, client-only dynamic import per D1) and a generic `select` widget
(enum options, for `status`). No posts config yet (lands in BLOG-4) — this ticket adds the
reusable widgets + type plumbing, verified by typecheck.

**Files to touch.**
- `frontend/package.json` — add dependency `@uiw/react-md-editor` (admin editor only).
  Run `npm install` in `frontend/`.
- `frontend/lib/admin/config.ts`:
  - extend `FieldType` union with `'markdown' | 'select'`.
  - extend `FieldConfig` with optional `options?: { value: string; label: string }[]`
    (used by `select`).
- `frontend/components/admin/inputs/MarkdownInput.tsx` — `"use client"`; `dynamic(() =>
  import('@uiw/react-md-editor'), { ssr: false })`; controlled (`value`/`onChange`),
  dark theme via wrapper `data-color-mode="dark"`. Import the editor CSS
  (`@uiw/react-md-editor/markdown-editor.css` — or the package's documented CSS path;
  verify at implement time).
- `frontend/components/admin/inputs/SelectInput.tsx` — `"use client"`; native `<select>`
  styled with `baseInput`, options from `field.options ?? []`.
- `frontend/components/admin/inputs/index.tsx` — register `markdown: MarkdownInput`,
  `select: SelectInput` in `fieldInputRegistry`.
- `frontend/components/admin/DomainFormPage.tsx` — `defaultForType`: `markdown` -> `""`,
  `select` -> first option value or `""` (so a new post defaults to a valid status, e.g.
  `'draft'`). Confirm `buildPayload` keeps non-empty strings (it does).

**Acceptance criteria.**
1. `npm run typecheck` passes with the new field types + widgets.
2. The markdown editor is dynamically imported (`ssr: false`) so it never runs during the
   static export build.
3. `select` renders the configured options and stores the selected `value` string.
4. Unknown field types still fall back to `PlaceholderInput` (regression check).

**Scoped tests.** Frontend = typecheck only: `cd frontend; npm run typecheck`.

---

## BLOG-4 — Admin posts integration: authed `/all` read + posts config + Blog nav (D4, D10)

**Status: DONE — commit `1e7ebb7`.** Read helpers live in `frontend/lib/admin/read.ts`
(`adminReadPath` + `adminReadList<T>`), not `config.ts`, to keep config pure data.

**Scope.** Wire posts into the admin scaffold. Posts is the FIRST domain whose admin read
needs auth and whose read path differs from its write path, so this ticket adds: an
`adminListPath` override on `DomainConfig`, an authed list fetcher, and a small read-path
key refactor so list/edit/create/delete/dashboard all agree on one cache key.

**Files to touch.**
- `frontend/lib/admin/config.ts`:
  - add `adminListPath?: string` and `adminAuthRead?: boolean` to `DomainConfig`.
  - add the `posts` `DomainConfig` (sidebar order: end, or under a new Blog group):
    - `slug:'posts'`, `label:'Posts'`, `apiPath:'/api/posts'`,
      `adminListPath:'/api/posts/all'`, `adminAuthRead:true`, `idKind:'uuid'`.
    - `columns`: `title`, `status`, `publishedAt`.
    - `fields`: `title` (text, required), `slug` (text, required),
      `excerpt` (textarea), `cover` (url), `content` (markdown, required),
      `tags` (string-array), `status` (select, required,
      options `[{value:'draft',label:'Draft'},{value:'published',label:'Published'}]`).
  - add a `Blog` nav group to `navGroups`: `{ label: 'Blog', slugs: ['posts'] }`
    (keeps the exhaustiveness invariant satisfied).
- `frontend/lib/admin/api.ts` — add `listDomainAuthed<T>(apiPath)` using `authedFetch`
  (mirrors `listDomain` but attaches the Firebase token), for `adminAuthRead` domains.
- New helper (in `config.ts` or a small `lib/admin/read.ts`):
  `adminReadPath(config) = config.adminListPath ?? config.apiPath` and
  `adminReadFn(config) = config.adminAuthRead ? listDomainAuthed : listDomain`.
- `frontend/components/admin/DomainListClient.tsx`,
  `frontend/components/admin/DomainFormPage.tsx` (EditForm + CreateForm invalidate),
  `frontend/components/admin/DashboardClient.tsx`:
  - replace `adminKeys.domain(config.apiPath)` with `adminKeys.domain(adminReadPath(config))`
    EVERYWHERE (read queryKey + every `invalidateQueries`) so writes to `/api/posts`
    still refresh the `/api/posts/all` cache entry.
  - replace `listDomain(config.apiPath)` reads with `adminReadFn(config)(adminReadPath(config))`.
  - Writes (create/update/delete/reorder) still target `config.apiPath` (unchanged).
- Verify the non-posts domains are unaffected: for them `adminReadPath===apiPath` and
  `adminReadFn===listDomain`, so behaviour is identical (key string unchanged).

**Acceptance criteria.**
1. Admin Posts list loads via `GET /api/posts/all` WITH a Firebase token (drafts visible).
2. Creating/editing/deleting a post invalidates and refreshes the same list cache entry.
3. The dashboard Posts count uses the same authed `/all` read (one fetch shared).
4. All existing domains behave exactly as before (key strings unchanged; public read).
5. A `Blog > Posts` section appears in the admin sidebar; `navGroups` exhaustiveness
   invariant still passes (no throw at import).
6. `cd frontend; npm run typecheck` passes.

**Scoped tests.** Typecheck only. Manually note in the commit that the authed-read path
can't be exercised headless (needs a signed-in admin).

---

## BLOG-5 — Public `/blog` + `/blog/[slug]` pages + markdown render + navbar link (D5, D11, D12)

**Status: DONE — commit `064a777`.** Verified with a real static-export build against
an emulator-backed backend (1 published + 1 draft): `/blog` + `/blog/hello-markdown`
emitted, draft excluded; rendered HTML had highlighted code, a GFM table, `<del>`;
`<script>`/`onerror` stripped by rehype-sanitize; per-post OG image = cover; force-cache
shared one fetch (a mid-build PATCH was only seen after clearing `.next`). Deps:
react-markdown 10, remark-gfm 4, rehype-sanitize 6, rehype-highlight 7, highlight.js 11.

**Scope.** The SEO departure: build-time server-rendered blog. One force-cached build
fetch of the published list, reused by `generateStaticParams`, the `/blog` list, and each
`/blog/[slug]` (find-by-slug in memory). `dynamicParams = false`. Markdown rendered at
build via the react-markdown family.

**Files to touch.**
- `frontend/package.json` — add `react-markdown`, `remark-gfm`, `rehype-sanitize`,
  `rehype-highlight`, `highlight.js` (for the code theme CSS). `npm install`.
- `frontend/lib/blog/posts.ts` — build fetcher:
  `getPublishedPosts(): Promise<Post[]>` fetching `${NEXT_PUBLIC_API_URL}/api/posts`
  with `cache: 'force-cache'` (D11 — dedups across the three build consumers; NOT
  `no-store`). Unwrap the `{ data }` envelope. Empty/zero published -> returns `[]`
  (build must still succeed). Add a `Post` FE type here (mirrors the BE shape).
- `frontend/components/blog/PostContent.tsx` — server component; renders markdown via
  `ReactMarkdown` with `remarkPlugins=[remarkGfm]`,
  `rehypePlugins=[rehypeSanitize, rehypeHighlight]` (D5). Import a highlight.js theme CSS
  (e.g. `highlight.js/styles/github-dark.css`) once (here or in the post page).
- `frontend/components/blog/BlogListClient.tsx` — `"use client"`; receives the published
  list as a prop; renders cards (cover, title, excerpt-or-derived, tags, reading time,
  date) + the client-side tag filter (D9). Excerpt fallback = first ~160 chars of
  markdown-stripped content (D12) via a small `excerptOf(post)` helper in `lib/blog/posts.ts`.
- `frontend/app/(public)/blog/page.tsx` — server component; `await getPublishedPosts()`;
  passes data to `BlogListClient`; renders an empty state when zero published; static
  `export const metadata` (title/description for the list page).
- `frontend/app/(public)/blog/[slug]/page.tsx` — server component:
  - `export async function generateStaticParams()` -> slugs from `getPublishedPosts()`.
  - `export const dynamicParams = false;` (unknown/draft slugs 404 — D11).
  - `generateMetadata({ params })` -> per-post title, description (excerpt or fallback),
    `openGraph`/`twitter` with `images: [cover]` (D8) when present.
  - body: find the post by slug in the fetched list; render header (title, date, reading
    time, tags) + `<PostContent content={post.content} />`.
- `frontend/components/CustomNavbar/NavbarClient.tsx` — add a `Blog` `NavbarLink`
  (`href="/blog"`) alongside Resume/Project (D11).

**Acceptance criteria.**
1. `npm run build` (static export) emits `/blog` and one HTML file per published post; a
   draft slug produces NO page and `/blog/<draft>` 404s.
2. Post HTML contains the rendered markdown in the static output (SEO/OG goal): code blocks
   highlighted, GFM tables/strikethrough/task-lists work, output is sanitized.
3. `/blog` renders cards with reading time + tags + excerpt (or 160-char fallback) and a
   working tag filter; zero published posts -> clean empty state, build still succeeds.
4. Each post page exposes per-post `<title>`/description + OG/Twitter with the cover as the
   OG image when set.
5. The build performs a SINGLE fetch of the published list (force-cache dedups the three
   consumers).
6. `Blog` link appears in the public navbar.

**Scoped tests.** Typecheck + a real build:
`cd frontend; npm run typecheck` then `npm run build` (requires `NEXT_PUBLIC_API_URL`
pointing at a running backend with at least one published + one draft post; if the agent
sandbox can't reach a backend, STOP and have the operator run the build).

---

## BLOG-6 — Site-wide SEO plumbing: metadataBase, default OG, sitemap, robots (FULL scope)

**Scope.** The shared SEO foundation the blog forces (and S6 will build on). Per the
resolved FULL-scope decision.

**Files to touch.**
- `frontend/app/layout.tsx` — root metadata:
  - `metadataBase: new URL(<site URL>)` — source the canonical site URL from an env var
    (e.g. `NEXT_PUBLIC_SITE_URL`, with a sensible production default); document it.
  - default `openGraph`/`twitter` (site name, default title/description, default OG image).
- `frontend/public/og-default.<png|jpg>` — a default OG image asset (referenced by the
  root metadata as the fallback when a page/post has no cover).
- `frontend/app/sitemap.ts` — Next `MetadataRoute.Sitemap`; lists the static public routes
  (`/`, `/project`, `/resume`, `/blog`) + one entry per published post
  (`/blog/<slug>`, `lastModified` = `publishedAt`) using `getPublishedPosts()` (reuses the
  BLOG-5 build fetcher; force-cache means no extra network call). Generated at build into
  the static export.
- `frontend/app/robots.ts` — Next `MetadataRoute.Robots`; allow all, point `sitemap` at
  `<metadataBase>/sitemap.xml`.
- `frontend/.env` docs / `frontend` env example (if present) — document `NEXT_PUBLIC_SITE_URL`.
- CI: `.github/workflows/frontend-deploy.yml` — add `NEXT_PUBLIC_SITE_URL` to the build
  `env:` block (so the deployed metadataBase/sitemap use the real domain). Flag to the user
  that the corresponding GitHub secret must be set.

**Acceptance criteria.**
1. Build emits `sitemap.xml` listing the static routes + every published post URL; drafts
   excluded.
2. Build emits `robots.txt` allowing crawl + referencing the sitemap absolute URL.
3. Root layout sets `metadataBase` so per-post relative/OG URLs resolve to absolute; a
   default OG image is served when a page has none.
4. Zero published posts -> sitemap still lists the static routes; build succeeds.
5. `npm run typecheck` + `npm run build` pass.

**Scoped tests.** Typecheck + build (same backend requirement as BLOG-5). Inspect the
emitted `out/sitemap.xml` + `out/robots.txt`.

---

## BLOG-7 — Admin Rebuild button (dashboard + Blog list header) (D3)

**Scope.** A reusable "Rebuild site" button calling `POST /api/rebuild` via `authedFetch`,
placed on the admin dashboard and at the top of the Blog (posts) list view. Manual only
(no auto-fire on publish — D3).

**Files to touch.**
- `frontend/lib/admin/api.ts` — add `triggerRebuild(): Promise<void>` (`authedFetch` POST
  to `/api/rebuild`, unwrap envelope, throw `ApiError` on non-OK — surfaces 503 'not
  configured' / 502 'dispatch failed' text).
- `frontend/components/admin/RebuildButton.tsx` — `"use client"`; button with
  pending/disabled state; on success show the existing admin toast ("Rebuild started");
  on error show the message (reuse the list/form error banner style). Confirm-modal optional
  (reuse the Flowbite confirm pattern) — recommend a lightweight confirm to avoid accidental
  rebuild storms (edge case in DISCUSSION §4).
- `frontend/components/admin/DashboardClient.tsx` — render `<RebuildButton />` in the header.
- `frontend/components/admin/DomainListClient.tsx` — render `<RebuildButton />` in the list
  header for the `posts` domain only (e.g. when `config.slug === 'posts'`), next to "New".

**Acceptance criteria.**
1. Clicking Rebuild calls `POST /api/rebuild` with a Firebase token; success -> toast.
2. A 503 ('not configured') / 502 ('dispatch failed') surfaces the backend message, not a
   crash; button returns to idle.
3. Button shows a pending state and is disabled while in flight (no double-fire).
4. The button appears on the dashboard and the Blog list header only.
5. `cd frontend; npm run typecheck` passes.

**Scoped tests.** Typecheck only (authed action can't be exercised headless — note in commit).

---

## Cross-cutting notes
- **Emulator gate.** BLOG-1 touches Firestore (new repo methods + queries) -> run
  `cd backend; npm run test:emulator` locally before committing BLOG-1 (needs Java/Temurin
  21). The published-only ordered query may require a composite index in prod
  (`status ==` + `orderBy publishedAt`) — verify against the emulator and note any index in
  the commit / for the deploy.
- **No planning files in code commits.** PLAN/REVIEW updates commit separately (CLAUDE.md).
- **Secrets.** `GITHUB_DISPATCH_TOKEN` (fine-grained PAT, `actions: write`) goes in
  `backend/.env` locally + Cloud Run env in prod; never committed. `NEXT_PUBLIC_SITE_URL`
  is a build-time FE var (CI secret).
- **Branching.** All tickets on `feat/blog` from `develop`; one commit per ticket; PR into
  `develop` opened by the user after the review loop closes.

---

## Handoff
```
/wf-implement blog
```
