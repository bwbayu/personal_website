# Feature Roadmap — High-Level Design Discussion

> Scope of THIS doc: high-level / architectural decisions only across multiple
> features. Code-level detail for each task is deferred to its own focused
> session. Each task below will graduate into its own `planning/<slug>/` doc when
> it goes deep.

## 1. Objective

Bayu wants to plan a batch of features/changes for the personal website at an
architectural level, decide the big trade-offs up front, then execute each task
one-by-one in dedicated sessions. This doc is the shared contract for those
decisions.

## 2. Grounding / Current Architecture (verified against code)

- **Monorepo**: `backend/` (Express + TS on Cloud Run) + `frontend/` (Next.js 14
  static export on Firebase Hosting). DB = Cloud Firestore.
- **Backend** per-domain modules (controller/service/repository/routes/schema/type)
  for 9 domains: about, skills, projects, experiences, educations, certifications,
  achievements, mediaSocials, resume — `backend/src/routes/index.ts:18-26`.
  - Shared generic `FirestoreRepository<T>` — `backend/src/shared/firestore.repository.ts`.
  - Auth = single static API key via `x-api-key`, timing-safe compare,
    protects write routes only; reads public — `backend/src/middlewares/auth.middleware.ts`.
  - Hardening: helmet, CORS allow-list, Zod, read/write rate limits, Swagger (non-prod).
- **Frontend** static export (`output: 'export'`), data fetched CLIENT-SIDE at
  runtime via `useApi` + `app/api/*` fetchers — `frontend/lib/useApi.ts`.
  3 pages: home, project, resume.
- **CI/CD ALREADY EXISTS**: `.github/workflows/{backend,frontend}-deploy.yml`,
  path-filtered, deploy on push to `main`.

### Known doc/code discrepancy
- `DEPLOYMENT.md:12` claims FE embeds data at build time; actual code fetches
  client-side at runtime (`cache: 'no-store'`). Docs lag code. (Parking lot.)

## 3. Tasks & Key Decisions

| # | Task | Status |
|---|------|--------|
| T1 | CI/CD on push to main (FE + BE) | RESOLVED (already implemented) |
| T2 | Remove skill year/proficiency; add `order` field | LOCKED — per-category order + category order |
| T3 | Sync skills used in Projects with "My Toolbox" skills | LOCKED — reference skill IDs (single source) |
| T4 | Remove `headline` everywhere | LOCKED — full removal |
| T5 | Admin/CMS: same repo vs separate repo | LOCKED — same app, /admin route group |
| T6 | Auth method for admin login | LOCKED — Firebase Auth Google + email allowlist |
| T7 | Admin/CMS frontend approach per domain | LOCKED — config-driven scaffold + custom widgets |
| T8 | Backend API completeness (reorder, add-category, etc.) | LOCKED — additive; categories→collection |
| T9 | Blog (Medium-like) + Daily log features | LOCKED — Firestore collections + static pre-render w/ rebuild-on-publish |
| T10 | DB: stay on Firestore vs migrate to SQL on GCP | LOCKED — stay on Firestore |
| T11 | SEO pre-render of existing public pages (home/projects/resume) | LOCKED — defer to S6; reuse S4 rebuild + build-fetch foundation |

---

### T1 — CI/CD (RESOLVED — already implemented)

Findings from the existing workflows:
- **Frontend** (`frontend-deploy.yml`): on push to `main` touching `frontend/**`
  (+ manual `workflow_dispatch`). Steps: checkout → setup Node 22 → `npm ci` →
  `npm run build` (with `NEXT_PUBLIC_API_URL` secret) → deploy to Firebase Hosting
  `live` channel via `FirebaseExtended/action-hosting-deploy`, auth using
  `GCP_SA_KEY`. So: **yes, simple build + firebase deploy**, and **yes a service
  account is needed** — reused via the `GCP_SA_KEY` secret.
- **Backend** (`backend-deploy.yml`): on push to `main` touching `backend/**`.
  Steps: checkout → `google-github-actions/auth` (GCP_SA_KEY) → setup gcloud →
  configure docker for Artifact Registry → build & push image tagged by
  `github.sha` → `gcloud run deploy` (env vars via `^@^` delimiter) → health check.
  So: **yes, the BE flow is exactly build image → push to Artifact Registry →
  deploy Cloud Run**, plus a post-deploy `/health` verification.
- Both share ONE service account secret `GCP_SA_KEY` with roles: run.admin,
  artifactregistry.writer, iam.serviceAccountUser, firebasehosting.admin,
  datastore.user (per `DEPLOYMENT.md`).

Open follow-ups (only if relevant later): SA key is long-lived JSON — could move to
Workload Identity Federation (keyless) eventually; not urgent for a personal site.

**CI/CD update for testing (LOCKED — design; implemented in S0).** Adding the test
harness reopens CI. Agreed design:
- **New `ci.yml`** (prevention layer) — trigger `pull_request` to `develop` and
  `main` (path-filtered): `backend-test` job (Node 22 -> npm ci -> vitest unit ->
  setup Java + firebase-tools -> `firebase emulators:exec --only firestore "vitest run"`
  for the emulator slice) + `frontend-check` job (npm ci -> `npm run typecheck`,
  optional lint). Enforce via branch protection (required status checks) on develop
  and main so red code can't be merged.
- **`backend-deploy.yml` -> 3 layers** with `needs:`: `test` (unit + emulator) ->
  `build` (build+push image by github.sha) -> `deploy` (gcloud run deploy + health
  check). Image passed via Artifact Registry tag (no artifact upload needed).
- **`frontend-deploy.yml` -> gated**: `check` (typecheck) job -> `build-deploy` job
  with `needs: check` (next build + firebase deploy in one job; no artifact passing).
- CI test scope = unit + emulator (LOCKED). Belongs to S0 (CI wiring lands with the
  harness it invokes).

---

### T2 — Remove skill year/proficiency; add `order` (LOCKED)

- Delete `proficiency` (seeder field `experience`: "1+ years"/"<1 years"/
  "Just Familiar") from schema/type/seed/UI. Toolbox shows skill NAME only
  (proficiency tooltip removed).
- Add `order` field. **Scope = per-category**: `order` ranks skills within their
  category; the new `categories` collection (T8) also carries its own `order` to
  arrange category sequence in the Toolbox. Two-level control.

### T3 — Sync Project technologies with Toolbox skills (LOCKED)

- Grounding: skills seed already contains `isShow:false` "project-only skills"
  (`backend/src/database/seeds/skills.seed.ts:40`) — model already trends toward
  skills collection as the single source.
- Decision: `project.technologies` **references skill IDs** from the `skills`
  collection (single source of truth). `isShow` controls Toolbox visibility.
  Icons (iconClass/iconImage) live on the skill. At build, project pages resolve
  skillId → skill data. Eliminates drift; icons maintained in one place.

### T4 — Remove `headline` (LOCKED — full removal)

- `headline` is defined but UNUSED in rendered UI (HomeClient uses name + email
  only). Remove across: `backend/src/about/about.type.ts`,
  `about.schema.ts`, `database/seeds/about.seed.ts`, `config/swagger.ts`,
  `frontend/app/types/resume.ts`.

### T5 — Admin/CMS location (LOCKED — same app, /admin route group)

- Admin lives as a `/admin` route group inside the existing Next.js app. Stays
  static + client-fetch (no SEO needed). Rationale: simplest, shares
  types/components, single deploy. Admin code being publicly served is not a real
  risk since all mutations are enforced by BE auth.

### T6 — Auth (LOCKED — Firebase Auth Google + email allowlist)

- Admin login via Firebase Auth Google provider, restricted to Bayu's Gmail.
  BE verifies Firebase ID token via Admin SDK on write routes (replaces/augments
  the static `x-api-key`). No password to manage; effectively free.
- Existing static API key may remain for seed/CLI scripts.

### T7 — Admin/CMS FE per domain (LOCKED)

- Config-driven CRUD scaffold (shared list table + form driven by per-domain
  field config) + custom widgets for complex domains (project, blog post:
  array fields, markdown editor, tech-picker). Chosen for efficiency/consistency
  across ~10 domains.

### T8 — Backend API completeness (LOCKED — mostly additive)

- Existing per-domain CRUD is complete (getAll/POST/PATCH/:id/DELETE/:id; no GET/:id).
- Additions:
  1. New domains `posts` + `dailyLogs` (full CRUD).
  2. Auth swap on write routes: `x-api-key` → Firebase ID token verification (T6).
  3. Reorder via PATCH `order`; optional bulk-reorder endpoint (nice-to-have).
  4. `GET /:id` optional (edit forms can reuse list data).
  5. **Categories → Firestore collection** (CRUD-able from admin, no redeploy);
     replaces the hardcoded enum in `skill.schema.ts`. Categories can carry their
     own `order` too.

### T9 — Blog + Daily log (LOCKED — high level)

- Both are new Firestore collections + new BE domains + new FE pages, following
  existing per-domain pattern.
  - `posts` (blog, polished): title, slug, cover, content, tags[], status
    (draft/published), publishedAt, derived reading time. URL `/blog/<slug>`.
    No comments/claps (no audience auth).
  - `dailyLogs` (unscripted): date, short content, optional tags/mood. Timeline feed.
- **Rendering = Option B (LOCKED):** stay on Firebase static hosting; pre-render
  blog/daily-log at BUILD time for full SEO/OG; publishing from admin triggers a
  rebuild via GitHub `workflow_dispatch`. Drafts previewed in admin via client
  fetch. Implication: a few-minutes delay publish→live; admin must hold a
  rebuild-trigger mechanism (shared with future publish actions).
- Editor format (Markdown vs WYSIWYG) deferred to T9 deep-dive session.

### T10 — Firestore vs SQL migration (LOCKED — stay on Firestore)

- Keystone decision: affects T3, T5, T7, T8, T9.
- Decision: **stay on Firestore.** Rationale: data is document-shaped,
  read-heavy, single-writer; Firestore scales to zero (cheap) vs Cloud SQL's
  always-on instance cost; light relational needs (skills↔projects) solvable
  via reference IDs + denormalization; migration adds cost/ops/risk for marginal
  benefit. Blog full-text search at personal scale handled with simple filtering;
  add a search service later only if ever needed.

### T11 — SEO pre-render of existing public pages (LOCKED — deferred to S6)

- Surfaced during the S4 blog deep-dive (see
  [planning/blog/DISCUSSION.md](../blog/DISCUSSION.md)). Today NO public page emits
  Open Graph/Twitter/sitemap/robots/metadataBase; the home page has no own `metadata`
  export; all content is client-fetched (not in HTML), so the site has near-zero per-page
  SEO and bare link previews. For a personal site SEO matters most on Home.
- Decision: do NOT scope-creep S4. S4 (blog) lays only the minimal shared SEO plumbing it
  forces anyway (metadataBase, default OG image, a sitemap that can also list static
  routes, robots.txt). A dedicated session **S6** then, reusing the S4 rebuild webhook +
  build-time-fetch pattern: (Level 1) add per-page metadata + OG/Twitter across
  home/projects/resume; (Level 2) convert those pages from client-fetch to build-time
  server render so content lands in the HTML. Priority Home >> Projects > Resume.
- Accepted trade-off: pre-rendering makes content edits (about/projects/skills) require a
  rebuild to go live — site-wide "edit -> rebuild -> live", same model as the blog. Fine
  for a rarely-changing personal site; also yields cheaper reads + faster pages.

## 4. Edge Cases
- (collected per task as we go)

## 5. Decisions Log (the contract)
- 2026-06-19 — Discussion language Indonesian; notes written in English.
- 2026-06-19 — Single umbrella doc for all tasks (per-task docs spin off later).
- 2026-06-19 — T1 CI/CD confirmed already implemented; no work needed now.
- 2026-06-19 — T10 LOCKED: stay on Firestore (no SQL migration). Keystone for T3/T5/T7/T8/T9.
- 2026-06-19 — T9 LOCKED (high level): blog+dailylog as Firestore collections;
  rendering Option B (static pre-render + rebuild-on-publish via workflow_dispatch).
- 2026-06-19 — T5 LOCKED: admin = /admin route group in the same Next.js app.
- 2026-06-19 — T6 LOCKED: admin auth = Firebase Auth Google + email allowlist;
  BE verifies ID token; static API key kept for scripts.
- 2026-06-19 — T7 LOCKED: admin FE = config-driven scaffold + custom widgets.
- 2026-06-19 — T8 LOCKED: additive BE work; skill categories move enum→collection.
- 2026-06-19 — T2 LOCKED: drop proficiency; add per-category `order` + category `order`.
- 2026-06-19 — T3 LOCKED: project.technologies reference skill IDs (single source); isShow gates Toolbox.
- 2026-06-19 — T4 LOCKED: remove `headline` from all 5 code locations.
- 2026-06-19 — Testing LOCKED: backend = Vitest, unit-heavy + thin Firestore-emulator
  layer (generic repo + domain queries + a few endpoint smokes); frontend =
  typecheck-only. Added as session S0 (before S1).
- 2026-06-19 — Tooling: adapted CLAUDE.md + EXECUTION_FLOW.md to this repo
  (TS/Express + Next static export + Firestore); fixed test refs (pytest→vitest) and
  the tsc `-b` note (FE is single-config, bare `--noEmit` is correct); added
  `planning/` to .gitignore.
- 2026-06-20 — planning/ moved from gitignored to tracked in git (wf-* workflow now
  portable across machines); PR.md added to gitignore; `.claude/commands/` tracked.
  `wf-roadmap` command added as Phase 0 for multi-session architectural discussions.
  PRs are opened by the user only; Claude drafts title+desc into PR.md.
- 2026-06-19 — Convention LOCKED: commits do NOT include a Co-Authored-By/Claude
  attribution trailer (per user edit to CLAUDE.md).
- 2026-06-19 — Release strategy LOCKED: `main` = prod (CI auto-deploys); `develop` =
  pure integration (no deploy). Per S: feat/<slug> from develop -> PR into develop.
  ONE PR develop -> main at the end ships the whole batch in a single coordinated
  deploy (avoids deploying half-finished features). develop must be pushed to origin
  once for PRs. wf-* commands + CLAUDE.md + EXECUTION_FLOW.md updated accordingly.
- 2026-06-19 — CI/CD LOCKED (design): gate at BOTH PR (new ci.yml + branch
  protection) and deploy (3-layer test->build->deploy via `needs:`). CI test scope =
  unit + Firestore emulator (CI needs Java + firebase-tools). Implemented in S0.
- 2026-06-19 — Commit style LOCKED: subject `<type>(<scope>): <subject>` with NO
  ticket/finding/doc suffix; body = short self-contained bullets, no references to
  planning docs/tickets/decisions (planning/ is gitignored - external readers lack
  them); no Co-Authored-By. Ticket->SHA traceability recorded in PLAN.md/REVIEW.md.
  CLAUDE.md + EXECUTION_FLOW.md + wf-implement/wf-fix updated.
- 2026-06-21 — T11 ADDED + LOCKED: SEO pre-render of the existing public pages
  (home/projects/resume) is its own concern, deferred to a new session S6 (after S5) to
  keep S4 focused on the blog. S4 lays only the shared SEO plumbing the blog forces
  (metadataBase, default OG image, sitemap incl. static routes, robots.txt); S6 reuses the
  S4 rebuild webhook + build-time-fetch pattern for per-page OG (Level 1) + client-fetch ->
  build-time render (Level 2, Home first). Accepted trade: content edits then need a
  rebuild to go live. Surfaced in the S4 blog deep-dive.

## 6. Parking Lot / Later
- Fix `DEPLOYMENT.md:12` to reflect client-side runtime fetching.
- Consider Workload Identity Federation instead of long-lived SA JSON key.

## 7. Execution Plan — Session Grouping

10 tasks grouped into 5 focused sessions (group when same area + sequentially
dependent; split when large or different domain). Each session spins off its own
`planning/<slug>/` doc when it goes deep.

**Progress (as of 2026-06-21):**
- S0 DONE — slug `test-harness`, PR #1 merged into develop
- S1 DONE — slug `data-model-cleanup`, PR #2 merged into develop
- S2 DONE — slug `auth`, PR #3 merged into develop
- S3 DONE — slug `admin-cms`, PR #5 merged into develop (config-driven scaffold, all domains, auth swap)
- S3.1 DONE — slug `admin-cms-design`, PR #6 (dark palette, responsive mobile drawer, toasts, dashboard cards)
- S3.2 DONE — slug `admin-cms-perf`, PR #7 (TanStack Query, atomic bulk reorder endpoint, tighter rate limits)
- S4 DONE — slug `blog`, PR #8 (posts collection, admin editor, public /blog pages, rebuild-on-publish, SEO plumbing)
- develop -> main release (S0-S4 batch) not yet shipped to prod
- **Next: S5 (daily log, T9 part 2)**

| Session | Tasks | Status | Notes |
|---------|-------|--------|-------|
| **S0 — Backend test harness + CI wiring** | (new) | DONE | Vitest, unit-heavy + thin Firestore-emulator layer; establish `backend/tests/<slug>/` convention. PLUS wire CI: new `ci.yml` (PR gate) + 3-layer deploy gating (see T1 CI/CD design). The wf-* workflow depends on this; do FIRST. |
| **S1 — Data-model cleanup** | T4 → T8-categories → T2 → T3 | DONE | Small & interdependent; same area (skills/projects/about). Do in this order. |
| **S2 — Auth** | T6 | DONE | Isolated: security-sensitive + prerequisite for admin. Prove it works first. |
| **S3 — Admin CMS scaffold** | T5 + T7 + T8 additive CRUD endpoints | DONE | Config-driven scaffold + wire all domains. Auth swap on write routes (x-api-key → Firebase token) happens here. |
| **S3.1 — Admin design update** | | DONE | Dark palette, responsive mobile drawer, toasts, dashboard cards, sidebar sections, tighter rate limits + client IP keying. |
| **S3.2 — Backend optimization** | | DONE | TanStack Query for public + admin reads with write invalidation; atomic bulk reorder endpoint for skills/categories. |
| **S4 — Blog** | T9 (part 1: `posts`) | DONE | BE domain + admin editor, public /blog + /blog/[slug] pages, rebuild-on-publish webhook, site-wide SEO plumbing. |
| **S5 — Daily log** | T9 (part 2: `dailyLogs`) | NEXT | Reuses S4 foundation (webhook, markdown render); lighter. |
| **S6 — SEO pre-render of public pages** | T11 | | Reuses S4 foundation (rebuild webhook + build-time fetch). Level 1: per-page metadata + OG/Twitter + sitemap/robots across home/projects/resume. Level 2: convert those pages client-fetch -> build-time render (Home first). Makes content edits require a rebuild. |

- **Test coverage is incremental per-session (decided 2026-06-19, see
  [planning/test-harness/DISCUSSION.md](../test-harness/DISCUSSION.md)).** S0 ships the
  harness + ONLY `skills` (+ generic repo) as the copyable template — it does NOT test
  all 9 domains. Every later session writes tests for the domains IT touches, under
  `tests/<slug>/`: S1 = about/skills/projects/categories; **S3 = all remaining domains**
  (DI conversion + service/endpoint tests, since admin needs full CRUD per domain);
  S4/S5 = new posts/dailyLogs. Rule: don't duplicate identical CRUD tests 9x — the
  generic repo emulator test covers the shared path once; add per-domain tests only where
  a domain deviates (e.g. `findAllOrdered`, complex schemas/refs). Also: DI factory-
  function refactor lands per-domain in the session that touches it (skills in S0).
- S0 added 2026-06-19: backend testing harness (Vitest, unit-heavy + thin emulator).
  Rationale: the wf-* workflow is built around scoped `tests/<slug>/`; without a
  harness it degrades to typecheck + manual. Bulk = unit tests (service/util/schema/
  middleware, repo mocked); thin emulator slice = generic FirestoreRepository, domain
  queries, a few endpoint smokes. Frontend stays typecheck-only.
- T1 (CI/CD) needs no session — already implemented.
- Cross-cutting work is done inside the session that needs it, not as its own
  session: auth swap → S3; rebuild webhook → S4.
- More-granular option if desired: split S4/S5 further into BE / FE / daily-log
  (3 sessions). 5 sessions is the recommended sweet spot.
