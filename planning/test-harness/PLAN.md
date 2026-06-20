# Backend Test Harness (S0) — Implementation Plan

> Derived from [DISCUSSION.md](DISCUSSION.md) (LOCKED 2026-06-19). Honors every entry
> in its Decisions Log (§5). Branch: `feat/test-harness` cut from `develop`.
> One commit per ticket. Scoped tests only — never the full suite.

## Drift check (Phase 0 — done)

Verified the design's code citations against current source; **all match**, no drift:

- [firestore.repository.ts](../../backend/src/shared/firestore.repository.ts) — class
  `FirestoreRepository<T>`, ctor `(private collection: string)`, methods
  `findAll / findAllOrdered / save / update / remove`; `update`/`remove` branch on
  `doc.exists`. (TH-2 adds the optional `db` ctor param.)
- skills [repository](../../backend/src/skills/skill.repository.ts) /
  [service](../../backend/src/skills/skill.service.ts) /
  [controller](../../backend/src/skills/skill.controller.ts) /
  [routes](../../backend/src/skills/skill.routes.ts) — namespace function exports as
  described; PATCH/DELETE order `validateSlugId -> authMiddleware -> validate -> controller`,
  POST `authMiddleware -> validate -> controller`.
- [auth.middleware.ts](../../backend/src/middlewares/auth.middleware.ts) — 401 missing,
  500 no server key, 403 wrong key (timing-safe). [validate.middleware.ts](../../backend/src/middlewares/validate.middleware.ts) — 400 with joined message.
- [env.ts](../../backend/src/config/env.ts) — `config` reads env at import; only throws
  when `NODE_ENV=production` AND no `API_KEY`. `config.apiKey` is a plain mutable property
  (lets the smoke flip it to exercise the 500 path).
- [firestore.ts](../../backend/src/config/firestore.ts) — `new Firestore({ ignoreUndefinedProperties: true })`,
  no explicit projectId (resolves from `GCLOUD_PROJECT`/`GOOGLE_CLOUD_PROJECT`; honors
  `FIRESTORE_EMULATOR_HOST`).
- [app.ts](../../backend/app.ts) — `export default app`, no `listen()`; **write rate
  limiter = 20 / 15 min on `/api` for POST/PATCH/DELETE** (see Edge Cases — constrains the smoke).
- [package.json](../../backend/package.json) — CommonJS, no vitest/supertest/firebase-tools yet,
  no `tests/`. [tsconfig.json](../../backend/tsconfig.json) — `module: commonjs` (confirms
  "stays CJS, no ts-node" premise).
- CI: [backend-deploy.yml](../../.github/workflows/backend-deploy.yml) single `deploy` job,
  [frontend-deploy.yml](../../.github/workflows/frontend-deploy.yml) single `deploy` job,
  both `push` to `main` + path filter + `workflow_dispatch`; action SHAs pinned. No `ci.yml`.

## Sequencing rationale

Harness foundation first, then the example tests it enables, then CI that invokes the
scripts those tickets create:

```
TH-1 (vitest + unit scripts)        -> TH-2 needs it to run a unit test
TH-2 (skills DI + service unit test) -> establishes the mock seam; TH-4 smoke runs the DI-wired app
TH-3 (emulator wiring + repo test)   -> creates `test:emulator` / `test:all` scripts + firebase.json
TH-4 (endpoint smoke, emulator-backed) -> reuses TH-2 DI + TH-3 emulator wiring
TH-5 ci.yml          -> invokes `npm test` (TH-1) + `npm run test:emulator` (TH-3) + FE typecheck
TH-6 backend-deploy  -> 3-layer; `test` layer reuses the same scripts
TH-7 frontend-deploy -> gate typecheck before build-deploy
```

Each ticket is independently shippable and carries its own scoped proof. Tickets touch
only `backend/` and `.github/workflows/` (plus FE typecheck is a no-op verify) — no
frontend code changes.

---

## TH-1 — Vitest harness: tooling, config, setup, unit scripts + sample unit test  [DONE]

**Scope.** Stand up the unit-test runner (esbuild/CJS, no ts-node — DISCUSSION §3
corrected premise). Prove it runs with one pure-function test, no production change.

**Files to touch (backend/):**
- `package.json` — add devDeps **pinned**: `vitest`, `@vitest/...` NOT included (coverage
  parked, decision 7). Add `supertest` + `@types/supertest` here too (used in TH-4) OR
  defer to TH-4 — defer to keep TH-1 minimal. Add script `"test": "vitest run"`.
- `vitest.config.ts` (new) — `defineConfig`: `test.environment = 'node'`,
  `test.include = ['tests/**/*.test.ts']`, `test.exclude = [..., '**/*.emulator.test.ts']`
  (default run = unit only, decision 3), `test.setupFiles = ['tests/setup.ts']`. No `-b`,
  single config (mirrors the FE single-config note conceptually).
- `tests/setup.ts` (new) — inject test env (decision 6): set `process.env.API_KEY` (e.g.
  `'test-api-key'`) and `process.env.GCLOUD_PROJECT='demo-test'` / `GOOGLE_CLOUD_PROJECT='demo-test'`
  **only if unset** (so `emulators:exec --project demo-test` wins in CI). setupFiles run
  before test-file module evaluation, so `env.ts`'s import-time read sees `API_KEY`.
- `tests/test-harness/slug.util.test.ts` (new) — unit-test [toSlug](../../backend/src/utils/slug.util.ts):
  lowercasing, non-alnum -> `-`, trailing-dash trim. Pure fn, no mocks — proves the harness.
- `.gitignore` — (already ignores `planning/`, `.env`) no change expected; confirm
  `node_modules` covered at install (out of scope if pre-existing).

**Acceptance criteria.**
- `npx vitest run tests/test-harness` (or `npm test`) discovers and passes the slug test.
- `npm test` does NOT attempt to run any `*.emulator.test.ts` (none exist yet — verify the
  exclude glob by adding a temp dummy emulator file mentally / via the TH-3 run).
- `tsc` (build) still green; no production file changed.

**Scoped tests.** `npx vitest run tests/test-harness` (the slug unit test is the proof).

**Commit.** `test(backend): add vitest unit harness + sample util test (test-harness TH-1)`

---

## TH-2 — Skills DI refactor + generic-repo `db` param + service unit test  [DONE]

**Scope.** Decisions 1 & 2: convert **only** `skills/*` + the generic `FirestoreRepository`
to dependency injection via factory functions. Route file = composition root. Behavior
identical; the 8 other domains compile unchanged.

**Files to touch (backend/):**
- `src/shared/firestore.repository.ts` — add **optional/defaulted** `db` ctor param:
  `constructor(private collection: string, private db: Firestore = defaultDb)` where
  `defaultDb` is the existing singleton import (renamed local binding). Replace internal
  `db.collection(...)` with `this.db.collection(...)`. **Backward-compat:** existing
  `new FirestoreRepository<T>('collection')` calls in the 8 unconverted domains keep
  working (default applies). Type the param `import { Firestore } from '@google-cloud/firestore'`.
- `src/skills/skill.repository.ts` — replace module-level `const repo = new ...` + namespace
  exports with `export const createSkillRepository = (db?: Firestore) => { const repo = new
  FirestoreRepository<Skill>('skills', db); return { findAll, save, update, remove } }`
  (thin closures over `repo`). Export the returned shape as a `SkillRepository` type for the
  service signature.
- `src/skills/skill.service.ts` — `export const createSkillService = (repo: SkillRepository)
  => ({ getAll, insert, update, deleteById })`; bodies call `repo.*`. Export `SkillService` type.
- `src/skills/skill.controller.ts` — `export const createSkillController = (service:
  SkillService) => ({ getAll, insert, update, remove })`; same Express handler bodies, now
  closing over injected `service`. Preserve 404 handling + `toSlug(req.body.name)` id.
- `src/skills/skill.routes.ts` — **composition root:** `const repo = createSkillRepository();`
  `const service = createSkillService(repo);` `const controller = createSkillController(service);`
  then wire the 4 routes to `controller.*`. Middleware order **unchanged**.
- `tests/test-harness/skill.service.test.ts` (new) — inject a **fake repo** (plain object
  with `vi.fn()` stubs); assert: `getAll` -> repo.findAll passthrough; `insert` -> repo.save
  with the passed Skill; `update` -> repo.update(id, partial) returns updated / `null` on
  missing; `deleteById` -> repo.remove returns boolean. No emulator, no real Firestore.

**Acceptance criteria.**
- `tsc` green across the whole backend (all 9 domains + app) — the 8 unconverted repos still
  compile against the new optional-param ctor.
- App boots: routes mounted (skills DI-wired, others legacy) — smoke via TH-4 / a quick
  `npm run dev` is acceptable manual confirmation; primary proof is the unit test + build.
- Service unit test passes with the fake repo (zero Firestore access).

**Scoped tests.** `npx vitest run tests/test-harness -t "skill service"` (and the existing
slug test still green). Plus `npm run build` for the cross-domain compile check.

**Commit.** `refactor(backend): convert skills to DI factories + repo db param (test-harness TH-2)`

---

## TH-3 — Firestore emulator wiring + generic `FirestoreRepository` emulator test  [DONE]

**Scope.** Decisions 3, 4, 9: bring up the emulator slice. Add `firebase-tools` (pinned
devDep), backend `firebase.json`, the `test:emulator` / `test:all` scripts, the emulator
vitest config (serial), and the first `*.emulator.test.ts` against the real generic repo.

**Files to touch (backend/):**
- `package.json` — add devDep **`firebase-tools`** (pinned, decision 4). Scripts:
  - `"test:emulator": "firebase emulators:exec --only firestore --project demo-test \"vitest run --config vitest.emulator.config.ts\""`
  - `"test:all": "npm test && npm run test:emulator"`
  (`emulators:exec` auto-sets `FIRESTORE_EMULATOR_HOST` + `GCLOUD_PROJECT=demo-test` for the
  wrapped process; the SDK singleton picks them up.)
- `firebase.json` (new, backend/) — `{ "emulators": { "firestore": { "port": <e.g. 8080-range, pick a free one e.g. 8088> }, "ui": { "enabled": false } }, "firestore": { "rules": "firestore.rules" } }`.
  Run from `backend/` so this file is found.
- `firestore.rules` (new, backend/) — permissive emulator rules
  (`allow read, write: if true;`) — emulator-only, never deployed.
- `vitest.emulator.config.ts` (new) — extends the base: `test.include =
  ['tests/**/*.emulator.test.ts']`, `test.fileParallelism = false` (serial — decision/edge:
  shared `demo-test` collections), same `setupFiles`.
- `tests/test-harness/firestore.repository.emulator.test.ts` (new) — construct
  `new FirestoreRepository<{id:string; name:string}>('th_emulator_probe')` (default db,
  emulator-routed via env). Cover: `save` then `findAll` returns it; `findAllOrdered(field,
  dir)` ordering (asc & default desc); `update` existing returns merged, **missing -> null**;
  `remove` existing -> true, **missing -> false**. `beforeEach`/`afterEach` clears the
  collection (or the whole DB) via emulator REST
  `DELETE http://<FIRESTORE_EMULATOR_HOST>/emulator/v1/projects/demo-test/databases/(default)/documents`
  to prevent data bleed (edge case).
- `.gitignore` — add emulator debris: `firebase-debug.log`, `firestore-debug.log`,
  `ui-debug.log`, `*-debug.log` (and any `firebase-export-*`). Keep it scoped.

**Acceptance criteria.**
- `npm run test:emulator` boots the Firestore emulator (project `demo-test`, no GCP creds)
  and the repo emulator test passes, covering the `doc.exists` null/false branches +
  ordering.
- Re-running is clean (DB cleared between tests; no bleed).
- `npm test` (unit) still EXCLUDES this file (proves the suffix split, decision 3).
- Requires Java at runtime (environment prereq — note in PR if it must be installed).

**Scoped tests.** `npm run test:emulator` (or
`firebase emulators:exec --only firestore --project demo-test "npx vitest run --config vitest.emulator.config.ts tests/test-harness"`).

**Commit.** `test(backend): add firestore emulator wiring + generic repo emulator test (test-harness TH-3)`

---

## TH-4 — Skills endpoint smoke (supertest, emulator-backed)  [DONE]

**Scope.** Decision 5 (endpoint-smoke kind): supertest against the real `app` (DI-wired
skills + legacy domains both boot). Covers auth gating, Zod 400, one CRUD round-trip.

**Files to touch (backend/):**
- `package.json` — add devDeps **pinned** `supertest` + `@types/supertest` (if not already
  in TH-1).
- `tests/test-harness/skill.endpoint.emulator.test.ts` (new, `*.emulator.test.ts` because the
  CRUD round-trip hits the real emulator). Using `supertest(app)`:
  - **Auth gate:** `POST /api/skills` with no `x-api-key` -> **401**; wrong key -> **403**;
    server-misconfigured -> **500** by temporarily setting `config.apiKey = undefined`
    (save/restore in try/finally; middleware reads it live).
  - **Validation:** `POST /api/skills` with valid key but bad body (e.g. missing `name`) ->
    **400** with a joined Zod message.
  - **CRUD round-trip:** `POST` a valid skill (valid key) -> **201** `{success, data}` (id =
    `toSlug(name)`); `GET /api/skills` (public) -> contains it; `PATCH /api/skills/:id`
    (valid key) -> **200** updated; `DELETE /api/skills/:id` (valid key) -> **200**;
    follow-up `GET` no longer lists it.
  - `beforeEach`/`afterEach` clear the emulator DB (reuse the TH-3 helper — consider a small
    `tests/helpers/emulator.ts` to share the clear-DB + a `withApiKey` header helper).

**Acceptance criteria.**
- All auth branches (401/403/500), the 400, and the full CRUD round-trip pass against the
  emulator-backed app.
- Stays under the **20-writes / 15-min** write rate-limit (Edge Cases): the file performs
  ~7 writes (401, 403, 500, 400, POST, PATCH, DELETE) — well under 20; keep it that way, do
  NOT add many more write assertions in this file. (If it ever bites, park a test-env limiter
  bypass — do NOT expand production scope in S0.)
- `npm test` (unit) excludes this file; it runs only under the emulator scripts.

**Scoped tests.** `npm run test:emulator` (runs TH-3 + TH-4 emulator files), or
`-t "skill endpoint"` to isolate.

**Commit.** `test(backend): add skills endpoint smoke (auth + zod + CRUD) (test-harness TH-4)`

---

## TH-5 — New `ci.yml` PR gate (backend-test + frontend-check)  [DONE]

**Scope.** Decisions 8, 9, 10, 11: a prevention-layer workflow that runs on every PR to
`develop` and `main`, **both jobs always** (no path filter — avoids the required-check +
path-filter stuck-PR trap), credential-free.

**Files to touch:**
- `.github/workflows/ci.yml` (new):
  - `on: pull_request: branches: [develop, main]` (NO `paths:`).
  - `permissions: contents: read`.
  - **job `backend-test`** (`defaults.run.working-directory: backend`):
    `actions/checkout@<pinned SHA>` -> `actions/setup-node@<pinned>` (node 22, `cache: npm`,
    `cache-dependency-path: backend/package-lock.json`) -> `npm ci` -> `npm test` (unit) ->
    `actions/setup-java@<pinned>` (Temurin 17, decision 11) -> `npm run test:emulator`
    (firebase-tools from the local devDep via the npm script — no global install). **No
    `GCP_SA_KEY`** (decision 9 — pure unit+emulator).
  - **job `frontend-check`** (`working-directory: frontend`): checkout -> setup-node 22
    (`cache-dependency-path: frontend/package-lock.json`) -> `npm ci` -> `npm run typecheck`
    (decision 10; lint parked).
  - Pin all action SHAs (match the existing workflows' pinning style).
- **Non-committable follow-up (appendix, not a file):** branch protection on `develop` +
  `main` requiring checks `backend-test` + `frontend-check` — set via `gh api` / GitHub UI
  AFTER this lands on origin (a PR must run once so the check names register). Document the
  `gh api` snippet in the PR body; not part of the commit.

**Acceptance criteria.**
- Workflow YAML is valid (lint locally e.g. `npx --yes @action-validator ...` optional, or
  visual + a draft PR once pushed). Both jobs defined, both unconditional, trigger correct.
- `backend-test` needs Java + firebase-tools only (no GCP secret referenced).
- Note: real execution is only observable once pushed and a PR is opened (deferred to the
  push/PR step, which is human-gated per EXECUTION_FLOW).

**Scoped tests.** No vitest scope (workflow file). Verify by YAML validity + a dry read; the
scripts it calls (`npm test`, `npm run test:emulator`, `npm run typecheck`) are already
proven green in TH-1/3 and the FE typecheck.

**Commit.** `ci(backend): add PR-gate ci.yml (backend test + frontend typecheck) (test-harness TH-5)`
> (commit `<scope>` is `backend`/`frontend` per convention; for a cross-cutting CI file use
> `backend` as primary since the gate is backend-heavy, or `ci` type with no scope — prefer
> `ci(backend)` to satisfy the convention's scope slot. Confirm in TH-5 Stage B if unsure.)

---

## TH-6 — `backend-deploy.yml` -> 3-layer test -> build -> deploy  [DONE]

**Scope.** Split the single `deploy` job into `test -> build -> deploy` via `needs:`,
keeping the existing build/push/deploy/health-check behavior. Trigger unchanged
(`push: main`, `paths: backend/**`, `workflow_dispatch`).

**Files to touch:**
- `.github/workflows/backend-deploy.yml`:
  - **job `test`** (working-directory backend, credential-free): checkout -> setup-node 22
    (cache) -> `npm ci` -> `npm test` -> setup-java Temurin 17 -> `npm run test:emulator`.
  - **job `build`** `needs: test`: the existing checkout -> GCP auth (`GCP_SA_KEY`) ->
    setup-gcloud (`personal-website-490704`) -> configure-docker -> docker build/push
    (tag `github.sha` to `asia-southeast1-docker.pkg.dev/.../backend`). Image is carried by
    the SHA tag in Artifact Registry — **no artifact upload** needed between jobs.
  - **job `deploy`** `needs: build`: GCP auth -> setup-gcloud -> `gcloud run deploy` (same
    flags incl. `--set-env-vars "^@^NODE_ENV=...@API_KEY=...@ALLOWED_ORIGINS=..."`) ->
    `/health` curl verify. (`build` and `deploy` each re-auth to GCP — jobs don't share auth.)
  - Keep all action SHAs pinned; preserve `max-instances=1`, `--port 8080`, region.

**Acceptance criteria.**
- Three jobs chained by `needs:`; deploy cannot run if `test` fails.
- Build/deploy steps byte-for-byte equivalent in effect to today (same image tag scheme, same
  run flags, same health check).
- No behavioral change to what reaches prod on push to `main`.

**Scoped tests.** Workflow validity only; the `test` layer reuses the same scripts proven in
TH-1/TH-3. Real run observable only post-push (human-gated).

**Commit.** `ci(backend): gate cloud run deploy behind test+build layers (test-harness TH-6)`

---

## TH-7 — `frontend-deploy.yml` -> gated check -> build-deploy  [DONE]

**Scope.** Prepend a `check` (typecheck) job; existing build+firebase-deploy becomes
`build-deploy` with `needs: check`. Trigger unchanged (`push: main`, `paths: frontend/**`,
`workflow_dispatch`).

**Files to touch:**
- `.github/workflows/frontend-deploy.yml`:
  - **job `check`** (working-directory frontend): checkout -> setup-node 22 (cache,
    `cache-dependency-path: frontend/package-lock.json`) -> `npm ci` -> `npm run typecheck`.
  - **job `build-deploy`** `needs: check`: the existing checkout -> setup-node -> `npm ci` ->
    `npm run build` (env `NEXT_PUBLIC_API_URL`) -> Firebase Hosting deploy (`channelId: live`,
    `firebaseServiceAccount: GCP_SA_KEY`, `entryPoint: ./frontend`). Pinned SHAs preserved.

**Acceptance criteria.**
- `build-deploy` cannot run if typecheck fails.
- Deploy behavior unchanged (same channel, same secrets, same entryPoint).

**Scoped tests.** `cd frontend && npm run typecheck` locally (bare `tsc --noEmit`, **no `-b`**)
to confirm the gate command is green before wiring it. Workflow validity by read.

**Commit.** `ci(frontend): gate hosting deploy behind typecheck (test-harness TH-7)`

---

## Edge cases carried into tickets (from DISCUSSION §4)

| Edge case | Handled in | How |
|---|---|---|
| `update`/`remove` on missing doc -> null/false | TH-3 | explicit assertions on the `doc.exists` branches |
| `findAllOrdered` direction (default desc) | TH-3 | assert asc + default-desc ordering |
| Auth 401 vs 403 vs 500 | TH-4 | three supertest cases; 500 via temp `config.apiKey = undefined` |
| Emulator data bleed | TH-3, TH-4 | clear DB via emulator REST `DELETE .../documents` in before/after |
| Vitest parallelism vs shared emulator | TH-3 | `fileParallelism: false` in `vitest.emulator.config.ts` |
| DI cascade (skills routes = composition root; 8 domains legacy) | TH-2 | optional/defaulted repo `db` param keeps legacy compiling; smoke boots both (TH-4) |
| **Write rate-limit (20 / 15 min) vs supertest writes** | TH-4 | keep the smoke <= ~7 writes; park an env bypass rather than change prod in S0 |
| Unit run must exclude emulator tests | TH-1, TH-3 | `*.emulator.test.ts` suffix + `exclude` glob (default) / separate include (emulator config) |

## Out of scope (parking lot — DISCUSSION §6)

Coverage tooling (decision 7); wiring `npm test` into more workflows beyond the three here;
Firebase-Auth token-verification test helpers (T6/S3); converting the other 8 domains to DI
(folded into S1/S3). Branch protection config is operational (post-push `gh api`/UI), not a
commit.

---

## Handoff

```
/wf-implement test-harness
```
