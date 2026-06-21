# Admin CMS — Data Cache + Backend Fixes (S3.2) — Implementation Plan

Plan for the locked design in [DISCUSSION.md](DISCUSSION.md). Honors decisions
PD1–PD6 and the earlier locked contracts (admin-cms D*, admin-cms-design DD*, auth).
Branch: `feat/admin-cms-perf` cut from `develop`.

## Phase 0 — design verification (done)

Opened every file the discussion cites; shapes/line-refs confirmed, with two drifts:

- **PD5 drift (load-bearing, resolved).** DISCUSSION §2 + PD5 say CLAUDE.md still shows
  the stale "200/15min read, 20/15min write". It does NOT — [CLAUDE.md:81-82](../../CLAUDE.md#L81-L82)
  already reads "read 60 / write 10 per minute" (fixed in the S3.1 batch). The only
  remaining stale *active* reference is the comment in
  [skill.endpoint.emulator.test.ts:11](../../backend/tests/test-harness/skill.endpoint.emulator.test.ts#L11)
  ("20-writes/15-min"); the other hits are frozen historical planning docs.
  **User decision:** re-scope PD5 to the real drift (ACMP-7) — update CLAUDE.md's FE
  data-fetching paragraph to TanStack Query (this feature changes it) and fix that one
  test comment; leave frozen planning docs untouched. No rate-limit number change.
- **Topbar line-ref drift (trivial).** DISCUSSION §2 cites AdminShell.tsx:125-157 for the
  topbar; the actual header (email + Sign out) is now
  [AdminShell.tsx:153-186](../../frontend/components/admin/AdminShell.tsx#L153-L186)
  (125-157 is the mobile drawer). Structure matches; no behavior impact.

Everything else verified current: rate limiters + `Cache-Control` in
[app.ts:27-40](../../backend/app.ts#L27-L40); `cache: 'no-store'` read path in the
public fetchers ([app/api/*](../../frontend/app/api/)) and admin client
([api.ts](../../frontend/lib/admin/api.ts), [authedFetch.ts](../../frontend/lib/authedFetch.ts));
two-PATCH reorder in [DomainListClient.tsx:125-147](../../frontend/components/admin/DomainListClient.tsx#L125-L147);
generic repo has no batch method ([firestore.repository.ts](../../backend/src/shared/firestore.repository.ts));
no `@tanstack/react-query` in [package.json](../../frontend/package.json). The two
reorderable domains are skills + categories (D3), both `idKind: 'slug'`
([config.ts:56-91](../../frontend/lib/admin/config.ts#L56-L91)); skills order is scoped
per `categoryId`, categories share one global order. The 5 `useApi` consumers are all
public: Home, Projects, Resume, NavbarClient, FooterClient (Navbar + Footer both fetch
media-socials — a dedup win). Admin reads do NOT use `useApi` — they call
`listDomain`/`getSingleton` directly inside `useEffect`.

## Decisions honored

| Dec | How |
|-----|-----|
| PD1 | `@tanstack/react-query`; `QueryClientProvider` at the app root; per-endpoint query keys + `staleTime`; auto dedup. `useApi` consumers migrated, then `useApi.ts` deleted. (ACMP-2/3/4) |
| PD2 | Caching scope = public (home/project/resume + shared navbar/footer) **and** admin (list, dashboard counts, edit/singleton loaders). (ACMP-3/4) |
| PD3 | After every successful create/update/delete/reorder, `invalidateQueries` for the affected domain so admin reflects fresh data immediately. (ACMP-4/5) |
| PD4 | Bulk reorder endpoint `PATCH /api/{skills,categories}/reorder` taking `[{id, order}]`, written in one Firestore `batch()` (atomic); validates every id exists. FE `move()` sends ONE request. (ACMP-1/5) |
| PD5 | Re-scoped to real drift (see Phase 0). (ACMP-7) |
| PD6 | "View site" link in the admin topbar -> `/`, same tab. (ACMP-6) |

**QueryClient defaults (user decision):** `staleTime: 5 * 60 * 1000` (matches server
`max-age=300`), `refetchOnWindowFocus: false`, `retry: 1`. Cross-tab staleness is
accepted (single operator); admin freshness comes from explicit invalidation, not focus
refetch. Public fetchers keep `cache: 'no-store'` — TanStack Query is the cache layer,
not the browser HTTP cache.

## Ticket sequence & dependencies

Implement in order. Backend first (FE reorder consumes it); FE infra before FE consumers.

1. **ACMP-1** Backend: atomic bulk reorder endpoint (skills + categories). *(no deps)*
2. **ACMP-2** Frontend: TanStack Query provider + defaults. *(no deps)*
3. **ACMP-3** Frontend: migrate public reads to `useQuery`; delete `useApi`. *(ACMP-2)*
4. **ACMP-4** Frontend: migrate admin reads to `useQuery` + invalidate on create/update/delete. *(ACMP-2; uses the queries module from ACMP-3)*
5. **ACMP-5** Frontend: admin reorder via the bulk endpoint (one request) + invalidate. *(ACMP-1, ACMP-4)*
6. **ACMP-6** Frontend: "View site" link in the admin topbar. *(no deps)*
7. **ACMP-7** Docs: CLAUDE.md FE paragraph -> TanStack Query; fix stale test comment. *(do last)*

---

## ACMP-1 — Backend: atomic bulk reorder endpoint (skills + categories)

> Status: DONE — commit `5d18c37`.

**Scope.** Add a batch reorder primitive to the generic repository and expose it as an
auth-gated `PATCH /api/<domain>/reorder` for the two reorderable domains. Body is a bare
array `[{ id, order }]` (PD4). The write is a single Firestore `batch()` (atomic). The
service validates that every id in the set exists -> 404 on any unknown id, otherwise
commit.

**Files to touch.**
- [backend/src/shared/firestore.repository.ts](../../backend/src/shared/firestore.repository.ts)
  — add `async reorder(updates: { id: string; order: number }[]): Promise<void>`:
  build `this.db.batch()`, `batch.update(collection.doc(id), { order })` per entry,
  `await batch.commit()`. `batch.update` requires existing docs, so a missing id makes
  the whole commit reject with nothing written (atomic) — the belt to the service's
  suspenders.
- **New** `backend/src/shared/reorder.schema.ts` — shared Zod:
  `z.array(z.object({ id: z.string().min(1).max(200), order: z.number().int() })).min(1).max(500)`.
  (Optional `.refine` for unique ids.) Top-level array body; `validate.middleware` calls
  `schema.safeParse(req.body)`, which accepts arrays.
- [backend/src/skills/skill.repository.ts](../../backend/src/skills/skill.repository.ts)
  + [category.repository.ts](../../backend/src/categories/category.repository.ts) — add
  `reorder: (updates) => repo.reorder(updates)` to each factory. Because
  `SkillRepository`/`CategoryRepository` are `ReturnType<typeof create*Repository>`, the
  method is added to those types automatically.
- [backend/src/skills/skill.service.ts](../../backend/src/skills/skill.service.ts)
  + [category.service.ts](../../backend/src/categories/category.service.ts) — add
  `reorder(updates)`: `const ids = new Set((await repo.findAll()).map(x => x.id));`
  compute `missing = updates.filter(u => !ids.has(u.id)).map(u => u.id)`; if `missing.length`
  return `{ ok: false, missing }`; else `await repo.reorder(updates); return { ok: true }`.
- [backend/src/skills/skill.controller.ts](../../backend/src/skills/skill.controller.ts)
  + [category.controller.ts](../../backend/src/categories/category.controller.ts) — add
  `reorder` handler: on `{ ok: false }` -> `res.status(404).json({ success: false, message: 'Unknown id(s): ' + missing.join(', ') })`; on `{ ok: true }` -> `sendSuccess(res, null)`.
- [backend/src/skills/skill.routes.ts](../../backend/src/skills/skill.routes.ts)
  + [category.routes.ts](../../backend/src/categories/category.routes.ts) — register
  **before** the `/:id` routes (critical — see Risks):
  `router.patch('/reorder', authMiddleware, validate(reorderSchema), controller.reorder);`
- **Forced collateral (interface ripple):** the existing fake repos in
  [admin-cms/skill.service.test.ts](../../backend/tests/admin-cms/skill.service.test.ts),
  [admin-cms/category.service.test.ts](../../backend/tests/admin-cms/category.service.test.ts),
  and [data-model-cleanup/category.service.test.ts](../../backend/tests/data-model-cleanup/category.service.test.ts)
  use `{ findAll, save, update, remove } satisfies SkillRepository/CategoryRepository`.
  Adding `reorder` to the factory makes those `satisfies` fail to typecheck, so add
  `reorder: vi.fn()` to each fake. (vitest/esbuild strips types so tests would still run,
  but `tsc`/CI would flag it — fix it in this commit. Not scope creep; the type change
  forces it.)

**Acceptance criteria.**
- `PATCH /api/skills/reorder` and `/api/categories/reorder` exist, auth-gated like the
  other writes (401 no creds, 403 bad creds, 500 misconfig — inherited from `authMiddleware`).
- Body validation: non-array / empty array / wrong item shape -> 400 with a Zod message.
- All ids exist -> 200, every listed doc's `order` set, atomically, other fields untouched.
- Any id absent -> 404, message names the unknown id(s), and **no** doc is modified.
- `PATCH /api/skills/reorder` routes to the reorder handler, NOT to `/:id` with
  `id="reorder"` (which is a valid slug and would silently misroute).
- Existing skills/categories CRUD + auto-order-on-create behavior unchanged.

**Scoped tests** (`backend/tests/admin-cms-perf/`).
- Unit (repo mocked), `skill.reorder.service.test.ts` + `category.reorder.service.test.ts`:
  all-exist -> `repo.reorder` called with the updates, returns `{ ok: true }`; an unknown
  id -> returns `{ ok: false, missing: [...] }` and `repo.reorder` NOT called.
- Unit endpoint, `reorder.endpoint.test.ts` (supertest against `app`, **Firestore-free** —
  assert only short-circuit paths that never reach the controller): `PATCH /api/skills/reorder`
  with no auth -> 401; with `withApiKey()` + a malformed body -> 400 whose message indicates
  an array/body validation error (NOT `"Invalid ID format"`), proving `/reorder` hit the
  reorder validator and was not captured by `/:id`'s `validateSlugId`. Repeat for categories.
  Do NOT send a well-formed reorder body here (it would reach real Firestore). Own
  per-file write-limiter budget, so 401+400 are safe.
- Emulator, `reorder.repository.emulator.test.ts` (direct `FirestoreRepository.reorder` —
  no HTTP, no rate limiter): seed docs via `repo.save`, call `reorder`, assert orders
  updated; then call `reorder` with one missing id, assert it **rejects** and the existing
  docs' orders are **unchanged** (atomicity).
- Re-run the 3 edited fake-repo files to confirm still green:
  `npx vitest run tests/admin-cms/skill.service.test.ts tests/admin-cms/category.service.test.ts tests/data-model-cleanup/category.service.test.ts`.
- **Local gate:** `cd backend; npm run test:emulator` (needs Java/Temurin 21) before commit —
  this touches Firestore-backed code. If the sandbox lacks Java, STOP and have the operator run it.
- Do NOT add HTTP write assertions to the shared
  [skill.endpoint.emulator.test.ts](../../backend/tests/test-harness/skill.endpoint.emulator.test.ts)
  (capped) or a new HTTP reorder smoke to the emulator run — the writeLimiter (10/min) is
  process-global across the serial emulator slice (test-harness REVIEW §3). Route/auth/
  validation are covered by the Firestore-free unit endpoint test above.

Suggested commit: `feat(backend): add atomic bulk reorder endpoint for skills and categories`.

---

## ACMP-2 — Frontend: TanStack Query provider + defaults

> Status: DONE — commit `4234ab4`.

**Scope.** Install the dep and mount a single `QueryClientProvider` at the app root so
both the public group and the admin area share one client. Inert until consumers migrate
(ACMP-3/4).

**Files to touch.**
- [frontend/package.json](../../frontend/package.json) — add `@tanstack/react-query`
  (v5; compatible with React 18 / Next 14.1.3). `npm install`.
- **New** `frontend/app/providers.tsx` — `"use client"`; create the client once with
  `useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5*60*1000, refetchOnWindowFocus: false, retry: 1 } } }))`;
  render `<QueryClientProvider client={client}>{children}</QueryClientProvider>`.
- [frontend/app/layout.tsx](../../frontend/app/layout.tsx) — wrap `{children}` in
  `<Providers>` inside `<body>`. Root layout stays a server component; `Providers` is the
  client boundary. (Sits above both `(public)` and `admin` layouts; admin's `AuthProvider`
  nests inside, unaffected.)

**Acceptance criteria.**
- `npm run typecheck` passes; `npm run build` (static export) still succeeds.
- Provider present at root; no consumer/behavior change yet (pages render exactly as before).

**Scoped tests.** Frontend = typecheck only: `cd frontend; npm run typecheck`. Sanity:
`npm run build` completes (static export unaffected by a client provider).

Suggested commit: `feat(frontend): add TanStack Query provider`.

---

## ACMP-3 — Frontend: migrate public reads to useQuery; delete useApi

> Status: DONE — commit `db204d3`. Hooks carry explicit `UseQueryResult<...>` return
> types so `data` stays typed across the import boundary (otherwise TS2742 degrades it
> to `any`). Network dedup/cache behavior verified by typecheck + build; live-network
> check is manual.

**Scope.** Replace `useApi(fetcher)` in the 5 public consumers with per-endpoint
`useQuery`, keyed so shared endpoints dedup (Navbar + Footer media-socials -> one fetch;
skills shared by Home + Projects). Reuse the existing `app/api/*` fetchers as query
functions (keep their `cache: 'no-store'`). Delete the now-unused `useApi`.

**Files to touch.**
- **New** `frontend/lib/queries.ts` — central keys + typed hooks (shared with ACMP-4):
  `queryKeys = { about:['about'], skills:['skills'], categories:['categories'], projects:['projects'], resume:['resume'], mediaSocials:['media-socials'] } as const;`
  plus `useAbout/useSkills/useCategories/useProjects/useResume/useMediaSocials`, each
  `useQuery({ queryKey, queryFn: fetch* })`.
- [HomeClient/index.tsx](../../frontend/components/HomeClient/index.tsx) — replace the
  `useApi(Promise.all([...]))` with `useAbout()` + `useSkills()` + `useCategories()`;
  derive `loading = a.isPending || s.isPending || c.isPending`, `error = a.isError || s.isError || c.isError`, and rebuild `{ aboutMe, skills: skills.filter(isShow), categories }`. Keep the 2-level ordering/grouping and the role-rotation effect.
- [ProjectsClient/index.tsx](../../frontend/components/ProjectsClient/index.tsx) —
  `useProjects()` + `useSkills()` (skills unfiltered, for icon/name resolution); combine
  loading/error; keep `skillMap`/`recent` derivation.
- [ResumeClient/index.tsx](../../frontend/components/ResumeClient/index.tsx) — `useResume()`.
- [NavbarClient.tsx](../../frontend/components/CustomNavbar/NavbarClient.tsx) +
  [FooterClient.tsx](../../frontend/components/CustomFooter/FooterClient.tsx) —
  `useMediaSocials()`; `data ?? []` as today. Same key -> one network request across both.
- **Delete** [frontend/lib/useApi.ts](../../frontend/lib/useApi.ts) after migration; grep
  to confirm no remaining importers.

**Acceptance criteria.**
- `npm run typecheck` passes; no import of `@/lib/useApi` remains (grep clean); file deleted.
- Loading/empty/error UX preserved (same `<Loading/>` / `<ErrorMessage/>` branches).
- Behavior parity: Home filters `isShow` + orders categories/skills; Projects resolves tech
  via the full skill map and shows recent(3)+all; Resume tabs render; Navbar/Footer render
  `isSafeUrl` socials.
- Network: a single `/api/media-socials` request serves both Navbar and Footer (dedup);
  revisiting a page within `staleTime` serves from cache (no refetch).

**Scoped tests.** Typecheck only (`cd frontend; npm run typecheck`). Behavior can't be
exercised headless — verify manually in `npm run dev`: each public page renders live data;
DevTools Network shows media-socials fetched once and cached reads on quick re-navigation.
State this explicitly at commit.

Suggested commit: `refactor(frontend): fetch public reads via TanStack Query`.

---

## ACMP-4 — Frontend: migrate admin reads to useQuery + invalidate on writes

> Status: DONE — commit `b9f5678`. The reorder `move()` `await load()` was swapped for
> `invalidateQueries` here (load() is gone); ACMP-5 rewrites the body to the bulk endpoint.

**Scope.** Move the admin read paths (list, dashboard counts, edit loader, singleton
loader) onto `useQuery`, keyed per domain so the list and its dashboard count share one
entry. After every successful create/update/delete, `invalidateQueries` for that domain
(PD3) so the list + dashboard reflect the change immediately (previously each mount
refetched via `no-store`; with a 5-min `staleTime`, invalidation is now required for
freshness). Reorder invalidation lands in ACMP-5.

**Files to touch.**
- `frontend/lib/queries.ts` — add `adminKeys = { domain: (apiPath: string) => ['admin', apiPath] as const }`.
- [DomainListClient.tsx](../../frontend/components/admin/DomainListClient.tsx) — replace
  the `rows` state + `load()` `useEffect` with
  `useQuery({ queryKey: adminKeys.domain(config.apiPath), queryFn: () => listDomain<Row>(config.apiPath) })`;
  derive display rows via `useMemo` (`config.reorderable ? sortForReorder(...) : data`).
  Map `isPending` -> "Loading...", `isError` -> the existing error banner (+ treat rows as
  `[]`). In `confirmDelete`, replace `await load()` with
  `queryClient.invalidateQueries({ queryKey: adminKeys.domain(config.apiPath) })`; keep the
  404 -> `notice` path (also invalidate). `useQueryClient()` for the client.
- [DashboardClient.tsx](../../frontend/components/admin/DashboardClient.tsx) — `DomainCard`
  count via `useQuery({ queryKey: adminKeys.domain(config.apiPath), queryFn: () => listDomain(config.apiPath), enabled: !config.singleton, select: rows => rows.length })`.
  Shares the list's key -> dedup + a single invalidation refreshes both. Preserve
  loading "..."/error "-"/`N item(s)` labels.
- [DomainFormPage.tsx](../../frontend/components/admin/DomainFormPage.tsx) —
  - `EditForm`: load the list via `useQuery(adminKeys.domain(apiPath))` then `find(id)`;
    keep the `item===undefined/null` Loading/NotFound branches and the 404-on-submit copy.
    On update success -> `invalidateQueries(adminKeys.domain(apiPath))` then `router.push`.
  - `SingletonForm`: load via `useQuery({ queryKey: adminKeys.domain(apiPath), queryFn: () => getSingleton(apiPath), retry: false })`; keep the 404 -> empty-form branch
    (map `ApiError(404)` to `{}`). On save success -> invalidate.
  - `CreateForm`: on create success -> invalidate the domain key, then `router.push`.

**Acceptance criteria.**
- `npm run typecheck` passes.
- Admin list, dashboard counts, edit form, and singleton form load via cache; the
  dashboard count and the list never double-fetch the same domain on one screen.
- After create/edit/delete, returning to (or already viewing) the list AND the dashboard
  count both show the change without a manual reload (invalidation works under the 5-min
  `staleTime`).
- Error/empty/404 behaviors preserved (delete-of-missing -> `notice` + refresh; edit-of-missing
  -> the "no longer exists" message; singleton-not-yet-created -> editable empty form).

**Scoped tests.** Typecheck only. Verify manually in `npm run dev` (signed in): create →
list+dashboard update; edit → list reflects; delete → row gone + count drops; singleton save
persists. State manual verification at commit.

Suggested commit: `refactor(frontend): fetch admin reads via TanStack Query with write invalidation`.

---

## ACMP-5 — Frontend: admin reorder via the bulk endpoint + invalidate

> Status: DONE — commit `7c08ce7`.

**Scope.** Replace the two-PATCH swap in `move()` with ONE call to the ACMP-1 bulk
endpoint (atomic; no more partial-failure split order — REVIEW SS7), then invalidate the
domain. Generic over both reorderable domains via `config`.

**Files to touch.**
- [frontend/lib/admin/api.ts](../../frontend/lib/admin/api.ts) — add
  `reorderItems(apiPath, updates: { id: string; order: number }[])`:
  `authedFetch(`${API_URL}${apiPath}/reorder`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })` then `unwrap`.
  (Content-Type is required so `express.json` parses the array body.)
- [DomainListClient.tsx](../../frontend/components/admin/DomainListClient.tsx) — rewrite
  `move()`: compute the swapped pair
  `[{ id: row.id, order: Number(neighbor.order ?? 0) }, { id: neighbor.id, order: Number(row.order ?? 0) }]`,
  call `reorderItems(config.apiPath, pair)` (single request), then
  `invalidateQueries(adminKeys.domain(config.apiPath))`. Drop the `Promise.all` two-PATCH.
  Keep the `reordering` disabled state + error banner.

**Acceptance criteria.**
- `npm run typecheck` passes.
- Up/Down issues exactly ONE `PATCH /api/<domain>/reorder` (verify in Network); order
  persists after the post-invalidation refetch.
- A failed reorder leaves order unchanged (server is atomic) and surfaces the error banner;
  no split/duplicate `order` is possible.
- Works for both skills (per-category neighbors) and categories (global), unchanged grouping.

**Scoped tests.** Typecheck only. Verify manually in `npm run dev`: reorder skills within a
category and categories globally; confirm a single request and persisted order. State manual
verification at commit.

Suggested commit: `feat(frontend): reorder admin items via the atomic bulk endpoint`.

---

## ACMP-6 — Frontend: "View site" link in the admin topbar (PD6)

**Scope.** Add a "View site" link to the admin topbar -> `/`, navigating in the same tab
(Firebase session persists).

**Files to touch.**
- [AdminShell.tsx:153-186](../../frontend/components/admin/AdminShell.tsx#L153-L186) — in
  the header, add `<Link href="/">View site</Link>` next to the email / Sign-out (e.g., a
  right-side group with the existing `text-sm text-blue-500 hover:text-blue-400` styling).
  Same tab (no `target="_blank"`). `Link` is already imported.

**Acceptance criteria.**
- `npm run typecheck` passes.
- A "View site" control shows in the admin topbar on desktop and mobile widths; clicking it
  navigates to `/` in the same tab; returning to `/admin` keeps the session (no re-login).
- Layout unbroken (email still truncates; Sign out still right-aligned).

**Scoped tests.** Typecheck only. Verify manually: link visible, navigates to `/`, session
persists on return. State manual verification at commit.

Suggested commit: `feat(frontend): add View site link to the admin topbar`.

---

## ACMP-7 — Docs: describe the TanStack Query data layer (PD5 re-scoped)

**Scope.** Make the docs match reality (per Phase 0 drift). No rate-limit number change
(CLAUDE.md already correct).

**Files to touch.**
- [CLAUDE.md](../../CLAUDE.md) — Frontend section: replace the "Data is fetched
  client-side at runtime ... via `useApi` on mount ... with `cache: 'no-store'`" paragraph
  with the TanStack Query story (QueryClientProvider at the app root; per-endpoint query
  keys + 5-min `staleTime`, `refetchOnWindowFocus` off; fetchers in `app/api/*` keep
  `no-store` and act as query functions; admin writes `invalidateQueries` the domain).
  Remove the `useApi` reference (file deleted).
- [skill.endpoint.emulator.test.ts:11](../../backend/tests/test-harness/skill.endpoint.emulator.test.ts#L11)
  — fix the stale "20-writes/15-min" comment to the actual 10/min write limit (comment only;
  no assertion change).
- Do NOT edit frozen historical planning docs (admin-cms/*, auth/*, test-harness/*, etc.).

**Acceptance criteria.**
- CLAUDE.md Frontend section accurately describes the cache layer; no lingering `useApi`
  mention; rate-limit numbers unchanged (still 60/10 per minute).
- The test comment matches the real limiter; the test still runs green
  (`npx vitest run tests/test-harness/skill.endpoint.emulator.test.ts` via the emulator
  config — comment-only, so behavior unchanged).

**Scoped tests.** None (docs/comment). If `npm run typecheck` was last green it remains so
(no `.ts`/`.tsx` logic touched).

Suggested commit: `docs: describe the TanStack Query data layer`.

---

## Cross-cutting risks & edge cases

- **Route ordering (ACMP-1).** `PATCH /reorder` MUST precede `PATCH /:id`; "reorder" passes
  the slug regex, so a wrong order silently misroutes to the per-item update. Covered by the
  Firestore-free unit endpoint assertion.
- **Repo-interface ripple (ACMP-1).** Adding `reorder` to the factory widens
  `SkillRepository`/`CategoryRepository`; update the 3 existing fake repos in the same commit
  or `tsc`/CI flags the `satisfies`.
- **Emulator write-limiter budget (ACMP-1).** The 10/min writeLimiter is process-global
  across the serial emulator slice; don't add HTTP writes there. Reorder atomicity is tested
  at the repo layer (direct calls); route/auth/validation at the Firestore-free unit layer.
- **Batch atomicity on missing id (ACMP-1).** `batch.update` rejects the whole commit if any
  doc is absent (nothing written) — belt to the service's existence pre-check. A TOCTOU
  delete between the `findAll` check and commit would surface as a 500 rather than 404;
  acceptable for a single operator (note, don't engineer around).
- **Invalidation is now load-bearing (ACMP-4/5).** With a 5-min `staleTime`, an admin write
  that doesn't `invalidateQueries` would show stale data on the next mount (the old `no-store`
  per-mount refetch is gone). Every write path must invalidate.
- **Cross-tab staleness (accepted).** `refetchOnWindowFocus: false` means a tab-A edit won't
  auto-refresh tab B until its `staleTime` lapses or it remounts — accepted per DISCUSSION §4.
- **Top-level array body (ACMP-1/5).** The reorder body is a bare JSON array; `express.json`
  parses it and `validate.middleware`'s `safeParse` accepts arrays. The FE must send
  `Content-Type: application/json`.
- **Static export (ACMP-2).** `output: 'export'` is unaffected — the provider is a client
  component; data still loads at runtime. Confirm `npm run build` after ACMP-2.

## Testing summary

- Backend (ACMP-1): unit under `backend/tests/admin-cms-perf/` (`npx vitest run tests/admin-cms-perf`)
  + the emulator gate `cd backend; npm run test:emulator` (Java/Temurin 21) before commit;
  re-run the 3 edited fake-repo files. No full-suite run.
- Frontend (ACMP-2..6): `cd frontend; npm run typecheck` per ticket (bare `tsc --noEmit`,
  single-config — never `-b`); behavior verified manually in `npm run dev` and noted at commit.
- Docs (ACMP-7): none.

## Handoff

```
/wf-implement admin-cms-perf
```
Branch `feat/admin-cms-perf` from `develop` (after the in-flight S3.1 fix has merged, per
DISCUSSION §1/§5). One commit per ticket, ACMP-1 -> ACMP-7 in order; scoped tests only;
run the emulator gate before the ACMP-1 commit. Do not push until explicitly approved.
```
