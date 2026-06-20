# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is a personal-website monorepo: an Express + TypeScript API (`backend/`) and a
Next.js static-export site (`frontend/`), backed by Cloud Firestore, deployed to
Cloud Run + Firebase Hosting. See [DEPLOYMENT.md](DEPLOYMENT.md) for the full deploy
architecture.

## Running the stack

Backend (dev port 3001):
```powershell
Set-Location backend
npm install
npm run dev          # ts-node ./bin/www
```
`npm run build` -> `tsc` into `dist/`; `npm start` -> `node ./dist/bin/www`. The port
comes from `PORT` (default 3001 locally; Cloud Run injects 8080 in prod). Config is
read in [backend/src/config/env.ts](backend/src/config/env.ts) from `backend/.env`
(`PORT`, `NODE_ENV`, `API_KEY`, `ALLOWED_ORIGINS`, `API_BASE_URL`) — see
[backend/.env.example](backend/.env.example). Data tooling: `npm run migrate`
(seed/migrate) and `npm run patch:media-socials`.

Frontend (dev port 3002):
```powershell
Set-Location frontend
npm install
npm run dev          # next dev -p 3002
```
`npm run build` -> `next build` with `output: 'export'`, emitting static HTML to
`out/`. The build/runtime needs `NEXT_PUBLIC_API_URL` pointing at the backend.

## Tests

**Backend: Vitest — unit-heavy + a thin emulator layer.** Most tests are unit tests
(services / utils / schemas / middlewares with the repository mocked) — each module
runs in isolation. A thin set of integration tests runs against the Firestore
emulator only where it adds value: the generic `FirestoreRepository<T>`,
domain-specific queries (ordering / filtering), and a few endpoint smokes (auth
gating, Zod validation, one CRUD round-trip). Tests are organized by backlog ticket
under `backend/tests/<ticket_slug>/` (mirrors the workflow in
[EXECUTION_FLOW.md](EXECUTION_FLOW.md)). Run scoped to one ticket, not the full suite
(slow). The thin emulator slice has its own config and runs as a whole (not scoped
per ticket) via `cd backend; npm run test:emulator`, which needs Java/Temurin 21
(firebase-tools 15.22 dropped Java < 21). Run
it locally before committing any Firestore-touching change (repositories, domain
queries, endpoints).

```powershell
npx vitest run tests/<ticket_slug>     # unit bucket (repo mocked) - the bulk
npx vitest run tests/<ticket_slug> -t "name"
cd backend; npm run test:emulator      # emulator slice (needs Java/Temurin 21)
```

> Status: the test harness itself (Vitest config + emulator wiring + the
> `tests/<slug>/` convention) is established in task **S0** of
> [planning/feature-roadmap/DISCUSSION.md](planning/feature-roadmap/DISCUSSION.md);
> until S0 ships there are no backend tests yet.

**Frontend: typecheck only** (no test runner). Use `npm run typecheck`.

| Script | Purpose |
|---|---|
| `npm run dev` | `next dev -p 3002`, HMR, no typecheck. |
| `npm run typecheck` | `tsc --noEmit`. **Always use this** to verify FE types. |
| `npm run build` | `next build` (static export). Fails on type errors. |
| `npm run lint` | `next lint`. |
| `npm run format` | `prettier . --write`. |

**No `tsc -b` trap here.** [frontend/tsconfig.json](frontend/tsconfig.json) is a
single config (not project references), so bare `tsc --noEmit` — which is what
`npm run typecheck` runs — checks everything correctly. Do NOT add `-b`.

## Architecture

### Backend (`backend/`)

Express + TypeScript. [backend/app.ts](backend/app.ts) wires helmet, CORS
(allow-list from `config.allowedOrigins`), morgan, JSON body limit (64kb), read/write
rate limiters (read 200 / write 20 per 15 min), a `Cache-Control` header on GETs,
`/health` (pings Firestore), Swagger at `/api-docs` (non-prod only), then the API
router under `/api`.

Per-domain module pattern — each domain has
`controller / service / repository / routes / schema / type` under
`backend/src/<domain>/`. The 9 domains are registered in
[backend/src/routes/index.ts](backend/src/routes/index.ts): about, skills, projects,
experiences, educations, certifications, achievements, mediaSocials, resume (resume
is a read-only aggregation). Repositories extend the generic
[FirestoreRepository<T>](backend/src/shared/firestore.repository.ts); the Firestore
client lives in [backend/src/config/firestore.ts](backend/src/config/firestore.ts)
(Application Default Credentials on Cloud Run via `roles/datastore.user`).

**Auth carve-out.** Writes (`POST/PATCH/DELETE`) are gated by
[authMiddleware](backend/src/middlewares/auth.middleware.ts) — a single static
`x-api-key`, timing-safe compared. Reads (`GET`) are public by design. Per-route order
is `validateId -> authMiddleware -> validate(schema) -> controller`. (The admin/CMS
work will add Firebase-ID-token verification alongside the API key — see the roadmap.)

Validation is Zod via [validate.middleware](backend/src/middlewares/validate.middleware.ts);
schemas live in each domain's `*.schema.ts`.

### Frontend (`frontend/`)

Next.js 14 App Router, **`output: 'export'`** ([next.config.mjs](frontend/next.config.mjs))
— builds to static HTML, no Node server at runtime. Flowbite React + Tailwind. Path
alias `@/* -> ./*`.

Data is fetched **client-side at runtime** (not at build time) via
[useApi](frontend/lib/useApi.ts) on mount, calling the per-domain fetchers in
[frontend/app/api/](frontend/app/api/) against `NEXT_PUBLIC_API_URL` with
`cache: 'no-store'`. Pages (`app/page.tsx`, `app/project/page.tsx`,
`app/resume/page.tsx`) are thin server components wrapping a `*Client` component under
[frontend/components/](frontend/components/). External icon image URLs are guarded by
[isSafeUrl](frontend/lib/url.ts).

### Deployment

Firebase Hosting (FE static `out/`) <-> Cloud Run (BE Docker) <-> Cloud Firestore.
CI in [.github/workflows/](.github/workflows/) deploys on push to `main`, path-filtered
per package. Full details in [DEPLOYMENT.md](DEPLOYMENT.md). One service account
secret `GCP_SA_KEY` is shared by both workflows.

## Repo conventions

**Language.** Discuss/converse with the user in Bahasa Indonesia. Write everything
durable in English: docs (`DISCUSSION.md`/`PLAN.md`/`REVIEW.md`, CLAUDE.md, etc.),
code, comments, and commit messages.

**Working docs live in [planning/](planning/) and are tracked in git.** All discussion,
plan, and review markdown lives under `planning/<slug>/` (`DISCUSSION.md`, `PLAN.md`,
`REVIEW.md`), committed so the wf-* workflow is portable across machines. Keep planning
updates in their own commits — do NOT fold them into feature/fix commits, which stay
code + tests only. `.claude/commands/` is tracked too; `.claude/settings.local.json`
(machine-local permissions) stays gitignored.

**Root working docs** (tracked, at root because a contributor sees them first):
- [CLAUDE.md](CLAUDE.md) — this file; auto-loaded every session.
- [EXECUTION_FLOW.md](EXECUTION_FLOW.md) — the per-ticket workflow discipline the
  `.claude/commands/wf-*` commands cite.

**Branching & release.** `main` is the only branch CI deploys (push to `main` ->
prod). `develop` is a pure integration branch (no deploy). Each feature is a
`feat/<slug>` cut from `develop`; when its review loop closes, open a PR into
`develop` (`gh pr create --base develop`). Only after a coherent batch of features is
merged into `develop` do you open ONE PR `develop` -> `main` to ship everything to
prod in a single coordinated deploy. Never commit to `develop` or `main` directly.

**Commit convention.** One commit per ticket/finding. Subject:
`<type>(<scope>): <subject>` — NO ticket/issue/finding/doc suffix (no `(slug TH-2)`,
no `(review §N)`). `<type>` = feat/fix/refactor/perf/chore/docs/test; `<scope>` =
`backend` / `frontend`. Body = a few SHORT bullet points of WHAT changed,
self-contained and readable by anyone cloning the public repo — do NOT reference
DISCUSSION/PLAN/REVIEW, ticket IDs, finding numbers, or "decisions N" (planning/ is
gitignored; external readers don't have those files). Keep it simple; no long prose.
Track the ticket/finding -> commit SHA mapping inside PLAN.md / REVIEW.md instead.
Do NOT add a `Co-Authored-By` / any Claude/Anthropic attribution trailer. Never push
until the user explicitly approves the specific push; never push to `main`/`develop`
directly — work on `feat/<slug>`.

Example (good):
```
test(backend): add repository mock seam for unit tests

- FirestoreRepository takes an optional db param (defaults to shared client)
- convert skills module to factory functions wired in skill.routes.ts
- add a skills service unit test backed by a fake repository
```

**User-facing strings:** no emojis / non-ASCII.

**Secrets.** `backend/.env` holds `API_KEY` etc. (gitignored); `keys/` holds any GCP
service-account JSON (gitignored). In prod, Firestore auth uses ADC — no key file on
Cloud Run.
