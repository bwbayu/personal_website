# Daily Log (S5) — Implementation Plan

> Execution contract for the `daily-log` feature. Honors the LOCKED decisions DL1–DL9
> in [DISCUSSION.md](DISCUSSION.md); do not relitigate them. Three tickets, one commit
> each, sequenced backend → frontend-admin → frontend-public. Branch: `feat/daily-log`
> cut from `develop`.

## 0. Design verification (drift check) — PASS

Opened every file the discussion cites; shapes + line refs still match. No drift.

- Backend per-domain template = posts ([backend/src/posts/](../../backend/src/posts/)):
  factory DI (`createPostRepository(db?) -> createPostService -> createPostController`),
  registered in [routes/index.ts:31](../../backend/src/routes/index.ts#L31). Confirmed.
- `safeDate` (YYYY-MM-DD) + `safeUrl` in
  [schema.util.ts](../../backend/src/utils/schema.util.ts). Confirmed.
- `FirestoreRepository.findAllOrdered(field, direction)`
  ([firestore.repository.ts:12](../../backend/src/shared/firestore.repository.ts#L12)) —
  exactly what DL8's `findAllOrdered('date','desc')` needs. Confirmed.
- Vitest split: base config excludes `*.emulator.test.ts`
  ([vitest.config.ts:10](../../backend/vitest.config.ts#L10)); emulator config globs
  `tests/**/*.emulator.test.ts` ([vitest.emulator.config.ts:9](../../backend/vitest.emulator.config.ts#L9)).
  So `npx vitest run tests/daily-log` runs ONLY the unit files; the emulator files run
  as a whole via `npm run test:emulator`. Confirmed.
- Admin scaffold: `registry` + `navGroups` with a module-load invariant that every
  registry slug is in exactly one nav group
  ([config.ts:258-273](../../frontend/lib/admin/config.ts#L258-L273)). `formatCell`
  renders arrays as `join(", ")` so a `tags` column works
  ([DomainListClient.tsx:63-68](../../frontend/components/admin/DomainListClient.tsx#L63-L68)).
  `adminReadList` falls back to the public `listDomain` when `adminAuthRead` is unset
  ([read.ts:13-16](../../frontend/lib/admin/read.ts#L13-L16)) — matches DL4 (admin reads
  the same public route). Confirmed.
- **One scaffold gap (not drift):** `defaultForType` returns `""` for `date`
  ([DomainFormPage.tsx:25-42](../../frontend/components/admin/DomainFormPage.tsx#L25-L42));
  there is no "default to today". DL8 needs the admin form pre-filled with today. Plan
  adds a minimal opt-in `defaultToday?: boolean` field flag (DAILY-LOG-2). It must be
  opt-in so the existing `date` fields (projects/experiences/etc.) keep defaulting blank.
- `PostContent` is a server component ([PostContent.tsx](../../frontend/components/blog/PostContent.tsx)) —
  reusable for the DL9 build-time render. `(public)` layout wraps navbar/footer
  ([layout.tsx](../../frontend/app/(public)/layout.tsx)). Navbar links are hardcoded in
  [NavbarClient.tsx:29-37](../../frontend/components/CustomNavbar/NavbarClient.tsx#L29-L37).
  Confirmed.

## 1. Decisions taken in planning (the two items DISCUSSION delegated)

- **Content field widget = reuse the existing `textarea` type** (DISCUSSION's recommended
  option (a); raw markdown typed into a plain textarea). No new field-type variant. The
  PUBLIC render still reuses `PostContent` (DL3/DL9).
- **Nav group = rename the existing "Blog" sidebar group to "Writing"** holding
  `['posts', 'daily-logs']`. More accurate than "Blog" once it contains the Daily Log,
  keeps the every-slug-once invariant satisfied, and is a presentation-only label change
  (DD2 — `registry` stays the source of truth). The public navbar label is "Daily Log"
  (DL6), unaffected.
- **Date-default mechanism = new opt-in `defaultToday?: boolean` on `FieldConfig`**,
  consumed in `defaultForType` (computes today's LOCAL date as `YYYY-MM-DD`). Backdating
  stays allowed (the field is editable). Existing date fields are untouched.

None of these contradict a locked decision; recording them here so review can check them.

---

## DAILY-LOG-1 — Backend `daily-logs` domain

**Scope.** A thin new per-domain module mirroring posts, minus everything posts derives
(no slug, no status/drafts, no `/all`, no `publishedAt`, no reading time). Implements the
shape + endpoints in DISCUSSION §3.1.

**Files to create** (`backend/src/dailyLogs/`):
- `dailyLog.type.ts` — `interface DailyLog { id: string; date: string; content: string; tags: string[] }`.
- `dailyLog.schema.ts` — mirror [post.schema.ts](../../backend/src/posts/post.schema.ts):
  - `dailyLogBase = z.object({ date: safeDate, content: z.string().min(1).max(5000), tags: z.array(z.string().min(1).max(50)).max(20) })`.
  - `dailyLogInsertSchema = dailyLogBase.extend({ tags: dailyLogBase.shape.tags.default([]) })`
    (default lives ONLY on insert, per the posts comment — so a PATCH omitting tags can't wipe them).
  - `dailyLogUpdateSchema = dailyLogBase.partial()`.
  - `id` is never in the schema -> Zod strips it from the body (server-set).
- `dailyLog.repository.ts` — `createDailyLogRepository(db?)` over `FirestoreRepository<DailyLog>('dailyLogs', db)`, exposing ONLY generic methods: `findAllOrdered: () => repo.findAllOrdered('date','desc')`, `findById`, `save`, `update`, `remove`. No `findBySlug`, no in-memory sort (every doc has `date`, DL8).
- `dailyLog.service.ts` — `createDailyLogService(repo)`:
  - `getAll: () => repo.findAllOrdered()`.
  - `insert: (data: DailyLogInsert) => repo.save(data)` where `DailyLogInsert = DailyLog` (controller supplies `id`); no derived fields.
  - `update: async (id, data: DailyLogUpdate) => (await repo.findById(id)) ? repo.update(id, data) : null` with `DailyLogUpdate = Partial<Omit<DailyLog,'id'>>`.
  - `deleteById: (id) => repo.remove(id)`.
- `dailyLog.controller.ts` — mirror [post.controller.ts](../../backend/src/posts/post.controller.ts): `getAll` (public), `insert` (`{ ...req.body, id: randomUUID() }`, 201), `update` (404 `'Daily log not found'` when null), `remove` (404 when false).
- `dailyLog.routes.ts` — composition root + routes, NO `/all`:
  ```
  router.get('/', controller.getAll);
  router.post('/', authMiddleware, validate(dailyLogInsertSchema), controller.insert);
  router.patch('/:id', validateId, authMiddleware, validate(dailyLogUpdateSchema), controller.update);
  router.delete('/:id', validateId, authMiddleware, controller.remove);
  ```

**Files to edit:**
- [backend/src/routes/index.ts](../../backend/src/routes/index.ts) — import `dailyLogRoutes` and `router.use('/daily-logs', dailyLogRoutes)` (place after `/posts`, before `/rebuild`).

**Acceptance criteria:**
1. `GET /api/daily-logs` is public and returns ALL entries ordered by `date` desc.
2. `POST/PATCH/DELETE` are auth-gated; per-route order `validateId -> authMiddleware -> validate -> controller` (DELETE has no body validate).
3. `POST` sets `id` server-side via `randomUUID()`; a client-supplied `id` in the body is ignored/stripped.
4. Insert defaults `tags` to `[]` when omitted; a PATCH that omits `tags` does NOT introduce/clear `tags` (no-wipe).
5. `date` must pass `safeDate` (YYYY-MM-DD, real calendar date); bad dates 400. `content` required, 1–5000 chars.
6. `PATCH`/`DELETE` on a missing id return 404; `PATCH` returns the updated doc; `DELETE` returns success on a real delete.
7. No `/api/daily-logs/all` route exists.

**Scoped tests** (`backend/tests/daily-log/`):
- `dailyLog.schema.test.ts` (unit) — mirror [post.schema.test.ts](../../backend/tests/blog/post.schema.test.ts):
  insert defaults tags to `[]` when omitted; strips a client-supplied `id`; rejects a bad
  `date` (e.g. `2026-13-40`, `not-a-date`) and accepts a valid one; rejects empty content and
  content over 5000 chars; update is partial (empty `{}` parses); **update omitting tags has
  no `tags` key** (the no-wipe guarantee, AC4); update strips `id`.
- `dailyLog.service.test.ts` (unit, fake repo via DI) — mirror [post.service.test.ts](../../backend/tests/blog/post.service.test.ts):
  `getAll` calls `repo.findAllOrdered` once; `insert` calls `repo.save` with the passed data
  including the controller-set `id`; `update` returns `null` and does NOT call `repo.update`
  when `findById` is null, else passes the patch straight through; `deleteById` returns the
  boolean from `repo.remove`.
- `dailyLog.repository.emulator.test.ts` (emulator slice) — mirror [post.repository.emulator.test.ts](../../backend/tests/blog/post.repository.emulator.test.ts):
  `findAllOrdered('date','desc')` returns entries newest-date-first across multiple dates;
  `save`/`findById`/`remove` round-trip; multiple entries on the SAME date all returned (DL2).
- `dailyLog.endpoint.emulator.test.ts` (emulator slice) — lean smoke mirroring [post.endpoint.emulator.test.ts](../../backend/tests/blog/post.endpoint.emulator.test.ts),
  kept WELL under the 10-writes/min limiter (≤6 writes): auth gate (`POST` 401 without key,
  403 with wrong key); public `GET` returns entries date-desc; one CRUD round-trip
  (POST 201 with uuid id -> PATCH content -> DELETE -> gone); a `POST` with a bad `date` is 400.

**Test commands:**
```
cd backend
npx vitest run tests/daily-log          # unit bucket (schema + service)
npm run test:emulator                   # whole emulator slice (LOCAL gate; needs Java/Temurin 21)
```
> The emulator slice runs as one set (not scoped). Run it before committing this ticket
> because it touches a Firestore-backed repository + endpoints. If the sandbox lacks Java,
> STOP and have the operator run it.

---

## DAILY-LOG-2 — Frontend admin: register the `daily-logs` domain

**Scope.** Wire the new domain into the config-driven admin scaffold + add the opt-in
date-default. Depends on DAILY-LOG-1 (the API).

**Files to edit** (`frontend/`):
- [lib/admin/config.ts](../../frontend/lib/admin/config.ts):
  1. Add `defaultToday?: boolean;` to `FieldConfig` (with a one-line comment: only meaningful for `date` fields).
  2. Append a `daily-logs` entry to `registry`:
     ```
     {
       slug: 'daily-logs',
       label: 'Daily Log',
       apiPath: '/api/daily-logs',
       idKind: 'uuid',
       columns: [ { key: 'date', label: 'Date' }, { key: 'tags', label: 'Tags' } ],
       fields: [
         { key: 'date', label: 'Date', type: 'date', required: true, defaultToday: true },
         { key: 'content', label: 'Content', type: 'textarea', required: true },
         { key: 'tags', label: 'Tags', type: 'string-array' },
       ],
     }
     ```
     No `adminListPath`/`adminAuthRead` (DL4 — admin reads the same public route).
  3. Rename the `navGroups` "Blog" entry to `{ label: 'Writing', slugs: ['posts', 'daily-logs'] }`.
- [components/admin/DomainFormPage.tsx](../../frontend/components/admin/DomainFormPage.tsx):
  in `defaultForType`, add a `date` case returning today's LOCAL `YYYY-MM-DD` when
  `field.defaultToday`, else `""`. Build the date string manually (pad month/day) so it
  always matches `safeDate`; do not rely on locale formatting.
- [components/admin/DomainListClient.tsx](../../frontend/components/admin/DomainListClient.tsx):
  broaden the list-level Rebuild button gate from `config.slug === "posts"` to also include
  `"daily-logs"` (parity — both are publish-then-rebuild domains; the dashboard already has a global one).

**Acceptance criteria:**
1. `daily-logs` shows on the admin dashboard + sidebar under a "Writing" group; the module-load `navGroups` invariant still passes (every slug grouped exactly once).
2. The new-entry form pre-fills `date` with today and is editable; create/edit/delete go through `/api/daily-logs`; the list shows `date` + `tags` columns (tags joined by commas).
3. Existing `date` fields (projects, experiences, educations, certifications, achievements) still default to blank (no `defaultToday`).
4. The Rebuild button appears on the daily-logs admin list.
5. `tsc --noEmit` clean.

**Scoped tests:** frontend is typecheck-only.
```
cd frontend
npm run typecheck
```
> Manual (running stack, optional): create an entry in `/admin/daily-logs`, confirm it
> lists + edits; FE behavior not exercisable headless.

---

## DAILY-LOG-3 — Frontend public `/daily` timeline feed

**Scope.** The single static timeline page (DL1) rendering all entries' markdown at build
(DL9). Depends on DAILY-LOG-1 (the API). Mirrors the blog list split (server fetch + render
-> thin client filter), but with NO per-entry route and markdown rendered server-side per
entry rather than linking to a `[slug]` page.

**Files to create** (`frontend/`):
- `lib/daily/logs.ts` — mirror [lib/blog/posts.ts](../../frontend/lib/blog/posts.ts):
  - `interface DailyLog { id: string; date: string; content: string; tags: string[] }`.
  - `getDailyLogs(): Promise<DailyLog[]>` — `fetch(`${base}/api/daily-logs`, { cache: 'force-cache' })`, throw on non-OK, return `json.data ?? []` (zero entries is valid).
  - a small `formatDate(date: string)` for `YYYY-MM-DD` (UTC-safe, deterministic across build hosts — same approach as blog's `formatDate`). Keep it local to this module so daily doesn't import from blog.
- `app/(public)/daily/page.tsx` — server component (mirror [blog/page.tsx](../../frontend/app/(public)/blog/page.tsx)):
  - `metadata` (title "Daily Log | Bayu Wicaksono", description).
  - `await getDailyLogs()`, map to `entries = logs.map(l => ({ id: l.id, date: l.date, tags: l.tags, content: <PostContent content={l.content} /> }))` (markdown rendered HERE, at build, server-side).
  - render `<DailyLogFeedClient entries={entries} />`.
- `components/daily/DailyLogFeedClient.tsx` — `"use client"`, mirror the filter shell of
  [BlogListClient.tsx](../../frontend/components/blog/BlogListClient.tsx):
  - props `{ entries: { id: string; date: string; tags: string[]; content: React.ReactNode }[] }`.
  - derive the sorted unique tag set; `activeTag` state; "All" + per-tag filter buttons (reuse the blog button styling).
  - render a timeline: for each visible entry, a date heading (via the passed pre-formatted date OR format in the server page and pass a `dateLabel` string — see note), its tags as chips, and `{entry.content}` (the pre-rendered markdown node). It renders the node only; `react-markdown` stays OUT of the client bundle (DL9).
  - empty state when `entries.length === 0` ("No entries yet. Check back soon.").
  > Note: since the client component shouldn't re-derive date formatting, format the date in
  > the SERVER page and pass it as a `dateLabel: string` on each entry (add that field to the
  > entry shape), OR pass raw `date` and format with the local `formatDate`. Implementer's
  > choice; keep the formatter in ONE place.

**Files to edit:**
- [components/CustomNavbar/NavbarClient.tsx](../../frontend/components/CustomNavbar/NavbarClient.tsx):
  add a `<NavbarLink as={Link} href="/daily">Daily Log</NavbarLink>` after the Blog link.

**Acceptance criteria:**
1. `/daily` is a single static page in the `(public)` group (navbar/footer via the group layout) rendering all entries newest-date-first, each entry's markdown rendered at build.
2. Client-side tag filter toggles which entries are visible (DL7); "All" resets.
3. `react-markdown` is not pulled into the client bundle (markdown rendered only in the server `PostContent`).
4. An EMPTY feed builds cleanly and shows the empty state; no per-entry/dynamic route exists (DL1).
5. Navbar shows a "Daily Log" link to `/daily`.
6. `tsc --noEmit` clean.

**Scoped tests:** typecheck is the hard gate.
```
cd frontend
npm run typecheck
npm run build           # static export; verifies /daily renders + the empty-state build
```
> `npm run build` does the build-time fetch, so it needs `NEXT_PUBLIC_API_URL` set to a
> reachable backend (same accepted dependency as blog's `getPublishedPosts`). If no backend
> is reachable locally, treat `typecheck` as the gate and verify the build with the running
> stack; say so explicitly in the ticket commit notes.

---

## Sequencing & dependencies

1. **DAILY-LOG-1** (backend) — no deps; everything else consumes its API.
2. **DAILY-LOG-2** (FE admin) — needs DL-1's endpoints to create/list entries.
3. **DAILY-LOG-3** (FE public) — needs DL-1's `GET /api/daily-logs` at build.

One commit per ticket. Commit subjects (no ticket/doc suffix):
- DL-1: `feat(backend): add daily-logs domain` (body: collection + endpoints + ordered read + tests).
- DL-2: `feat(frontend): register daily-logs admin domain` (body: config entry, Writing nav group, opt-in date default-today, rebuild button parity).
- DL-3: `feat(frontend): add public daily log timeline page` (body: build-time fetch, server markdown render per entry, client tag filter, navbar link).

Record each commit SHA next to its ticket here in PLAN.md as it lands. Branch `feat/daily-log`
off `develop`; never commit to `develop`/`main`. Push only on explicit approval.

## Out of scope (parking lot — DISCUSSION §6)

Per-entry permalink/share pages, RSS/Atom, mood field/analytics, pagination/infinite scroll.

## Commit SHA log

| Ticket | SHA | Status |
|--------|-----|--------|
| DAILY-LOG-1 | eb3cd62 | done |
| DAILY-LOG-2 | _pending_ | not started |
| DAILY-LOG-3 | _pending_ | not started |
