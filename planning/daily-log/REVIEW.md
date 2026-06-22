# Daily Log (S5) — Review Notes (Phase 4)

> Fresh-eyes, read-only audit of the `daily-log` feature. No code changed. Scope =
> `develop..HEAD` on branch `feat/daily-log`. Honors the LOCKED decisions DL1-DL9 in
> [DISCUSSION.md](DISCUSSION.md) and the [PLAN.md](PLAN.md) contract (tickets
> DAILY-LOG-1..3). Conventions judged against [CLAUDE.md](../../CLAUDE.md) +
> [EXECUTION_FLOW.md](../../EXECUTION_FLOW.md).

## 1. Objective + scope

Reviewed the full feature diff (base `develop`, merge-base `eb1d7a7`). Commits:

| SHA | Subject | Kind |
|-----|---------|------|
| eb3cd62 | feat(backend): add daily-logs domain | DAILY-LOG-1 |
| a5241f1 | docs: mark DAILY-LOG-1 done in plan | planning |
| e74e110 | feat(frontend): register daily-logs admin domain | DAILY-LOG-2 |
| 2d96e1a | docs: mark DAILY-LOG-2 done in plan | planning |
| 73a023f | feat(frontend): add public daily log timeline page | DAILY-LOG-3 |
| a8dcbf4 | docs: mark DAILY-LOG-3 done in plan | planning |

All three tickets are BUILT. Nothing pending. Code commits are kept separate from
planning commits (alternating), which matches the convention.

**Tests run this pass (all green):**
- Backend unit (scoped): `npx vitest run tests/daily-log` -> 2 files, 12 tests pass.
- Frontend: `npm run typecheck` (`tsc --noEmit`) -> clean.
- Emulator slice (pre-PR local gate, Java/Temurin 21 present): `npm run test:emulator`
  -> 10 files, 28 tests pass. Daily-logs smokes observed: POST 401 (no key), 403 (wrong
  key), 201 + 201 (seed, uuid id), GET 200 date-desc, PATCH 200, DELETE 200, GET 200,
  POST 400 (bad date).
- NOT run: `npm run build` (static export) — needs a reachable `NEXT_PUBLIC_API_URL`;
  per PLAN this is the accepted condition where typecheck is the gate. AC3 (react-markdown
  out of the client bundle) is confirmed statically by import graph instead (see §C).

## 2. Plan-conformance table

### DAILY-LOG-1 — backend `daily-logs` domain — MET
| AC | Verdict | Evidence |
|----|---------|----------|
| 1. GET public, all, date desc | met | [dailyLog.routes.ts:18](../../backend/src/dailyLogs/dailyLog.routes.ts#L18); repo `findAllOrdered('date','desc')` [dailyLog.repository.ts:13](../../backend/src/dailyLogs/dailyLog.repository.ts#L13); emulator order asserted [dailyLog.repository.emulator.test.ts:33](../../backend/tests/daily-log/dailyLog.repository.emulator.test.ts#L33) |
| 2. writes auth-gated; per-route order | met | [dailyLog.routes.ts:19-21](../../backend/src/dailyLogs/dailyLog.routes.ts#L19-L21) — POST `auth->validate`, PATCH `validateId->auth->validate`, DELETE `validateId->auth` (no body validate). Identical to [post.routes.ts:21-23](../../backend/src/posts/post.routes.ts#L21-L23) |
| 3. id server-set, client id stripped | met | controller `{ ...req.body, id: randomUUID() }` [dailyLog.controller.ts:19](../../backend/src/dailyLogs/dailyLog.controller.ts#L19); schema has no `id` (Zod strips) [dailyLog.schema.test.ts:19](../../backend/tests/daily-log/dailyLog.schema.test.ts#L19); emulator asserts uuid [dailyLog.endpoint.emulator.test.ts:37](../../backend/tests/daily-log/dailyLog.endpoint.emulator.test.ts#L37) |
| 4. insert defaults tags `[]`; PATCH no-wipe | met | default only on insert [dailyLog.schema.ts:14](../../backend/src/dailyLogs/dailyLog.schema.ts#L14); no-wipe test [dailyLog.schema.test.ts:42](../../backend/tests/daily-log/dailyLog.schema.test.ts#L42) |
| 5. date safeDate; content 1-5000 | met | [dailyLog.schema.ts:6-10](../../backend/src/dailyLogs/dailyLog.schema.ts#L6-L10); tests [dailyLog.schema.test.ts:24-34](../../backend/tests/daily-log/dailyLog.schema.test.ts#L24-L34) |
| 6. 404 on missing; PATCH returns doc; DELETE ok | met | controller 404 paths [dailyLog.controller.ts:29-46](../../backend/src/dailyLogs/dailyLog.controller.ts#L29-L46); service guards update via findById [dailyLog.service.ts:14-18](../../backend/src/dailyLogs/dailyLog.service.ts#L14-L18); CRUD round-trip emulator test |
| 7. no `/all` route | met | [dailyLog.routes.ts](../../backend/src/dailyLogs/dailyLog.routes.ts) has only `/`, `/:id` (vs posts' `/all`) |

Registered after `/posts`, before `/rebuild`: [routes/index.ts:33](../../backend/src/routes/index.ts#L33). Matches plan.

### DAILY-LOG-2 — admin domain registration — MET
| AC | Verdict | Evidence |
|----|---------|----------|
| 1. dashboard + sidebar under "Writing"; invariant holds | met | registry entry [config.ts:241-255](../../frontend/lib/admin/config.ts#L241-L255); `navGroups` "Writing": `['posts','daily-logs']` [config.ts:269](../../frontend/lib/admin/config.ts#L269); dashboard maps `registry` [DashboardClient.tsx:76](../../frontend/components/admin/DashboardClient.tsx#L76); all 11 registry slugs covered exactly once by navGroups (invariant [config.ts:272-289](../../frontend/lib/admin/config.ts#L272-L289)) |
| 2. form pre-fills today, editable; CRUD via /api/daily-logs; date+tags cols | met | `defaultToday: true` [config.ts:251](../../frontend/lib/admin/config.ts#L251) consumed in `defaultForType` date case [DomainFormPage.tsx:47-49](../../frontend/components/admin/DomainFormPage.tsx#L47-L49); local `todayLocalISODate` zero-pads [DomainFormPage.tsx:27-33](../../frontend/components/admin/DomainFormPage.tsx#L27-L33); columns `[date,tags]`, `formatCell` joins arrays [DomainListClient.tsx:66](../../frontend/components/admin/DomainListClient.tsx#L66) |
| 3. other date fields stay blank | met | date case returns `""` unless `defaultToday`; no other field sets it [config.ts](../../frontend/lib/admin/config.ts) (projects/experiences/etc. date fields have no flag) |
| 4. Rebuild button on daily-logs list | met | gate broadened to `posts \|\| daily-logs` [DomainListClient.tsx:183](../../frontend/components/admin/DomainListClient.tsx#L183) |
| 5. tsc clean | met | typecheck pass (this review) |

DL4 honored: no `adminListPath`/`adminAuthRead`, so `adminReadPath`/`adminReadList`
fall back to the public route [read.ts:9-16](../../frontend/lib/admin/read.ts#L9-L16).

### DAILY-LOG-3 — public `/daily` timeline — MET
| AC | Verdict | Evidence |
|----|---------|----------|
| 1. single static page in (public), newest-first, markdown at build | met | server page fetches + maps, renders `<PostContent>` per entry [daily/page.tsx:14-23](../../frontend/app/(public)/daily/page.tsx#L14-L23); order is the API's date-desc; lives in `(public)` group (navbar/footer via [layout.tsx](../../frontend/app/(public)/layout.tsx)) |
| 2. client tag filter; All resets | met | [DailyLogFeedClient.tsx:20-28,45-69](../../frontend/components/daily/DailyLogFeedClient.tsx#L20-L69) |
| 3. react-markdown not in client bundle | met (static) | only the server page imports `PostContent`; the client wrapper imports only `react` + a `ReactNode` type [DailyLogFeedClient.tsx:1-14](../../frontend/components/daily/DailyLogFeedClient.tsx#L1-L14). Pre-rendered nodes passed as a prop (RSC). Bundle not inspected via build, but unreachable from client graph |
| 4. empty feed builds + empty state; no dynamic route | met | empty branch [DailyLogFeedClient.tsx:30-37](../../frontend/components/daily/DailyLogFeedClient.tsx#L30-L37); `getDailyLogs` returns `json.data ?? []` [logs.ts:21](../../frontend/lib/daily/logs.ts#L21); no `[slug]` dir under `app/(public)/daily/` |
| 5. navbar "Daily Log" -> /daily | met | [NavbarClient.tsx:38-40](../../frontend/components/CustomNavbar/NavbarClient.tsx#L38-L40) (after Blog) |
| 6. tsc clean | met | typecheck pass |

## 3. Decision-conformance table

| # | Decision | Honored? | Evidence |
|---|----------|----------|----------|
| DL1 | single static `/daily`, no per-entry route | yes | one server page; no `[slug]`, no `generateStaticParams`/`findBySlug`/slug field anywhere in the diff |
| DL2 | uuid id, multiple/day | yes | `randomUUID()` controller; emulator "same date" test [repository.emulator.test.ts:48-56](../../backend/tests/daily-log/dailyLog.repository.emulator.test.ts#L48-L56) |
| DL3 | markdown render reused; admin = plain textarea | yes | content field type `textarea` [config.ts:252](../../frontend/lib/admin/config.ts#L252); public render `PostContent` (no `@uiw/react-md-editor`) |
| DL4 | no status; every entry public; admin reads same route | yes | no status field, no `/all`, no `adminAuthRead` |
| DL5 | mood dropped | yes | no `mood` in type/schema/config |
| DL6 | route `/daily`, label "Daily Log", server component | yes | page is a server component in `(public)`; navbar + admin labels "Daily Log" |
| DL7 | tags `string[]` + client tag filter | yes | `string-array` field; `DailyLogFeedClient` filter |
| DL8 | user date (safeDate), default today, editable; ordered date desc; no in-memory sort | yes | `safeDate`; `defaultToday`; `findAllOrdered('date','desc')` (generic repo only, no custom sort) |
| DL9 | markdown rendered at build in server page; thin client filter; react-markdown out of client bundle | yes | see AC3 above + [page.tsx:21](../../frontend/app/(public)/daily/page.tsx#L21) |

Planning-delegated decisions (PLAN §1) also honored: textarea reuse (not a new field
type), "Blog" group renamed to "Writing", opt-in `defaultToday`.

## 4. Edge-case checklist

| Case | Status | Note |
|------|--------|------|
| Empty feed builds + shows empty state | OK | DL1 removes the blog EMPTY_FALLBACK_SLUG class of problem entirely |
| Bad date (`2026-13-40`, `not-a-date`, `2026-02-30` rollover) | OK | `safeDate` regex + calendar refine; unit + emulator 400 |
| Content empty / >5000 | OK | min(1)/max(5000); unit boundary tests at 5000/5001 |
| PATCH omitting `tags` does not wipe | OK | default only on insert; unit test |
| Explicit `tags: []` on PATCH clears | OK & intended | admin form always sends `tags`; no-wipe protects omission only |
| PATCH/DELETE missing id -> 404 | OK | service findById guard + repo `remove` false |
| Client-supplied `id` in body | OK | Zod strips; controller overwrites |
| Multiple entries same date | OK | all returned; secondary order = Firestore default (uuid) — accepted per DISCUSSION §4 |
| Tag filter -> zero visible | N/A | filter buttons are derived from existing entries' tags, so a chosen tag always has >=1 entry |
| `entry.tags` undefined at render | OK | insert always sets `tags` (new collection, no legacy docs) -> always an array |
| Date local (admin default) vs UTC (feed label) | OK | feed formats a date-only string with `getUTC*`, which returns the stored calendar date verbatim; "today" is intentionally local |
| Build-time fetch failure | Accepted | throws -> build fails, same accepted risk as blog `getPublishedPosts` |
| Markdown XSS | OK | `rehype-sanitize` in reused `PostContent` |
| Write rate limiter | OK | writeLimiter runs before auth; tests isolated per file (own app instance) so per-file budget applies (see §5/§2 finding) |

## 5. Findings

### §1 — DISCUSSION.md is untracked / never committed — SHOULD-FIX
- **Where:** `planning/daily-log/DISCUSSION.md` (`git status` = `??`; `git ls-files
  planning/daily-log/` lists only PLAN.md; the file appears in no commit on any branch).
- **What:** The LOCKED Decisions contract (DL1-DL9) that the whole feature — and this
  review — is judged against exists only in the working tree, not in git. Only PLAN.md
  was committed.
- **Why it matters:** CLAUDE.md ("Working docs live in `planning/` and are tracked in
  git") and EXECUTION_FLOW (the `planning/<slug>/` docs are the portable handoff, tracked
  in git) both require it. Without it the decisions rationale doesn't travel with the repo
  / PR, and a future re-review or another machine can't see the contract.
- **Fix:** Commit it in its own planning commit (e.g. `docs: add daily-log discussion`),
  separate from code commits per the convention. Pure housekeeping; no code impact.
- **Ref:** repo conventions (CLAUDE.md / EXECUTION_FLOW), not a code AC.

### §2 — Emulator endpoint test uses 7 write-verb requests vs the plan's stated <=6 — NICE-TO-HAVE
- **Where:** [dailyLog.endpoint.emulator.test.ts:11](../../backend/tests/daily-log/dailyLog.endpoint.emulator.test.ts#L11) (comment) and the request flow.
- **What:** The file issues 7 POST/PATCH/DELETE requests (2 auth-gate POSTs + 2 seed
  POSTs + 1 PATCH + 1 DELETE + 1 bad-date POST). PLAN DAILY-LOG-1 budgeted "<=6 writes …
  kept WELL under the 10-writes/min limiter." `writeLimiter` (app.ts:31-34) runs BEFORE
  auth, so the 401/403 requests also count against the per-IP 10/min window.
- **Why it matters:** Vitest isolates each test file (separate `app` import -> separate
  limiter store), so the budget is per-file and 7 < 10 passes today with a margin of 3
  (not the 4 the plan implied). It is correct and honestly documented; just slightly
  tighter than planned. If a future write is added to this file it could brush the cap.
- **Fix (optional):** Drop one write (e.g. fold the bad-date check into a non-write
  assertion path, or remove one auth-gate variant) to restore the <=6 budget, or update
  the PLAN note to <=7. No correctness issue.
- **Ref:** DAILY-LOG-1 scoped-tests note.

### §3 — `formatDate`/`MONTHS` duplicated between blog and daily — NICE-TO-HAVE
- **Where:** [frontend/lib/daily/logs.ts:24-35](../../frontend/lib/daily/logs.ts#L24-L35) duplicates [frontend/lib/blog/posts.ts:47-58](../../frontend/lib/blog/posts.ts#L47-L58).
- **What:** The UTC `MONTHS` table + `formatDate` are copy-pasted (daily's variant
  returns the raw string on NaN instead of `""`).
- **Why it matters:** Reuse smell. NOTE: PLAN DAILY-LOG-3 *deliberately* chose to keep it
  local ("so daily doesn't import from blog"), so this is an accepted trade-off, not a
  deviation. Flagged only so triage can decide whether to extract a shared `lib/date.ts`.
- **Fix (optional):** Extract one `formatYmdUTC` util used by both; or leave as-is per the
  plan's stated preference.
- **Ref:** PLAN §1 / DAILY-LOG-3.

### §4 — `DailyLog` shape declared three times — OUT-OF-SCOPE
- **Where:** [backend dailyLog.type.ts](../../backend/src/dailyLogs/dailyLog.type.ts), [frontend lib/daily/logs.ts:5-10](../../frontend/lib/daily/logs.ts#L5-L10), and `DailyLogEntry` in [DailyLogFeedClient.tsx:6-14](../../frontend/components/daily/DailyLogFeedClient.tsx#L6-L14).
- **What:** The interface is restated in BE and FE (plus an enriched `DailyLogEntry` with
  `dateLabel` + a `ReactNode` content for the client).
- **Why it matters:** Mirrors the repo's existing FE/BE split (`Post` is likewise
  duplicated); there is no shared types package across `backend/` and `frontend/`, so this
  is the established pattern. `DailyLogEntry` legitimately differs (pre-rendered node).
- **Fix:** None recommended.
- **Ref:** repo architecture.

### §5 — `getDailyLogs` trusts the payload shape — NICE-TO-HAVE (low)
- **Where:** [frontend/lib/daily/logs.ts:18-21](../../frontend/lib/daily/logs.ts#L18-L21).
- **What:** Casts the response to `{ data?: DailyLog[] }` and returns `json.data ?? []`
  with no runtime validation; a malformed entry missing `tags` would later throw in the
  client's `for (const tag of entry.tags)`.
- **Why it matters:** Purely theoretical here — the insert schema guarantees every doc has
  `tags`, and this matches the blog fetcher's exact trust level. Only relevant if you want
  defensive hardening.
- **Fix (optional):** None unless hardening; would be a cross-cutting change including blog.
- **Ref:** edge-case checklist.

### §6 — `daily-logs` is missing from the Swagger spec — SHOULD-FIX
- **Where:** [backend/src/config/swagger.ts](../../backend/src/config/swagger.ts) — no
  `DailyLog` schema component, no `/api/daily-logs` or `/api/daily-logs/{id}` paths.
- **What:** The OpenAPI spec is a hand-maintained static object (not generated from
  routes). Every other write-domain (posts, projects, achievements, ...) is documented;
  `daily-logs` was not added when the domain landed (DAILY-LOG-1). The PLAN's files-to-edit
  for DAILY-LOG-1 did not list swagger.ts, so it was a plan gap too.
- **Why it matters:** `/api-docs` (non-prod) is the single source of API documentation and
  is otherwise complete; the new public + authed endpoints are undiscoverable there,
  inconsistent with the rest of the API.
- **Fix:** Add a `DailyLog` schema component (`id`, `date`, `content`, `tags[]`) and the
  `GET/POST /api/daily-logs` + `PATCH/DELETE /api/daily-logs/{id}` paths, mirroring the
  Posts entries (with `security: [{ ApiKeyAuth: [] }]` on the writes). Swagger is not
  covered by tests; verify by eye / opening `/api-docs`.
- **Ref:** DAILY-LOG-1 (domain registration) + API-documentation consistency.

## 6. Open questions for discussion

1. §1 (DISCUSSION.md untracked) — agree it should be committed (own planning commit)
   before the PR? This is the only item I'd consider a real should-fix.
2. §2 — restore the <=6 write budget by trimming one request, bump the PLAN note to <=7,
   or leave as-is (passes, margin 3)?
3. §3 — extract a shared date util, or keep the deliberate blog/daily decoupling from the
   plan?

## 7. Decisions log (filled WITH the user during triage)

| Finding | Severity | Decision (FIX / DEFERRED / NO-ACTION) | Note |
|---------|----------|----------------------------------------|------|
| §1 DISCUSSION.md untracked | SHOULD-FIX | _pending triage_ | |
| §2 test write budget 7 vs <=6 | NICE-TO-HAVE | FIX [FIXED] | dropped the wrong-key 403 assertion -> 6 writes |
| §3 formatDate duplication | NICE-TO-HAVE | FIX [FIXED] | extracted lib/date.ts; blog + daily import it |
| §4 DailyLog shape x3 | OUT-OF-SCOPE | NO-ACTION | established FE/BE split |
| §5 fetch payload trust | NICE-TO-HAVE (low) | NO-ACTION | matches blog trust level |
| §6 daily-logs missing from Swagger | SHOULD-FIX | FIX [FIXED] | added DailyLog schema + GET/POST/PATCH/DELETE paths |

---

# Pass 1 review

> Fresh-eyes RE-REVIEW (read-only). Verifies the three FIXED findings from Phase 4 and
> reviews ONLY the fix delta — not a full re-audit. Delta base = `a8dcbf4` (last commit
> the Phase-4 pass reviewed); delta = `a8dcbf4..HEAD` on `feat/daily-log`.

## Fix commits in scope

| SHA | Subject | Closes |
|-----|---------|--------|
| 6cfeb15 | test(backend): trim daily-logs endpoint smoke to the write budget | §2 |
| 3f97589 | refactor(frontend): extract shared UTC date formatter | §3 |
| 0bb6bf5 | docs(backend): document daily-logs endpoints in swagger | §6 |

Three code/test commits, no planning commits folded in — matches the convention.
`git diff --stat`: 8 files, +76/-38.

## Tests run this pass (all green)

- Backend unit (scoped): `npx vitest run tests/daily-log` -> 2 files, 12 tests pass.
- Frontend: `npm run typecheck` (`tsc --noEmit`) -> clean (a stale import of the removed
  `formatDate` would surface here as a type error; none did).
- Emulator slice (pre-PR gate, Temurin 21 present): `cd backend; npm run test:emulator`
  -> 10 files, 28 tests pass. Daily-logs trace now shows exactly 6 writes (401, 201, 201,
  PATCH 200, DELETE 200, 400) — the wrong-key 403 line is gone; posts still logs its
  401 + 403.

## Status of previous FIX findings

| § | Finding | Verdict | Evidence |
|---|---------|---------|----------|
| §2 | test write budget 7 -> <=6 | **verified-fixed** | The wrong-key 403 assertion was dropped; the auth-gate `it` now asserts only 401 (no key) [dailyLog.endpoint.emulator.test.ts:26-29](../../backend/tests/daily-log/dailyLog.endpoint.emulator.test.ts#L26-L29). Header comment updated to "6 writes total" and accurate [:10-12](../../backend/tests/daily-log/dailyLog.endpoint.emulator.test.ts#L10-L12). Emulator log confirms 6 write requests. The dropped 403 path stays covered by the shared `authMiddleware`: posts smoke asserts 401+403 [post.endpoint.emulator.test.ts:29-33](../../backend/tests/blog/post.endpoint.emulator.test.ts#L29-L33) and the auth unit test rejects a bad `x-api-key` with 403 [auth.middleware.test.ts:113-119](../../backend/tests/auth/auth.middleware.test.ts#L113-L119). No loss of coverage. |
| §3 | formatDate duplication | **verified-fixed** | New shared util `formatDateUTC` [lib/date.ts:10-15](../../frontend/lib/date.ts#L10-L15); the duplicated `MONTHS`+`formatDate` removed from both [lib/blog/posts.ts](../../frontend/lib/blog/posts.ts) and [lib/daily/logs.ts](../../frontend/lib/daily/logs.ts). All 3 call sites repointed: [blog/[slug]/page.tsx:63](../../frontend/app/(public)/blog/[slug]/page.tsx#L63), [BlogListClient.tsx:92](../../frontend/components/blog/BlogListClient.tsx#L92), [daily/page.tsx:20](../../frontend/app/(public)/daily/page.tsx#L20). Grep for `formatDate\b` across `frontend/` finds only the unrelated local `ResumeClient` helper — no stale import of the removed export. Typecheck clean. |
| §6 | daily-logs missing from Swagger | **verified-fixed** | `DailyLog` component schema (`id`, `date`, `content`, `tags[]`) added [swagger.ts:59-67](../../backend/src/config/swagger.ts#L59-L67); `/api/daily-logs` (GET public + POST authed) and `/api/daily-logs/{id}` (PATCH/DELETE authed) added [swagger.ts:332-369](../../backend/src/config/swagger.ts#L332-L369). Structurally identical to the Posts entries [swagger.ts:488-536](../../backend/src/config/swagger.ts#L488-L536): public GET -> `SuccessResponse`, writes carry `security: [{ ApiKeyAuth: [] }]`, `{id}` path param on PATCH/DELETE, `tags: ['Daily Logs']` (operation-level, matching the spec's tag-less-registry convention). The spec object is part of the backend module graph the emulator suite imports, which loaded green — no syntax break. |

## New findings

None. The delta is a test trim, a pure refactor-extraction, and an additive Swagger
edit; no regression, no broken adjacent behavior, no locked-decision violation surfaced.

Two non-findings noted for the record (no action):
- The extracted `formatDateUTC` returns `""` on an unparseable date, whereas daily's old
  local `formatDate` returned the raw string. Behaviourally inert: `date` is always a
  valid `safeDate` (`YYYY-MM-DD`), so the NaN branch is unreachable; the new behaviour
  also matches what blog already did. Harmonization, not a regression.
- "Fixed without a test" does not apply to §3/§6: the frontend has no test runner
  (typecheck is the gate, and it passes), and Swagger was explicitly called out in §6 as
  not test-covered ("verify by eye"). §2 *is* a test change and is proven by the green
  emulator run.

## Recommendation

**CLOSE** — the review loop is done. All three FIXED findings are verified-fixed with a
scoped test / typecheck / emulator pass behind each; the fix delta introduces no new
FIX-worthy findings.

One carry-over, NOT a code fix and NOT a blocker for the code loop: §1 (planning docs
untracked) is still `??` in `git status` and remains `_pending triage_` from Phase 4 —
it was never folded into a FIX. It is pure housekeeping resolved by committing
`planning/daily-log/{DISCUSSION,REVIEW}.md` in their own planning commit when finalizing
(per CLAUDE.md "working docs live in `planning/` and are tracked in git"). Handle it as
part of preparing the PR, not via another `/wf-fix` pass.
