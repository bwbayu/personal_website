# Daily Log (S5, T9 part 2: dailyLogs) — Design Discussion

> Session S5 of the feature roadmap. Builds the daily-log `dailyLogs` feature: a new
> Firestore collection + BE domain, an admin widget for short entries, and a public
> timeline page, statically pre-rendered at build. Reuses the S4 blog foundation
> (rebuild-on-publish webhook, markdown render pipeline, config-driven admin scaffold).
> The roadmap Decisions log
> ([planning/feature-roadmap/DISCUSSION.md](../feature-roadmap/DISCUSSION.md)) and the
> blog Decisions log ([planning/blog/DISCUSSION.md](../blog/DISCUSSION.md)) are LOCKED and
> must not be contradicted.

## 1. Objective

Add a lightweight "daily log" — a stream of short, unscripted entries (a microblog / "now"
feed), distinct from the polished long-form blog. Concretely (roadmap T9 part 2):
- New `dailyLogs` Firestore collection + BE domain (per-domain
  controller/service/repository/routes/schema/type), fields: date, short content, optional
  tags/mood.
- Admin authoring widget wired into the existing config-driven scaffold for creating/editing
  entries.
- Public page: a timeline feed of entries, statically pre-rendered at build (roadmap Option B).
- Reuse the shared rebuild-on-publish webhook (`POST /api/rebuild`) from S4 — no new trigger.

Lighter than S4: the shared foundation already exists; this is mostly a thin new domain plus
one public page.

## 2. Grounding / data flow (verified against code)

### What S4 already built that S5 reuses verbatim
- **Shared rebuild trigger.** `POST /api/rebuild` is domain-agnostic and authed; proxies a
  GitHub `workflow_dispatch` on the frontend-deploy workflow
  ([backend/src/rebuild/rebuild.controller.ts](../../backend/src/rebuild/rebuild.controller.ts),
  [rebuild.routes.ts](../../backend/src/rebuild/rebuild.routes.ts)). The admin "Rebuild site"
  button is already wired to it — daily-log needs ZERO new rebuild plumbing.
- **Markdown render pipeline.** [components/blog/PostContent.tsx](../../frontend/components/blog/PostContent.tsx)
  renders raw markdown at build time (`react-markdown` + `remark-gfm` + `rehype-sanitize` +
  `rehype-highlight`). Reusable if daily-log content is markdown.
- **Config-driven admin scaffold.** A `DomainConfig` in
  [frontend/lib/admin/config.ts](../../frontend/lib/admin/config.ts) declares the domain; one
  shared list + form view consume it. Field-type registry now includes `markdown`, `select`,
  `string-array`, `date`, `text`, `url`, etc. — everything daily-log needs likely already
  exists. `navGroups` must place every registry slug in exactly one sidebar section (enforced
  at module load).
- **Build-time fetch pattern.** [frontend/lib/blog/posts.ts](../../frontend/lib/blog/posts.ts)
  fetches the public list ONCE with `cache: 'force-cache'` for the server-component build; the
  list page is a thin server wrapper passing data to a `"use client"` view
  ([app/(public)/blog/page.tsx](../../frontend/app/(public)/blog/page.tsx) -> `BlogListClient`).
- **Backend per-domain template.** posts domain
  ([backend/src/posts/](../../backend/src/posts/)) is the closest template: factory DI
  (`createPostRepository(db?) -> createPostService -> createPostController`), registered in
  [routes/index.ts](../../backend/src/routes/index.ts:31). `safeDate` (YYYY-MM-DD) +
  `safeUrl` validators in [schema.util.ts](../../backend/src/utils/schema.util.ts).

### Where daily-log DIFFERS from blog (the design surface)
- Blog has per-post dynamic pages (`/blog/[slug]`, `generateStaticParams`, `findBySlug`,
  slug-uniqueness, `dynamicParams=false`). A timeline feed likely needs NONE of that — one
  static page rendering all entries. This is the biggest potential simplification.
- Blog has draft/published status with a separate authed `/api/posts/all` admin route,
  `publishedAt` first-publish semantics, reading time, excerpt, cover/OG. Daily-log is
  "unscripted short content" — most of these probably do not apply.
- Blog content is long-form markdown via a heavy editor (`@uiw/react-md-editor`). Daily-log
  is "short content" — editor + render weight is an open decision.

## 3. Key decisions (ALL LOCKED 2026-06-22)

- **DL1 — Public page model.** LOCKED = **single static timeline page** `/daily`. NO
  per-entry dynamic route. Deletes the entire blog `[slug]` apparatus: no
  `generateStaticParams`, no `findBySlug`, no slug field, no slug-uniqueness, no
  `dynamicParams`. One server-component page renders all entries.
- **DL2 — Doc id + entries-per-day.** LOCKED = **uuid doc id (`randomUUID()`), multiple
  entries per day allowed**. Mirrors the posts domain; `date` is a separate editable field.
- **DL3 — Content format.** LOCKED = **reuse the markdown render pipeline** (D5 /
  `PostContent`) for output; admin editor is a **plain `textarea`** (NOT the heavy
  `@uiw/react-md-editor`). Entries are short, so a textarea is enough, and markdown gives
  links/bold/lists for free at no extra render cost.
- **DL4 — Status / drafts.** LOCKED = **no status; every entry is public**. Public
  `GET /api/daily-logs` returns ALL entries; the admin list reads the SAME route. No
  `/all` route, no `adminAuthRead`/`adminListPath`, no `publishedAt`/first-publish logic.
- **DL5 — Mood field.** LOCKED = **dropped**. No `mood` field. (Roadmap T9 listed mood as
  OPTIONAL; omitting it does not contradict any locked decision — the T9 lock is the
  collection + Option B rendering, not the exact field list.)
- **DL6 — Route name + navbar.** LOCKED = public route `/daily`, navbar + sidebar label
  **"Daily Log"**. Lives in the `(public)` route group but is a server component
  (build-time render, same SEO departure as `/blog`).
- **DL7 — Tags.** LOCKED = **reuse `string[]` (`string-array` widget) + client-side tag
  filter** on the feed, mirroring blog D9 / `BlogListClient`.
- **DL8 — Date semantics.** LOCKED = **user-supplied `date` (YYYY-MM-DD via `safeDate`),
  defaulted to today in the admin form, editable (backdating allowed)**. Feed ordered by
  `date` desc. Every doc has a `date`, so `findAllOrdered('date','desc')` is safe (unlike
  posts' drafts-missing-publishedAt case — no in-memory sort needed).
- **DL9 — Feed render architecture.** LOCKED = render each entry's markdown at BUILD time
  in the server page via the reused `PostContent` server component, then pass the
  pre-rendered entry elements as props into a thin `"use client"` filter wrapper
  (`DailyLogFeedClient`) that only toggles which entries are visible by tag. Keeps
  `react-markdown` OUT of the client bundle and keeps render at build time (consistent
  with D5). Mirrors how the blog splits server render (`PostContent`) from client
  interactivity (`BlogListClient`).

### 3.1 Concrete `dailyLogs` shape + endpoints

Firestore collection `dailyLogs`; API path `/api/daily-logs` (kebab, like
`/api/media-socials`); registered in `routes/index.ts`.

```
DailyLog {
  id: string       // randomUUID (DL2); server-set, never from client body
  date: string     // YYYY-MM-DD, safeDate (DL8); user-supplied, default today
  content: string  // raw markdown (DL3); short, generous max (~5000 chars)
  tags: string[]   // DL7; defaults to [] on insert, not on the update partial
}
```

Endpoints (per-domain pattern; lighter than posts — no /all, no slug, no derived fields):
- `GET    /api/daily-logs`      public; ALL entries, ordered by `date` desc (build + admin list + public).
- `POST   /api/daily-logs`      authed; BE sets `id=randomUUID()`.
- `PATCH  /api/daily-logs/:id`  authed; `validateId` (uuid).
- `DELETE /api/daily-logs/:id`  authed.
- Reuses `POST /api/rebuild` (S4) — no new rebuild plumbing.

Repository: `findAllOrdered('date','desc')`, `save`, `update`, `remove` (generic repo
methods only — no custom `findBySlug`/`findAllPublished`/in-memory sort).

Admin: a `dailyLogs` `DomainConfig` (slug `daily-logs`, idKind `uuid`, no
`adminListPath`/`adminAuthRead`); columns `[date, tags]`; fields `[date (date, default
today), content (markdown→textarea variant), tags (string-array)]`. Add to `navGroups`
under the existing **Blog** section (or a renamed "Writing" section — implementation
detail). Reuse the shared "Rebuild site" button.

> Note on the `markdown` field type: the existing `markdown` widget is the heavy
> `@uiw/react-md-editor` (blog). DL3 wants a plain textarea writing raw markdown. Plan
> decides whether to (a) reuse the existing `textarea` field type as-is (simplest; raw
> markdown typed into a plain textarea — recommended) or (b) add a lightweight markdown
> field variant. Either way the PUBLIC render reuses `PostContent`.

Tests (roadmap S5 = new domain, lighter): unit (service insert sets uuid + defaults tags;
update partial does not wipe tags) + emulator slice (the `date`-desc ordered query). No
slug-uniqueness / publishedAt / reading-time tests (those features don't exist here).

## 4. Edge cases
- Empty feed (zero entries) must build cleanly — `/daily` renders an empty state; no
  dynamic pages exist to break (DL1 removes the blog `EMPTY_FALLBACK_SLUG` problem entirely).
- Markdown XSS: reuse `rehype-sanitize` in `PostContent` even though single-author (DL3/DL9).
- No draft/public split needed — every entry is public (DL4), so no admin-read auth.
- `date` is free-form within `safeDate`; duplicate dates are fine (DL2 allows multiple/day),
  feed just lists them; secondary ordering among same-date entries is unspecified (accept
  Firestore default / id) — not worth a tiebreaker for a personal feed.
- Build-time fetch failure → FE build fails (same accepted risk as blog `getPublishedPosts`).

## 5. Decisions log (the contract)
- 2026-06-22 — Session opened. Grounded against the S4 blog code; roadmap T9 part 2 +
  blog locks carried in. Identified the design surface vs blog (page model, status, content
  format).
- 2026-06-22 — DL1 LOCKED: single static `/daily` timeline page; NO per-entry route
  (deletes generateStaticParams/findBySlug/slug/dynamicParams).
- 2026-06-22 — DL2 LOCKED: uuid doc id, multiple entries per day; `date` is a separate field.
- 2026-06-22 — DL3 LOCKED: reuse markdown render pipeline (`PostContent`); admin editor =
  plain textarea (not `@uiw/react-md-editor`).
- 2026-06-22 — DL4 LOCKED: no status; every entry public; public GET = all, admin reads the
  same route (no `/all`, no `adminAuthRead`, no `publishedAt`).
- 2026-06-22 — DL5 LOCKED: `mood` field dropped (T9 listed it as optional; no lock broken).
- 2026-06-22 — DL6 LOCKED: route `/daily`, label "Daily Log"; server component in `(public)`.
- 2026-06-22 — DL7 LOCKED: tags `string[]` + client-side tag filter (mirrors blog D9).
- 2026-06-22 — DL8 LOCKED: user-supplied `date` (safeDate), default today, editable; feed
  ordered by `date` desc; `findAllOrdered('date','desc')` (no in-memory sort).
- 2026-06-22 — DL9 LOCKED: render markdown at build in the server page (`PostContent`),
  pass pre-rendered entries into a thin client filter wrapper (`react-markdown` stays out of
  the client bundle).
- 2026-06-22 — DESIGN LOCKED by Bayu. Decisions log complete (DL1-DL9). Ready for /wf-plan.

## 6. Parking lot / later
- Per-entry permalink/share pages for daily logs (DL1 = single feed only).
- RSS/Atom for the daily feed.
- Mood field + mood analytics / streak view (dropped in DL5; revisit if wanted).
- Pagination / infinite scroll if the feed grows large (fine as one page at personal scale).
