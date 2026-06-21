# Admin CMS Scaffold (S3) — Implementation Plan

> Execution contract for the S3 design in
> [DISCUSSION.md](DISCUSSION.md) (Decisions D1-D11 LOCKED). Branch: `feat/admin-cms`
> cut from `develop`. One commit per ticket. Backend tickets land first (low-risk
> refactor + the roadmap's DI requirement); the frontend tickets are independent of
> them (endpoints are unchanged) but are sequenced after so the test/refactor base is
> green first.

## 0. Scope recap (from the design)

- **No new backend endpoints.** D1 (no auth change), D2 (no `GET /:id`), D3 (reorder =
  existing per-item `PATCH /:id`), categories CRUD already shipped in S1. The only
  backend work is **D8** (convert the 6 namespace-import domains to factory DI so each
  gets a service test) plus a small cleanup the user requested (remove the unused
  `experience.technologies` field).
- **The bulk is frontend**: a config-driven CRUD scaffold (D9), four custom widgets
  (D6), a real admin shell (D11), not-allowlisted handling (D4), and URL/text assets
  only (D5).

## 1. Verified grounding (drift check done against code)

Confirmed accurate vs the cited files, with these refinements folded into the tickets:

- **DI pattern** (skills/categories/projects are the template):
  `create<Domain>Repository(db?)` -> `create<Domain>Service(repo)` ->
  `create<Domain>Controller(service)`; routes are the composition root that wires them
  ([skill.routes.ts](../../backend/src/skills/skill.routes.ts:10-19)). Repo factory
  wraps the generic [FirestoreRepository<T>](../../backend/src/shared/firestore.repository.ts)
  and takes an optional `db` for the emulator
  ([skill.repository.ts](../../backend/src/skills/skill.repository.ts:7-15)).
- **`about` is a SPECIAL singleton** — its repository does NOT use
  `FirestoreRepository<T>`; it targets a fixed `about/main` doc with a custom
  `findOne` + an id-ignoring `update`/`remove`
  ([about.repository.ts](../../backend/src/about/about.repository.ts)). Its DI factory
  must preserve that custom impl (still accept an optional `db`), not swap in the
  generic repo. Routes expose only `GET /` + `PATCH /:id` (edit-only).
- **id generation**: skills/categories = `toSlug(name)` + `validateSlugId`; the 5 uniform
  domains (experiences/educations/certifications/achievements/mediaSocials) + projects =
  `randomUUID()` + `validateId`. The admin create form NEVER sends an id (BE generates it).
- **`experience.technologies`** exists only in
  [experience.type.ts:9](../../backend/src/experiences/experience.type.ts) and
  [experience.schema.ts:11](../../backend/src/experiences/experience.schema.ts). It is
  NOT stored in Firestore, NOT rendered (FE `ExperienceType` has no such field), NOT
  seeded. Per the user it is to be **deleted from code** (ADMIN-CMS-1). `project.technologies`
  is unrelated and stays.
- **Validation 400 shape**: [validate.middleware](../../backend/src/middlewares/validate.middleware.ts:9-12)
  returns a single concatenated string `"path: message, path: message"`. So the FE
  surfaces a **form-level** error string (D10), with light per-field required checks
  before submit. No per-field server map exists to bind to.
- **Static export constraint** ([next.config.mjs](../../frontend/next.config.mjs):
  `output: 'export'`): there are no dynamic routes today. Record ids are unknown at
  build time, so **edit routes carry the id as a `?id=` query param** (read client-side
  via `useSearchParams`, wrapped in `<Suspense>`), and the `[domain]` segment is
  enumerated via `generateStaticParams` from the registry. Each `app/admin/[domain]/...`
  route is a thin **server** component (exports `generateStaticParams`, renders a
  `"use client"` child) — mirroring the existing public `page.tsx -> *Client` pattern.
- **D4 probe endpoint**: all GETs are public and no new endpoint may be added, so the
  login probe must exercise the write-auth gate WITHOUT mutating. Use a `DELETE` to a
  **format-valid but non-existent id** so id-validation passes and auth actually runs:
  `authedFetch(DELETE /api/projects/00000000-0000-0000-0000-000000000000)`. The
  `authMiddleware` runs before the controller, so: `401` = bad/expired token, `403` =
  email-unverified / not-allowlisted -> "not authorized" (sign out); any other status
  (expected `404 Project not found`, since nothing matches) = authorized -> render
  dashboard. Non-mutating by construction (no doc with that id exists).

## 2. Cross-cutting frontend design (consumed by ADMIN-CMS-8..13)

### 2.1 `DomainConfig` (D9) — `frontend/lib/admin/config.ts`
```ts
type FieldType =
  | 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'url'
  | 'string-array'        // array-of-strings editor (D6d)
  | 'category-ref'        // single-select category picker (D6b)
  | 'tech-picker';        // multi-select of skill ids (D6a)

interface FieldConfig { key: string; label: string; type: FieldType; required?: boolean; }
interface ColumnConfig { key: string; label: string; }
interface DomainConfig {
  slug: string;           // route segment, e.g. 'projects' / 'media-socials'
  label: string;          // sidebar/title, e.g. 'Projects'
  apiPath: string;        // '/api/projects'
  idKind: 'uuid' | 'slug';
  singleton?: boolean;    // about (edit-only; no list/create/delete)
  reorderable?: boolean;  // skills, categories
  columns: ColumnConfig[];
  fields: FieldConfig[];
}
```
A `registry: DomainConfig[]` (sidebar order) + `bySlug: Record<string, DomainConfig>`
lookup. All 9 domains are declared up front; the views progressively support more field
types as the widgets land.

### 2.2 Per-domain config (grounded in the BE Zod schemas)
- **about** (`singleton`): name (text, req), email (text, req). GET returns one object.
- **skills** (`reorderable`, slug): name (text, req), categoryId (category-ref, req),
  iconClass (text), iconImage (url), isShow (boolean), order (number). columns: name,
  category, order, isShow.
- **categories** (`reorderable`, slug): name (text, req), order (number). columns: name, order.
- **projects** (uuid): name (text, req), date (date, req), description (textarea, req),
  technologies (tech-picker), role (string-array), category (string-array),
  url/githubUrl/youtubeUrl (url). columns: name, date.
- **experiences** (uuid): company (text, req), position (text, req), description
  (string-array, req), location (text, req), startDate (date, req), endDate (date).
  columns: company, position, startDate. (No `technologies` after ADMIN-CMS-1.)
- **educations** (uuid): institution (text, req), title (text, req), startDate (date, req),
  endDate (date, req), description (textarea, req). columns: institution, title.
- **certifications** (uuid): company_name (text, req), title (text, req), issued (date, req),
  expires (date), url (url). columns: company_name, title, issued.
- **achievements** (uuid): event_name (text, req), org_name (text, req), achievement (text),
  date (date, req), descriptions (string-array, req), githubUrl (string-array of urls),
  resultUrl (string-array of urls). columns: event_name, org_name, date.
- **media-socials** (uuid): name (text, req), url (url, req), iconClass (text, req).
  columns: name, url.

### 2.3 Admin API client — `frontend/lib/admin/api.ts`
- `listDomain(apiPath)`: public `GET` (plain `fetch`, `cache:'no-store'`), unwrap
  `json.data`.
- `createItem(apiPath, body)`: `authedFetch` `POST`.
- `updateItem(apiPath, id, body)`: `authedFetch` `PATCH`.
- `deleteItem(apiPath, id)`: `authedFetch` `DELETE`.
- Shared unwrap throws an `ApiError { status, message }` on `!res.ok` (message from
  `json.message`) so forms/lists can surface BE `400/403/404` text (D10). Reuse the S2
  [authedFetch](../../frontend/lib/authedFetch.ts) (it already retries once on 401).

### 2.4 Test strategy & the emulator write-rate-limit caveat
- BE per-domain tests are **service unit tests** (repo mocked, `vi.fn` stubs) modeled on
  [skill.service.test.ts](../../backend/tests/test-harness/skill.service.test.ts), under
  `backend/tests/admin-cms/`. Run scoped: `npx vitest run tests/admin-cms`.
- **Do NOT add per-domain endpoint emulator tests.** The shared write path
  (authMiddleware -> validate -> CRUD) is identical across domains and is already smoked
  once by [skill.endpoint.emulator.test.ts](../../backend/tests/test-harness/skill.endpoint.emulator.test.ts).
  The emulator slice runs as ONE process against the live `app` with the 20-writes/15-min
  write limiter active; six more CRUD round-trips would exceed it and flake the slice.
  The DI seam is proven by the unit tests; the emulator slice stays as-is.
- Frontend: **typecheck only** — `npm run typecheck` (bare `tsc --noEmit`, single config,
  no `-b`). FE behavior that can't run headless (auth popup, probe, widgets) is verified
  by a documented manual e2e checklist per ticket.

## 3. Tickets

Stable ids `ADMIN-CMS-N`. Record the commit SHA next to each as it lands (do not commit
this file with code).

---

### Backend (D8 DI conversions + cleanup) — no endpoint/behavior change

#### ADMIN-CMS-1 — Remove the unused `experience.technologies` field
- **Status**: DONE — `bb2fb90` (also removed the field from the Swagger `Experience` schema).
- **Scope**: delete the `technologies` field from the experiences domain (never stored,
  never rendered).
- **Files**: [experience.type.ts](../../backend/src/experiences/experience.type.ts)
  (drop line 9), [experience.schema.ts](../../backend/src/experiences/experience.schema.ts)
  (drop the `technologies` key + the now-unused `safeUrl`? — note: schema imports only
  `safeDate`, so no import cleanup needed; verify). Check swagger experience schema (the
  swagger `technologies` hits are all under the **project** schema — confirm experiences
  has none before editing).
- **ACs**: `technologies` no longer appears anywhere under `backend/src/experiences/`;
  `npm run build` (tsc) is clean; no other domain touched (`project.technologies` stays).
- **Tests**: none new (removal). Gate: `cd backend; npx tsc --noEmit` (or `npm run build`).
- **Commit**: `refactor(backend): drop unused technologies field from experiences`.

#### ADMIN-CMS-2 — Convert `experiences` to factory DI
- **Status**: DONE — `02810ed`. Convention chosen: repo modules export ONLY the
  `createXxxRepository(db?)` factory; `resume.repository.ts` is a mini composition root
  that instantiates each factory once and calls `.findAll()` (repeat for 3/4/5).
- **Scope**: convert repository/service/controller/routes to the factory pattern
  (`createExperienceRepository(db?)` wrapping `FirestoreRepository<Experience>('experiences')`
  with `findAll: () => repo.findAllOrdered('startDate')`, plus save/update/remove;
  `createExperienceService(repo)`; `createExperienceController(service)` keeping
  `randomUUID()` id-gen and the 404 messages; routes become the composition root). Behavior
  must be byte-identical (same routes, same order: `validateId -> authMiddleware ->
  validate -> controller`).
- **Files**: experience.repository.ts, experience.service.ts, experience.controller.ts,
  experience.routes.ts. **Update [resume.repository.ts](../../backend/src/resume/resume.repository.ts:10)**
  which imports `ExperienceRepository.findAll` as a namespace — it must consume the new
  factory (instantiate once, call `.findAll()`), or keep a back-compat `findAll` export.
  Decide one approach and apply it consistently here (it recurs in ADMIN-CMS-3/4/5).
- **ACs**: routes unchanged externally; resume aggregation still returns experiences;
  service has no Firestore import.
- **Tests**: `backend/tests/admin-cms/experience.service.test.ts` (mocked repo:
  getAll/insert/update/update-null/deleteById), modeled on skill.service.test.ts. Run
  `npx vitest run tests/admin-cms`. Local gate (touches a repository wired into resume):
  `cd backend; npm run test:emulator`.
- **Commit**: `refactor(backend): convert experiences to factory DI`.

> **Resume-aggregation note (applies to ADMIN-CMS-2..5):**
> [resume.repository.ts](../../backend/src/resume/resume.repository.ts) imports
> `EducationRepository/ExperienceRepository/CertificationRepository/AchievementRepository`
> as namespaces and calls `.findAll()`. Whichever DI shape is chosen, resume must keep
> compiling and returning the same data. Pick ONE convention in ADMIN-CMS-2 (e.g. the
> routes file owns the singleton instance; the repository module also exports a default
> instance for resume to reuse) and repeat it for educations/certifications/achievements.
> Verify resume in the emulator gate after each.

#### ADMIN-CMS-3 — Convert `educations` to factory DI
- **Status**: DONE — `9b8a092`.
- Same pattern; `findAll: () => repo.findAllOrdered('endDate')`, `randomUUID()`,
  `validateId`. Update resume wiring per the chosen convention.
- **Files**: education.{repository,service,controller,routes}.ts; resume.repository.ts.
- **Tests**: `backend/tests/admin-cms/education.service.test.ts`. Gate: emulator slice.
- **Commit**: `refactor(backend): convert educations to factory DI`.

#### ADMIN-CMS-4 — Convert `certifications` to factory DI
- **Status**: DONE — `2ba1935`.
- Same pattern; `findAllOrdered('issued')`, `randomUUID()`, `validateId`.
- **Files**: certification.{repository,service,controller,routes}.ts; resume.repository.ts.
- **Tests**: `backend/tests/admin-cms/certification.service.test.ts`. Gate: emulator slice.
- **Commit**: `refactor(backend): convert certifications to factory DI`.

#### ADMIN-CMS-5 — Convert `achievements` to factory DI
- **Status**: DONE — `b541e06`.
- Same pattern; `findAllOrdered('date')`, `randomUUID()`, `validateId`. (Note the file is
  `achievements.routes.ts`/`achievement.controller.ts` — keep existing filenames.)
- **Files**: achievements.{repository,service,routes}.ts, achievement.controller.ts;
  resume.repository.ts.
- **Tests**: `backend/tests/admin-cms/achievement.service.test.ts`. Gate: emulator slice.
- **Commit**: `refactor(backend): convert achievements to factory DI`.

#### ADMIN-CMS-6 — Convert `media-socials` to factory DI
- **Status**: DONE — `aa3fd84`.
- Same pattern; `findAll: () => repo.findAll()` (unordered, as today), `randomUUID()`,
  `validateId`. media-socials is NOT in resume aggregation, so no resume change.
- **Files**: mediaSocial.{repository,service,controller,routes}.ts.
- **Tests**: `backend/tests/admin-cms/mediaSocial.service.test.ts`. Gate: emulator slice.
- **Commit**: `refactor(backend): convert media-socials to factory DI`.

#### ADMIN-CMS-7 — Convert `about` to factory DI (singleton, custom repo)
- **Scope**: convert about to factories WITHOUT switching to `FirestoreRepository<T>`.
  `createAboutRepository(db?)` returns `{ findOne, save, update, remove }` backed by the
  existing `db.collection('about').doc('main')` logic (id ignored). `createAboutService(repo)`
  (get/insert/update/deleteById). `createAboutController(service)` keeps the `get` 404 path
  and `update` 404 path. Routes wire the composition root; still only `GET /` + `PATCH /:id`.
- **Files**: about.{repository,service,controller,routes}.ts.
- **ACs**: `GET /api/about` returns the single doc or 404; `PATCH /api/about/:id` updates
  the singleton (id still ignored); db param injectable for tests.
- **Tests**: `backend/tests/admin-cms/about.service.test.ts` (mocked repo: get pass-through,
  get-null -> service returns null, update pass-through, update-null). Gate: emulator slice
  (about repo touches Firestore directly).
- **Commit**: `refactor(backend): convert about to factory DI`.

---

### Frontend (the scaffold) — branch `feat/admin-cms`

#### ADMIN-CMS-8 — Config core: types, registry, admin API client
- **Scope**: the foundation consumed by every later FE ticket. No UI yet.
- **Files**: `frontend/lib/admin/config.ts` (the `DomainConfig` types + the 9-domain
  registry of §2.1/2.2), `frontend/lib/admin/api.ts` (the client + `ApiError` of §2.3).
- **ACs**: registry exports all 9 domains with the documented fields/columns/flags;
  `bySlug` lookup; api client compiles and reuses `authedFetch`. `npm run typecheck` clean.
- **Tests**: typecheck only.
- **Commit**: `feat(frontend): add admin domain config registry and API client`.

#### ADMIN-CMS-9 — Admin shell + route guard with probe-on-login (D4, D11)
- **Scope**: replace the throwaway [admin/page.tsx](../../frontend/app/admin/page.tsx)
  with a real shell: a sidebar/nav listing all registry domains (links to
  `/admin/<slug>`), an index/dashboard, and a reusable `AdminGuard`. The guard: waits for
  auth; if signed out -> `/admin/login`; once signed in, runs the **D4 probe** (§1) once;
  on 401/403 -> `signOut()` + render a clear "You are not authorized to access the admin"
  message (no dashboard); otherwise render children. Apply the guard in
  [admin/layout.tsx](../../frontend/app/admin/layout.tsx) (inside `AuthProvider`) so it
  wraps every `/admin/*` page except `/admin/login`.
- **Files**: `frontend/components/admin/AdminShell.tsx` (sidebar + content slot),
  `frontend/components/admin/AdminGuard.tsx`, rewrite `frontend/app/admin/page.tsx`
  (dashboard), update `frontend/app/admin/layout.tsx`. Reuse Flowbite/Tailwind (D7).
- **ACs (manual e2e)**: allowlisted account -> dashboard + sidebar with all 9 domains;
  non-allowlisted (or unverified) account -> signed out + "not authorized" message, no
  dashboard flash; signed-out visitor -> redirected to login. Probe is the
  non-mutating DELETE (verify no data deleted). `npm run typecheck` clean.
- **Tests**: typecheck + manual e2e checklist above.
- **Commit**: `feat(frontend): add admin shell and not-allowlisted login guard`.

#### ADMIN-CMS-10 — Generic list view + `/admin/[domain]` route
- **Scope**: one shared list view driven by `config.columns`. Dynamic route
  `app/admin/[domain]/page.tsx` = thin **server** component exporting
  `generateStaticParams` (all registry slugs) + rendering a `"use client"`
  `DomainListClient` that looks up `bySlug[domain]`, fetches via `listDomain`, renders a
  table of columns with Edit (`/admin/[domain]/edit?id=`) / Delete actions and a "New"
  button (-> `/admin/[domain]/new`). Loading / empty / error states. Delete confirms,
  calls `deleteItem`, refetches; a 404 (item already gone) just refreshes the list with a
  notice. `singleton` domains (about) render no list — redirect/render straight to the
  edit form (the about row in the sidebar still works). `reorderable` controls are added
  later (ADMIN-CMS-13); list just sorts by `order` where present.
- **Files**: `frontend/components/admin/DomainListClient.tsx`,
  `frontend/app/admin/[domain]/page.tsx`. Guard from ADMIN-CMS-9 applies via layout.
- **ACs (manual e2e)**: each non-singleton domain lists its rows with the right columns;
  Delete removes a row and the list refreshes; unknown `[domain]` slug -> graceful "not
  found"; about -> goes to its edit form. Static export builds (`npm run build`) with the
  9 generated params. `npm run typecheck` clean.
- **Tests**: typecheck + manual e2e + `npm run build` (proves `generateStaticParams` +
  export work).
- **Commit**: `feat(frontend): add config-driven admin list view`.

#### ADMIN-CMS-11 — Generic create/edit form + simple input registry (D2, D10)
- **Scope**: one shared form view + a field-type -> input-component registry for the
  SIMPLE types (text, textarea, number, boolean, date, url). Routes
  `app/admin/[domain]/new/page.tsx` and `app/admin/[domain]/edit/page.tsx` (thin server
  components with `generateStaticParams` over non-singleton slugs; about reuses its list
  route as the edit form). The edit page reads `?id=` via `useSearchParams` wrapped in
  `<Suspense>`; per **D2** it reuses already-fetched list data if present, else fetches
  the list and selects the item (no `GET /:id`). Submit: light required-field check (FE),
  then `createItem`/`updateItem`; on success -> back to the list; on `ApiError` surface
  the BE message form-level (400 validation / 403 / 404) per **D10**. Create never sends
  an id. url fields run through [isSafeUrl](../../frontend/lib/url.ts) for display, BE is
  the validator of record.
- **Files**: `frontend/components/admin/DomainForm.tsx`,
  `frontend/components/admin/inputs/` (the simple input components + registry),
  `frontend/app/admin/[domain]/new/page.tsx`, `frontend/app/admin/[domain]/edit/page.tsx`.
- **ACs (manual e2e)**: create + edit round-trips work for the SIMPLE-field domains
  (educations, certifications, media-socials, categories minus reorder); BE 400 message
  shows on the form; direct-refresh of an edit URL (no list in memory) still loads the
  item via the D2 list-then-select path; required-field check blocks empty submit. Complex
  fields (string-array/category-ref/tech-picker) render a placeholder until ADMIN-CMS-12.
  `npm run typecheck` + `npm run build` clean.
- **Tests**: typecheck + manual e2e + build.
- **Commit**: `feat(frontend): add config-driven admin create/edit form`.

#### ADMIN-CMS-12 — Custom widgets (D6)
- **Scope**: the four custom field widgets, registered into the input registry:
  - **array-of-strings editor** (D6d): add/remove/edit rows; used by
    project.role/category, experience.description, achievement.descriptions, and the
    url-array fields achievement.githubUrl/resultUrl.
  - **category single-select** (D6b): dropdown of categories (fetch `/api/categories`)
    for skill.categoryId; stores the category id.
  - **project tech-picker** (D6a, T3): multi-select of skill ids (fetch `/api/skills`),
    showing skill names; stores skill ids; dangling/unknown ids render gracefully (still
    selectable/removable). Used only by project.technologies.
  - **about singleton** (D6c): the about route is edit-only (handled by ADMIN-CMS-10/11
    singleton path) — this ticket just confirms the form renders about with no
    create/delete affordance.
- **Files**: `frontend/components/admin/inputs/StringArrayInput.tsx`,
  `CategorySelect.tsx`, `TechPicker.tsx`; wire into the registry from ADMIN-CMS-11; any
  singleton tweaks in `DomainForm`.
- **ACs (manual e2e)**: skills create/edit picks a category and saves; projects edit
  selects multiple skills (and an unknown seeded id still displays + can be removed);
  string-array fields add/remove rows and save; about edits name/email only. Reuse
  Flowbite/Tailwind, no second UI framework (D7). `npm run typecheck` + `npm run build`.
- **Tests**: typecheck + manual e2e + build.
- **Commit**: `feat(frontend): add custom admin field widgets`.

#### ADMIN-CMS-13 — Reorder controls (D3)
- **Scope**: up/down (or order-number) reorder for the two `reorderable` domains via the
  existing per-item `PATCH /:id { order }` (no bulk endpoint):
  - **categories**: global list sorted by `order asc`; up/down swaps `order` with the
    neighbor (two PATCHes), then refetch.
  - **skills**: order is **per-category** — group the list by category, sort each group
    by `order asc`, reorder within a group only.
  Disable the buttons while a PATCH is in flight; refetch after to reflect server state
  (concurrency is single-writer / low-risk per the design).
- **Files**: extend `DomainListClient` (or a `ReorderControls` component) for
  `config.reorderable`; skills grouping helper.
- **ACs (manual e2e)**: reordering categories persists across refresh; reordering skills
  changes order within a category and does not affect other categories; buttons are
  disabled at the ends / during a write. `npm run typecheck` + `npm run build` clean.
- **Tests**: typecheck + manual e2e + build.
- **Commit**: `feat(frontend): add admin reorder controls for skills and categories`.

## 4. Sequencing & dependencies

1. **ADMIN-CMS-1** (cleanup) -> **2..6** (uniform DI; each updates resume wiring per the
   convention fixed in -2) -> **7** (about singleton DI). Backend is independent of the FE.
2. **ADMIN-CMS-8** (config+client) gates all FE. Then **9** (shell+guard) -> **10** (list)
   -> **11** (form) -> **12** (widgets) -> **13** (reorder). Each builds on the prior.

Backend (1-7) and frontend (8-13) are mutually independent (endpoints unchanged); do
backend first so the refactor base + tests are green before the larger FE surface.

## 5. Edge cases to honor (from DISCUSSION §4) — checked per relevant ticket

- Not-allowlisted -> sign out + message (ADMIN-CMS-9).
- Token expired mid-session -> already handled by authedFetch's 401-retry (no work).
- 404 on PATCH/DELETE (deleted elsewhere) -> surface "not found" + refresh (10/11).
- BE 400 -> form-level message (11).
- about: edit-only, fixed id (7/10/11/12).
- Slug-id rename does NOT move the doc id (PATCH name keeps the id) — acceptable per
  design; the form edits name without re-slugging (10/11).
- Reorder gaps/concurrency: single-writer, low risk; refetch after each PATCH (13).
- project.technologies dangling skill ids render gracefully (12).

## 6. Per-ticket gates (recap)

- Backend tickets: `cd backend; npx vitest run tests/admin-cms` (scoped unit) + the
  `npm run test:emulator` slice as the local pre-commit gate for any repository/resume
  touch (needs Java/Temurin 21; if the sandbox lacks Java, STOP and have the operator
  run it). Do NOT run the full suite.
- Frontend tickets: `npm run typecheck` (+ `npm run build` from ADMIN-CMS-10 on, since
  static export + `generateStaticParams` is what can break) + the documented manual e2e.

---

### Next phase
```
/wf-implement admin-cms
```
