# Backend Test Harness (S0) — Design Discussion

> **STATUS: LOCKED 2026-06-19.** Decisions log (§5) is the contract for `/wf-plan`.
> Scope = test harness (a) + CI wiring (b). Next phase: `/wf-plan test-harness`.
>
> Session S0 from [planning/feature-roadmap/DISCUSSION.md](../feature-roadmap/DISCUSSION.md).
> High-level testing approach is already LOCKED there (2026-06-19); THIS doc takes it
> code-level: Vitest config, mock seam, emulator wiring, supertest smokes, npm scripts.

## 1. Objective

S0 = **backend test harness + CI wiring** (scope grew per roadmap update 2026-06-19;
CI is no longer "already done"). Two halves:

**(a) Test harness** so the `wf-*` workflow has real `tests/<slug>/` buckets:
- **Vitest**, **unit-heavy** with the repository mocked (services / utils / schemas /
  middlewares in isolation).
- A **thin Firestore-emulator slice** only where it adds value: the generic
  `FirestoreRepository<T>`, domain-specific ordered/filtered queries, and a few
  endpoint smokes (auth gating, Zod validation, one CRUD round-trip).
- Convention: `backend/tests/<slug>/` (mirrors EXECUTION_FLOW.md).
- Frontend stays **typecheck-only**.

**(b) CI wiring** that runs/gates on the harness (roadmap T1 CI/CD update, LOCKED design):
- **New `ci.yml`** — PR gate to `develop` AND `main`: `backend-test` job (vitest unit +
  Firestore-emulator slice via `firebase emulators:exec`, needs Java + firebase-tools)
  + `frontend-check` job (typecheck). Enforced by **branch protection** required checks.
- **`backend-deploy.yml` -> 3 layers** via `needs:`: `test` (unit+emulator) -> `build`
  (push image by SHA) -> `deploy` (gcloud run + health check).
- **`frontend-deploy.yml` -> gated**: `check` (typecheck) -> `build-deploy` (`needs: check`).

**Branch model** (LOCKED): `feat/<slug>` is cut from `develop` (NOT `main`); `develop` =
pure integration (no deploy); PR `feat -> develop`; one PR `develop -> main` at the end
of the whole batch deploys prod. So this harness lands on `feat/test-harness` off
`develop`.

No feature code this session — this session DESIGNS; S0 implementation builds it.

## 2. Grounding / Data Flow (verified against code)

### Module wiring (determines the mock seam)
- Per-domain modules use **namespace function exports**, not classes/DI:
  - Service: `import * as SkillRepository from './skill.repository'`
    ([backend/src/skills/skill.service.ts:1](../../backend/src/skills/skill.service.ts)).
  - Controller: `import * as SkillService from './skill.service'`
    ([backend/src/skills/skill.controller.ts:2](../../backend/src/skills/skill.controller.ts)).
  - Repository: `const repo = new FirestoreRepository<Skill>('skills')` at module top,
    re-exporting thin fns ([backend/src/skills/skill.repository.ts:4](../../backend/src/skills/skill.repository.ts)).
  - => Clean mock seam = `vi.mock('<adjacent module>')`. Service tests mock the
    repository module; controller tests mock the service module. **Zero production-code
    change** (no DI refactor needed).

### Generic repository (emulator target)
- [backend/src/shared/firestore.repository.ts](../../backend/src/shared/firestore.repository.ts):
  `findAll`, `findAllOrdered(field, dir)`, `save`, `update`, `remove`. `update`/`remove`
  branch on `doc.exists` (return null/false) — worth covering against the real emulator.
- Domain query variants: e.g. experiences use `findAllOrdered('startDate')`
  ([backend/src/experiences/experience.repository.ts:6](../../backend/src/experiences/experience.repository.ts)),
  skills use plain `findAll` ([skill.repository.ts:6](../../backend/src/skills/skill.repository.ts)).

### App / HTTP (supertest target)
- [backend/app.ts:54](../../backend/app.ts) `export default app` — Express app with NO
  `listen()` (bin/www listens). supertest imports `app` directly, no port binding.
- Write routes order: `validateSlugId -> authMiddleware -> validate(schema) -> controller`
  ([backend/src/skills/skill.routes.ts:10-13](../../backend/src/skills/skill.routes.ts)).
- Auth = static `x-api-key`, timing-safe vs `config.apiKey`
  ([backend/src/middlewares/auth.middleware.ts](../../backend/src/middlewares/auth.middleware.ts));
  returns 401 (missing), 500 (server has no key), 403 (wrong key).
- Validation = Zod `safeParse` -> 400 with joined message
  ([backend/src/middlewares/validate.middleware.ts](../../backend/src/middlewares/validate.middleware.ts)).

### Firestore client / env
- [backend/src/config/firestore.ts:3](../../backend/src/config/firestore.ts):
  `new Firestore({ ignoreUndefinedProperties: true })` — constructed at import, connects
  lazily, honors `FIRESTORE_EMULATOR_HOST`. Needs a projectId resolvable under the
  emulator (`GCLOUD_PROJECT`/`GOOGLE_CLOUD_PROJECT`).
- [backend/src/config/env.ts](../../backend/src/config/env.ts): `config` reads env at
  import; only throws if `NODE_ENV=production` AND no `API_KEY`. Auth smokes need
  `config.apiKey` set, so tests must inject `API_KEY`.

### Corrected premise
- Task says "ts-node/esm setup." **Vitest does not use ts-node** (esbuild transpiles TS);
  repo is **CommonJS** ([backend/tsconfig.json:4](../../backend/tsconfig.json)). No ESM
  migration, no ts-node test wiring. We keep CJS.

### Existing CI/CD (verified — the files we modify in half b)
- [.github/workflows/backend-deploy.yml](../../.github/workflows/backend-deploy.yml):
  single `deploy` job, trigger `push` to `main` + `paths: ['backend/**']` +
  `workflow_dispatch`. Steps: checkout -> GCP auth (`GCP_SA_KEY`) -> setup-gcloud
  (project `personal-website-490704`) -> docker build/push to Artifact Registry
  (`asia-southeast1`, tag `github.sha`) -> `gcloud run deploy` -> `/health` curl check.
  Action SHAs are pinned. => split into `test -> build -> deploy` with `needs:`.
- [.github/workflows/frontend-deploy.yml](../../.github/workflows/frontend-deploy.yml):
  single `deploy` job, `push` to `main` + `paths: ['frontend/**']`. setup-node@v4
  (node 22, `cache: npm`, `cache-dependency-path: frontend/package-lock.json`),
  `working-directory: frontend`, `npm ci` -> `npm run build` (NEXT_PUBLIC_API_URL) ->
  Firebase Hosting deploy (`channelId: live`, `GCP_SA_KEY`). => prepend a `check`
  (typecheck) job; `build-deploy` gets `needs: check`.
- Both deploy on push to `main` only (unchanged): the new branch model means `main`
  receives the one batch PR from `develop`, so deploy-on-main still ships everything.

### What does NOT exist yet
- No backend `firebase.json` (only `frontend/firebase.json`, hosting only). Emulator
  config + (likely) `firebase-tools` need adding.
- No `vitest`, `supertest` deps; no `tests/` dir; no test scripts in
  [backend/package.json](../../backend/package.json).
- No `ci.yml` (the PR-gate workflow). No branch protection configured (GitHub settings,
  not a repo file — set via `gh api` or the UI; a manual/scripted step, not committable).

## 3. Key Decisions

1. **Mock seam** — LOCKED: **DI refactor (factory functions)**, NOT `vi.mock`. Services
   become `createXService(repo)`, repositories `createXRepository(db)`, controllers
   receive the service; the route file is the composition root. Unit tests inject a fake
   repo/service. (Tradeoff accepted: more production change than `vi.mock`, but cleaner
   seams for the growing domain set in S3.)
2. **DI conversion scope in S0** — LOCKED: convert **only `skills/*`** as the worked
   template + the generic `FirestoreRepository`. The other 8 domains are folded into the
   later sessions that already edit them (S1: about/skills/projects; S3: all, for the
   auth swap). Keeps S0 a small diff.
   - **Backward-compat constraint:** generic `FirestoreRepository` must keep working for
     the 8 unconverted domains (`new FirestoreRepository<T>('collection')`). So its `db`
     becomes an **optional/defaulted constructor param** (default = the existing `db`
     singleton, which already honors `FIRESTORE_EMULATOR_HOST`). Skills + tests inject;
     the rest compile unchanged.
3. **Unit vs emulator split & run model** — LOCKED: emulator tests use the
   `*.emulator.test.ts` suffix. `npm test` runs **unit only** (fast, no emulator);
   `npm run test:emulator` wraps the emulator suite in `firebase emulators:exec`;
   `npm run test:all` runs both.
4. **`firebase-tools` provisioning** — LOCKED: add as a **backend devDependency**
   (pinned). Reproducible via `npm ci`. (Still requires a Java runtime on the machine —
   noted as an environment prereq, not a dep we can vendor.)
5. **S0 deliverable example tests** — LOCKED: **one of each kind** under
   `backend/tests/test-harness/` as the canonical template — a service unit test
   (injected fake repo), an endpoint smoke (supertest: auth gate + Zod 400 + one CRUD
   round-trip), and a generic-repository emulator test.
6. **Test env injection** (`API_KEY`, projectId) — LOCKED (proposed default): a Vitest
   setup file referenced from `vitest.config.ts` sets `API_KEY` (so auth smokes have a
   key) and the emulator project id. Low-stakes; revisit if it gets in the way.
7. **Coverage tooling** — LOCKED (proposed default): **skip** `@vitest/coverage-*` for
   now; add later if CI gating is wanted (parking lot).

### CI wiring (half b)
8. **`ci.yml` jobs vs required-check path-filter gotcha** — LOCKED: **always run BOTH**
   `backend-test` + `frontend-check` on every PR (no path filter), trigger
   `pull_request` to `develop`/`main`. Avoids the stuck "Expected — Waiting for status"
   trap that path-filtered required checks cause.
9. **Emulator project id in CI + local** — LOCKED: **`demo-test`** (Firebase demo-*
   convention, emulator-only, no GCP creds). `firebase emulators:exec --project
   demo-test`; tests use it as the SDK projectId. CI test gate stays credential-free.
10. **`frontend-check` scope** — LOCKED: **typecheck only** (`npm run typecheck`); lint
    parked.
11. **firebase-tools in CI** — LOCKED (consistent w/ decision 4): reuse the **local
    backend devDep** (`npm ci` then `npx firebase emulators:exec ...` via an npm script),
    not a global install. Java via `actions/setup-java` (Temurin 17) — proposed default.

## 4. Edge Cases
- Repo `update`/`remove` on missing doc -> null/false (emulator test).
- `findAllOrdered` ordering direction (default desc) vs domain usage.
- Auth: 401 missing key vs 403 wrong key vs 500 server-misconfigured (no API_KEY).
- Emulator data bleed between tests -> clear Firestore between emulator test files
  (emulator REST `DELETE /emulator/v1/projects/<id>/databases/(default)/documents`).
  Implementation detail for the plan.
- Vitest parallelism vs shared emulator collections -> run the emulator suite serially
  (e.g. single fork / no file-parallelism) OR namespace collections per test. Plan detail.
- DI cascade: skills `controller`/`routes` change too (routes = composition root). The
  endpoint smoke runs against the real `app` (emulator-backed) — skills wired via DI,
  the other 8 domains still wired the old way; both must boot fine.

## 5. Decisions Log (the contract)
- 2026-06-19 — Mock seam LOCKED: **DI via factory functions** (service takes repo,
  controller takes service, route = composition root); NOT `vi.mock`. Rationale: cleaner
  seams for the domain set growing in S3, at the cost of more production change now.
- 2026-06-19 — DI scope LOCKED: S0 converts **only `skills/*` + generic
  `FirestoreRepository`** as the template; other 8 domains fold into S1/S3. Generic repo
  `db` becomes an **optional/defaulted ctor param** so unconverted domains compile
  unchanged.
- 2026-06-19 — Run model LOCKED: `*.emulator.test.ts` suffix; `npm test` = unit-only,
  `npm run test:emulator` = `firebase emulators:exec` wrapper, `npm run test:all` = both.
- 2026-06-19 — `firebase-tools` LOCKED: pinned **backend devDependency** (Java runtime is
  an environment prereq).
- 2026-06-19 — S0 example tests LOCKED: **one of each kind** (service unit / endpoint
  smoke / generic-repo emulator) under `backend/tests/test-harness/`.
- 2026-06-19 — Test env LOCKED (default): Vitest setup file injects `API_KEY` +
  emulator project id via `vitest.config.ts`.
- 2026-06-19 — Coverage LOCKED (default): **skip** coverage tooling for now (parking lot).
- 2026-06-19 — Test coverage is **incremental per-session**, NOT exhaustive in S0.
  S0 ships only `skills` + generic repo as the template. Other domains get tests in the
  session that already edits them: **S1** (about/skills/projects/categories), **S3** (the
  big one — all remaining domains get DI + service/endpoint tests, since admin needs full
  CRUD per domain), **S4/S5** (new posts/dailyLogs domains). Guiding rule: do NOT
  duplicate identical CRUD tests across 9 domains — the generic `FirestoreRepository`
  emulator test covers the shared path once, `skills` covers the per-domain pattern, and
  other domains add tests ONLY where they deviate (e.g. `experiences` `findAllOrdered`,
  `projects` complex schema/refs). Mirror in roadmap doc so other-session agents see it.
- 2026-06-19 — Corrected premise: Vitest uses esbuild, not ts-node; repo stays
  **CommonJS** — no ESM/ts-node test wiring.
- 2026-06-19 — **S0 scope grew to harness + CI wiring** (roadmap T1 update). CI design
  inherited as LOCKED from [feature-roadmap](../feature-roadmap/DISCUSSION.md): new
  `ci.yml` PR gate (backend unit+emulator, frontend typecheck) + branch protection;
  3-layer `backend-deploy` (test->build->deploy via `needs:`); gated `frontend-deploy`
  (check->build-deploy). CI test scope = unit + emulator.
- 2026-06-19 — Branch model LOCKED (roadmap): `feat/<slug>` from `develop`; `develop`
  no-deploy integration; one `develop -> main` PR ships the batch. This harness lands on
  `feat/test-harness` off `develop`.
- 2026-06-19 — firebase-tools in CI LOCKED: reuse local backend devDep via npm script;
  Java via `actions/setup-java` Temurin 17 (proposed default).
- 2026-06-19 — CI decision 8 LOCKED: `ci.yml` runs **both** `backend-test` +
  `frontend-check` on every PR (NO path filter) — avoids the required-check + path-filter
  stuck-PR trap; trigger `pull_request` to `develop` and `main`.
- 2026-06-19 — CI decision 9 LOCKED: emulator project id = **`demo-test`** (demo-*
  convention) for CI and local. CI test gate needs Java + firebase-tools but **NO
  `GCP_SA_KEY`** — pure unit+emulator, credential-free.
- 2026-06-19 — CI decision 10 LOCKED: `frontend-check` = **typecheck only**
  (`npm run typecheck`); lint stays parked.

## 6. Parking Lot / Later
- Coverage thresholds / CI gating of tests.
- Wiring `npm test` into the backend GitHub workflow.
- Firebase Auth (T6) token-verification test helpers — future session, not S0.
