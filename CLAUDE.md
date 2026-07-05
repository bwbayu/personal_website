# CLAUDE.md

Guidance for Claude Code working in this repo.

Personal-website monorepo: Express + TypeScript API (`backend/`, Cloud Run) and a
Next.js static-export site (`frontend/`, Firebase Hosting), backed by Cloud Firestore.
Deploy architecture: [DEPLOYMENT.md](DEPLOYMENT.md). Per-ticket discipline:
[FEATURE_FLOW.md](FEATURE_FLOW.md).

## Architecture — Backend (`backend/`)

- Per-domain module: `controller / service / repository / routes / schema / type` under
  `backend/src/<domain>/`. Follow this shape for any new domain.
- 13 route groups registered in [routes/index.ts](backend/src/routes/index.ts): projects,
  experiences, skills, categories, resume, about, achievements, certifications, educations,
  media-socials, posts, daily-logs, rebuild. `resume` is a read-only aggregation and
  `rebuild` is not a domain — do NOT scaffold CRUD for either.
- Repositories extend the generic
  [FirestoreRepository&lt;T&gt;](backend/src/shared/firestore.repository.ts); the client is
  [config/firestore.ts](backend/src/config/firestore.ts) (Application Default Credentials in
  prod). Never hand-roll Firestore access.
- Writes (`POST/PATCH/DELETE`) are gated by
  [authMiddleware](backend/src/middlewares/auth.middleware.ts); reads (`GET`) are public.
  Per-route order: `validateId|validateSlugId -> authMiddleware -> validate(schema) -> controller`.
- Validation is Zod, one `*.schema.ts` per domain, applied via
  [validate.middleware](backend/src/middlewares/validate.middleware.ts).
- [app.ts](backend/app.ts) sets the shared guards: rate limits (read 60 / write 10 per min),
  64kb JSON limit, CORS allow-list, `/health`, Swagger at `/api-docs` (non-prod only). New
  routes inherit these — do not re-add per route.

## Architecture — Frontend (`frontend/`)

- Next 14 App Router with `output: 'export'` ([next.config.mjs](frontend/next.config.mjs)):
  builds to static HTML, **no Node server at runtime**. Do NOT add SSR, route handlers, or
  server-only code.
- Route groups `(public)` and `admin`; the admin area is a client-rendered CMS with a dynamic
  `app/admin/[domain]` route.
- Data is fetched **client-side at runtime** via TanStack Query. Hooks + keys live in
  [lib/queries.ts](frontend/lib/queries.ts) (`queryKeys` public, `adminKeys` admin); fetchers
  keep `cache: 'no-store'` (TanStack Query is the cache layer, not the browser). Do not fetch
  at build time.
- FE auth is Firebase client-side ([lib/firebase.ts](frontend/lib/firebase.ts), `AuthContext`,
  `authedFetch` attaches the Bearer token). Do not hand-roll auth headers.
- Blog/daily markdown renders through `react-markdown` + `rehype-sanitize`; external icon URLs
  go through [isSafeUrl](frontend/lib/url.ts). Never render unsanitized markdown or unguarded URLs.
- Pages are thin server components wrapping a `*Client` component — keep logic in the client
  component, not in `page.tsx`.

## Testing (facts; run steps are a skill)

- Backend Vitest: unit-heavy (repository mocked) plus a thin Firestore-emulator slice. Tests
  live under `backend/tests/<slug>/`. Run scoped: `npx vitest run tests/<slug>` from `backend/`.
  The emulator slice (`npm run test:emulator`) needs Java/Temurin 21.
- Frontend: no test runner; typecheck only with `npm run typecheck` (bare `tsc --noEmit`, single
  config).

## Workflow stack contract

The `feature-*` / `understand-*` / `concept-*` commands are stack-agnostic and cite these slots:

- **Scoped test** — `npx vitest run tests/<slug>` from `backend/` (repository mocked). Never run
  the full suite (slow).
- **Static gate** — `npm run typecheck` (frontend; bare `tsc --noEmit`, single config, do NOT use `-b`).
- **Pre-commit gate** — Firestore emulator slice `cd backend; npm run test:emulator` (needs
  Java/Temurin 21) when the change touches repositories / domain queries / endpoints. If the
  sandbox lacks Java, STOP and have the operator run it.
- **Test location** — `backend/tests/<slug>/`.
- **Branch model** — `feat/<slug>` cut from `develop`; user opens the PR into `develop`; a batch
  ships to prod via ONE PR `develop -> main`. Claude never opens PRs; never commit to `develop`/`main`.
- **Understanding-docs location** — `docs/understanding/<slug>/`.
- **Concept library** — defined once in the global `~/.claude/CLAUDE.md` (shared `~/notes/concepts/`).

## Repo conventions

- Converse with the user in Bahasa Indonesia. Write everything durable in English: docs, code,
  comments, commit messages.
- Working docs live in `planning/<slug>/` (`DISCUSSION.md` / `PLAN.md` / `REVIEW.md`), committed.
  Keep planning commits separate from code commits — never fold docs into a feature/fix commit.
- Commit subject: `<type>(<scope>): <subject>` — `<type>` = feat/fix/refactor/perf/chore/docs/test,
  `<scope>` = `backend`/`frontend`, no ticket/finding/doc suffix. Body = a few short bullets of WHAT
  changed, self-contained.
- PRs are opened by the user, not Claude. Claude drafts title + description into [PR.md](PR.md);
  write each bullet as ONE continuous line (no mid-sentence newline) so it pastes cleanly.

## Do NOT

- Never commit to `develop` or `main` directly — work on `feat/<slug>` cut from `develop`.
- Never push until the user explicitly approves the specific push.
- Do NOT add a `Co-Authored-By` / any Claude/Anthropic attribution trailer to commits.
- Do NOT run the full backend test suite (slow) — scope to `tests/<slug>`. Do NOT use `tsc -b`
  on the frontend (single config; `-b` breaks the check).
- Do NOT commit secrets: `keys/` (SA JSON) and `backend/.env` are gitignored; prod uses ADC.
- security-tools feature (**enigma**, **ascii-sum**) ONLY: commit code, never the planning `.md`.
- No emojis / non-ASCII in user-facing strings.

## Gotchas / Domain Notes

- `POST /api/rebuild` proxies a GitHub `workflow_dispatch` that triggers a **real frontend
  deploy** (static rebuild). The GH token is backend-only. Do not call it casually.
- `npm run migrate` and `patch:*` scripts are one-off, idempotent scripts that run against
  **real Firestore data** — not part of normal dev. Do not run them offhand.
- Blog and daily-log documents use **slug IDs** (`validateSlugId`), not numeric IDs
  (`validateId`) — pick the right id middleware.
- Auth is dual-path: browsers send a Firebase `Bearer` token, break-glass clients send
  `x-api-key`. The token path requires the caller's email to be on the `adminEmails` allowlist
  AND `email_verified` — that is why some valid logins still 403.
- Frontend `staleTime` is 5 min to match the server `Cache-Control: max-age=300`; admin writes
  `invalidateQueries` on the touched domain. Keep these two in sync when adding cached endpoints.
