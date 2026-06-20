# Auth (S2) — Review Notes (Phase 4)

Fresh-eyes, read-only audit of the `auth` feature. No code changed. Stops for triage.

## 1. Objective + scope

Audit `feat/auth` against [PLAN.md](PLAN.md) (AUTH-1..6), the LOCKED
[DISCUSSION.md](DISCUSSION.md) Decisions log (D1..D8), and an edge-case checklist.

- **Base used:** `develop` (the command rendered the slug as "develop", but the branch
  is `feat/auth`, `planning/auth/` exists, and commits are AUTH-1..6 — so slug = `auth`,
  base = `develop`).
- **Commits reviewed** (`git log --oneline develop..HEAD`, code only):
  `099b641` AUTH-1, `ea0e130` AUTH-2, `e1c8018` AUTH-3, `aa2b5d2` AUTH-4,
  `f2873b6` AUTH-5, `a1a1005` AUTH-6 (+ the `7eb1ea6` planning commit and per-ticket
  SHA-record doc commits).
- **Pending / not built:** none — all six tickets implemented.
- **Tests run by the reviewer:**
  - `npx vitest run tests/auth` -> **18 passed** (3 files).
  - `cd frontend; npm run typecheck` -> **clean**.
  - `cd backend; npx tsc --noEmit` -> **clean** (verifies the `express.d.ts` augmentation
    and the middleware types compile).
  - `cd frontend; npm run build` (static export) -> **succeeds on a clean build**; `/admin`
    and `/admin/login` prerender as static (confirms the lazy `getFirebaseAuth()` accessor
    avoids the prerender crash). See §9 for the transient Windows build flakes observed.
  - Emulator slice: **not required** — no Firestore-touching code changed (no repository /
    domain-query / endpoint logic; `*.routes.ts` untouched). Java availability is moot here.

## 2. Plan-conformance table

| Ticket | Status | Evidence |
|--------|--------|----------|
| AUTH-1 env: ADMIN_EMAILS + FIREBASE_PROJECT_ID | **Met** | [env.ts:12-16](../../backend/src/config/env.ts#L12-L16) (trim/lowercase/filter; project-id fallback), prod guard [env.ts:23-25](../../backend/src/config/env.ts#L23-L25), [.env.example:6-9](../../backend/.env.example#L6-L9), tests [env.test.ts](../../backend/tests/auth/env.test.ts). **But the prod guard is never satisfied by the deploy — see §1.** |
| AUTH-2 firebase-admin init module | **Met (w/ documented v14 deviation)** | [firebase-admin.ts](../../backend/src/config/firebase-admin.ts) uses modular `getApps()/initializeApp` + `getAuth().verifyIdToken`; once-only guard; tests [firebase-admin.test.ts](../../backend/tests/auth/firebase-admin.test.ts). **Runtime-version risk — see §2.** |
| AUTH-3 combined middleware | **Met (w/ documented 401/500 split)** | [auth.middleware.ts](../../backend/src/middlewares/auth.middleware.ts); export name preserved, `*.routes.ts` untouched ([skill.routes.ts:18-20](../../backend/src/skills/skill.routes.ts#L18-L20)); `req.adminEmail` via [express.d.ts](../../backend/src/types/express.d.ts); all 8 ACs covered by [auth.middleware.test.ts](../../backend/tests/auth/auth.middleware.test.ts). Key-path semantics byte-for-byte unchanged vs `develop`. |
| AUTH-4 FE Firebase Web SDK init | **Met (w/ documented accessor deviation)** | [firebase.ts](../../frontend/lib/firebase.ts) `getApps()` guard, lazy `getFirebaseAuth()`, `googleProvider`; [.env.example:3-6](../../frontend/.env.example#L3-L6). **Prod env not injected — see §3.** |
| AUTH-5 auth context + authedFetch | **Met** | [AuthContext.tsx](../../frontend/lib/AuthContext.tsx) (`useAuth`, `onAuthStateChanged`, signIn/signOut), [authedFetch.ts](../../frontend/lib/authedFetch.ts) (Bearer + `cache:'no-store'` + one forced-refresh retry on 401). |
| AUTH-6 /admin + e2e proof | **Met (code); manual e2e NOT run** | [admin/layout.tsx](../../frontend/app/admin/layout.tsx), [admin/login/page.tsx](../../frontend/app/admin/login/page.tsx), [admin/page.tsx](../../frontend/app/admin/page.tsx); guard + PATCH proof; build succeeds. Manual Google-popup e2e cannot run headless (requires D8 console setup). Reject-path proof nuance — see §5. |

## 3. Decision-conformance table

| Decision | Honored? | Evidence |
|----------|----------|----------|
| D1 wire combined mw on ALL write routes, prove e2e; no key removal | **Yes** | Export name kept, routes untouched; proof control PATCHes a real write route. |
| D2 accept Firebase token OR x-api-key (key = break-glass) | **Yes** | [auth.middleware.ts:17-70](../../backend/src/middlewares/auth.middleware.ts#L17-L70) Bearer branch then x-api-key fallback. |
| D3 allowlist via env `ADMIN_EMAILS` parsed in env.ts | **Yes (code)** | [env.ts:12-14](../../backend/src/config/env.ts#L12-L14). Deploy does not supply it — §1. |
| D4 firebase-admin, init once, project id from env, ADC in prod, no key file | **Yes (w/ caveats)** | [firebase-admin.ts:10-12](../../backend/src/config/firebase-admin.ts#L10-L12). Node-version (§2) + project-id-in-prod (§4). |
| D5 firebase Web SDK, Google popup, context+guard+authedFetch, reusable | **Yes** | AUTH-4/5/6 files. |
| D6 rewrite authMiddleware in place, keep export name | **Yes** | No `*.routes.ts` in the diff; export name `authMiddleware` preserved. |
| D7 unit-test combined mw (mock verifyIdToken); FE typecheck-only | **Yes** | [auth.middleware.test.ts](../../backend/tests/auth/auth.middleware.test.ts) mocks the seam; FE has no runner. |
| D8 manual console setup (enable Auth, authorized domains, capture env) | **Operator step — pending** | Noted in PLAN. The deploy-pipeline wiring those captured values feed (§1, §3, §4) was **not** added. |
| Premise: seed/CLI scripts never used x-api-key | **N/A (no script changes)** | Confirmed unchanged. |
| Resolved: nested `app/admin/layout.tsx` only, no route-group refactor | **Yes** | [admin/layout.tsx](../../frontend/app/admin/layout.tsx). |
| Resolved: attach `req.adminEmail` for S3 reuse | **Yes** | [auth.middleware.ts:45](../../backend/src/middlewares/auth.middleware.ts#L45) + [express.d.ts](../../backend/src/types/express.d.ts). |

## 4. Edge-case checklist

| Case | Verdict |
|------|---------|
| `Authorization: Bearer <expired>` | OK — `auth/*` -> 401, FE force-refreshes once ([authedFetch.ts:27-29](../../frontend/lib/authedFetch.ts#L27-L29)). |
| Valid token, email not on allowlist | OK — 403, no retry (FE only retries 401), no loop. |
| `email_verified` false / undefined | OK — `!== true` -> 403 ([auth.middleware.ts:34](../../backend/src/middlewares/auth.middleware.ts#L34)). |
| Token decoded but `email` undefined | OK — `!email` -> 403 ([auth.middleware.ts:39-43](../../backend/src/middlewares/auth.middleware.ts#L39-L43)). |
| `Authorization: Bearer ` (empty token) | OK — `verifyIdToken('')` rejects `auth/*` -> 401. |
| Non-Bearer Authorization (e.g. `Basic`) | Falls through to x-api-key path -> 401 if no key. Consistent with DISCUSSION §4 (garbled -> 401), if slightly indirect. |
| No auth at all | OK — 401 "Missing API key". |
| Invalid x-api-key / no apiKey configured | OK — 403 / 500 (unchanged semantics). |
| `verifyIdToken` never hit on key path | OK — asserted by tests ([auth.middleware.test.ts:110,121,132](../../backend/tests/auth/auth.middleware.test.ts#L110)). |
| Admin SDK double-init / repeated import | OK — `getApps()` guard (BE + FE). |
| Static-export prerender of `/admin` | OK — lazy accessor; build prerenders `/admin*` as static. |
| Signed-out write attempt | Rejected **client-side** by authedFetch before hitting BE — see §5. |
| CORS allows `Authorization` header | Relies on cors default reflection; not e2e-verified — see §6. |
| Write rate limiter still applies to authed writes | OK — limiter is route-method based, independent of auth. |
| **Prod boot with current deploy env** | **FAILS — §1 (missing ADMIN_EMAILS -> guard throws).** |
| **Prod backend on Node 20 runtime** | **At risk — §2 (firebase-admin 14 wants Node >=22).** |
| **Prod FE Firebase config** | **Broken — §3 (NEXT_PUBLIC_FIREBASE_* not injected at build).** |

## 5. Findings

### §1 — Deploy does not set `ADMIN_EMAILS`; AUTH-1 prod guard will crash the backend on deploy  — **BLOCKER**
- **Where:** [.github/workflows/backend-deploy.yml:105](../../.github/workflows/backend-deploy.yml#L105) sets only `NODE_ENV@API_KEY@ALLOWED_ORIGINS`; guard at [env.ts:23-25](../../backend/src/config/env.ts#L23-L25).
- **What:** In prod `config.adminEmails` is `[]`, so `if (nodeEnv==='production' && adminEmails.length===0) throw` fires at module import. The backend process exits before serving; the deploy job's `/health` check (backend-deploy.yml:107-112) then fails the deploy.
- **Why it matters:** The first `develop -> main` deploy that includes AUTH-1 takes the backend down / fails the pipeline. The guard added by AUTH-1 (good defensive code) converts "auth silently disabled" into "service won't boot" — so the omission is fatal, not cosmetic. Invisible to every gate: CI `test` runs Node 22 with mocked SDK, unit tests stub `config`, local dev sets `.env`.
- **Fix:** Add `ADMIN_EMAILS` (and see §4) to the `--set-env-vars` list, sourced from a new `secrets.ADMIN_EMAILS`. Confirm the secret exists before the merge to `main`.
- **Refs:** AUTH-1, D3, D8.

### §2 — `firebase-admin@14` requires Node >=22, but the Cloud Run image is `node:20-alpine`  — **BLOCKER**
- **Where:** [backend/package.json:23](../../backend/package.json#L23) (`"firebase-admin": "^14.0.0"`, installed 14.0.0 declares `engines.node ">=22"`); runtime image [backend/Dockerfile:1,11](../../backend/Dockerfile#L1) (`node:20-alpine` builder + runner), built and deployed by [backend-deploy.yml:70-75](../../.github/workflows/backend-deploy.yml#L70-L75).
- **What:** CI `test`, both deploy workflows, and local dev all run Node 22, so nothing flags it; only the actual Cloud Run runtime is Node 20. `npm ci` only warns (no `engine-strict`), so the image builds — but firebase-admin 14 is unsupported on Node 20 and the init module imports it at startup ([auth.middleware.ts:4](../../backend/src/middlewares/auth.middleware.ts#L4) -> firebase-admin config -> `initializeApp` at import).
- **Why it matters:** Risk of a startup crash or runtime failure on the first authed write in prod — again only observable post-deploy.
- **Fix (pick one):** bump the Dockerfile to `node:22-alpine` (zero-risk — matches CI, both deploy workflows, and local dev); **or** pin `firebase-admin` to a major that supports Node 20. The Dockerfile bump is the clean alignment.
- **Refs:** AUTH-2, D4.

### §3 — Frontend deploy injects only `NEXT_PUBLIC_API_URL`; `NEXT_PUBLIC_FIREBASE_*` are absent at build, breaking sign-in in prod  — **BLOCKER**
- **Where:** [frontend-deploy.yml:51-55](../../.github/workflows/frontend-deploy.yml#L51-L55) `env:` block has only `NEXT_PUBLIC_API_URL`; the module reads four `NEXT_PUBLIC_FIREBASE_*` values ([firebase.ts:7-10](../../frontend/lib/firebase.ts#L7-L10)).
- **What:** `NEXT_PUBLIC_*` is inlined into the static bundle at **build** time. The deployed `/admin/login` ships with `apiKey: undefined`, so `getFirebaseAuth()` -> `initializeApp({apiKey: undefined,...})` -> `getAuth()` throws `auth/invalid-api-key` in the browser; Google popup sign-in never works in prod.
- **Why it matters:** The admin login is non-functional in production even though it works locally (local `.env` supplies the values). Firebase Hosting serves static files only — there is no runtime env to fall back on.
- **Fix:** Add the four `NEXT_PUBLIC_FIREBASE_*` keys to the Build SSG `env:` block, sourced from secrets. (These are public client values, but storing as secrets keeps the workflow uniform.)
- **Refs:** AUTH-4, AUTH-6, D5, D8.

### §4 — `FIREBASE_PROJECT_ID` not passed to Cloud Run; token-audience check relies on ADC metadata discovery  — **SHOULD-FIX**
- **Where:** [backend-deploy.yml:105](../../.github/workflows/backend-deploy.yml#L105) (no `FIREBASE_PROJECT_ID`); fallback chain [env.ts:16](../../backend/src/config/env.ts#L16) (`?? GOOGLE_CLOUD_PROJECT`, which Cloud Run does **not** guarantee as a reserved env var).
- **What:** `config.firebaseProjectId` will likely be `undefined` in prod, so `initializeApp({projectId: undefined})` depends on the Admin SDK discovering the project from the ADC metadata server to set the `verifyIdToken` audience. D4 explicitly accepts ADC, so this is defensible — but it is the unverified, implicit path.
- **Why it matters:** If metadata discovery doesn't yield a project id, every Bearer verify fails (surfacing as 500 "Server misconfigured" per the 401/500 split). Setting it explicitly removes the ambiguity at near-zero cost.
- **Fix:** Add `FIREBASE_PROJECT_ID=personal-website-490704` (the project already hardcoded in the deploy) to `--set-env-vars`.
- **Refs:** AUTH-1, AUTH-2, D4.

### §5 — AUTH-6 reject proof: a signed-out attempt is rejected client-side, never reaching the backend  — **NICE-TO-HAVE**
- **Where:** [authedFetch.ts:15-17](../../frontend/lib/authedFetch.ts#L15-L17) throws "Not authenticated" when `currentUser` is null.
- **What:** AUTH-6's AC says "a signed-out / non-allowlisted attempt is rejected (401/403) — confirming AUTH-3 end-to-end." The *non-allowlisted signed-in* case does hit the backend and returns 403 (good e2e proof). The *signed-out* case never sends a request, so the operator cannot observe a backend 401/403 from this UI for that sub-case.
- **Why it matters:** Minor — the backend reject paths are covered by unit tests, and the non-allowlisted account demonstrates the live reject. Only the AC wording over-promises. Worth a one-line clarification in the manual-e2e steps (use a non-allowlisted Google account to see the backend 403).
- **Refs:** AUTH-6.

### §6 — CORS `Authorization` allowance relies on the cors package default and was never e2e-verified  — **NICE-TO-HAVE**
- **Where:** [app.ts:17](../../backend/app.ts#L17) `cors({ origin })` with no `allowedHeaders`.
- **What:** The cors package reflects the request's `Access-Control-Request-Headers` into the preflight response, so `Authorization` is permitted by default — correct, but the PLAN asked to verify this during AUTH-3/AUTH-6 and the manual e2e was not run.
- **Why it matters:** If a future cors tweak­ening pins `allowedHeaders`, browser writes silently break. Confirm during manual e2e; only add an explicit `allowedHeaders` if a real browser write is blocked (per the PLAN note — do not pre-add).
- **Refs:** AUTH-3 (plan note), DISCUSSION §4.

### §7 — `let decoded;` in the middleware is implicit `any`  — **NICE-TO-HAVE**
- **Where:** [auth.middleware.ts:20](../../backend/src/middlewares/auth.middleware.ts#L20).
- **What:** Typecheck passes, but `decoded` loses its `DecodedIdToken` type, so `email`/`email_verified` accesses are unchecked.
- **Why it matters:** Trivial type-safety / readability. Annotate `let decoded: DecodedIdToken;` (import the type, already used by the seam).
- **Refs:** AUTH-3.

### §8 — `firebase` pinned at `^12` vs the PLAN's parenthetical "v10/11"  — **NICE-TO-HAVE / observation**
- **Where:** [frontend/package.json:15](../../frontend/package.json#L15) (`^12.15.0`).
- **What:** The PLAN said "latest stable v10/11"; v12 is the current latest stable, so the intent ("latest stable") is honored, just a newer major than the snapshot in the doc.
- **Why it matters:** No action expected; noted for traceability so a future reader doesn't treat it as drift.
- **Refs:** AUTH-4.

### §9 — Transient Windows-only Next build-pipeline flakes (not an auth defect)  — **OUT-OF-SCOPE / observation**
- **What:** During review the static-export build failed twice from environment issues that cleared on a clean rebuild: (a) a stale-`.next` `PageNotFoundError: /project`, then (b) a `collect-build-traces` `ENOENT` on `_not-found.js.nft.json`. A clean `rm -rf .next out && npm run build` succeeded on both `develop` and `feat/auth`, with `/admin*` prerendered.
- **Why it matters:** Not attributable to this feature. Operator note: if CI ever flakes here, a clean rebuild is the remedy; the prod build runs on Linux runners where these Windows FS races don't occur.
- **Refs:** none (environmental).

## 6. Open questions for discussion

1. **Deploy-wiring scope.** §1/§2/§3 (and §4) are all CI/CD + Dockerfile changes the PLAN never listed (D8 covered console setup + capturing values, not feeding them into the pipelines). Do we fix them in this `auth` branch now, or treat them as a separate "deploy wiring" task before the `develop -> main` ship? They are not exercised until that ship, but they will break it. **Recommendation: fix §1/§2/§3 here** — they are small, and shipping auth to prod without them is a guaranteed outage.
2. **Where do `ADMIN_EMAILS` / `NEXT_PUBLIC_FIREBASE_*` secrets live?** Confirm the GitHub Actions secrets exist (and the FE public values are acceptable as secrets) before merging toward `main`.
3. **§2 fix choice:** bump Dockerfile to `node:22-alpine` (preferred — aligns everything) vs. pin `firebase-admin` down. Any reason the runtime is intentionally Node 20?
4. **email_verified rejection code:** PLAN chose 403; DISCUSSION §4 also floated 401. Keep 403? (Tests assert 403 — fine to keep; just confirming the locked choice.)

## 7. Decisions log (triaged WITH the user 2026-06-21)

| Finding | Severity | Triage | Note |
|---------|----------|--------|------|
| §1 ADMIN_EMAILS not deployed | BLOCKER | **[FIXED] 0be32d6** | In this `auth` branch. Add `ADMIN_EMAILS` to backend-deploy.yml `--set-env-vars` from `secrets.ADMIN_EMAILS`. **Operator prereq: register the secret (not yet in GitHub).** |
| §2 firebase-admin 14 vs Node 20 image | BLOCKER | **FIX** | Bump Dockerfile builder+runner to `node:22-alpine` (aligns CI/dev). |
| §3 NEXT_PUBLIC_FIREBASE_* not built in | BLOCKER | **FIX** | Add the 4 `NEXT_PUBLIC_FIREBASE_*` to frontend-deploy.yml Build SSG `env:` from secrets. **Operator prereq: register the secrets (not yet in GitHub); FE public values OK as secrets per user.** |
| §4 FIREBASE_PROJECT_ID not deployed | SHOULD-FIX | **[FIXED] 0be32d6** | Inline literal `FIREBASE_PROJECT_ID=personal-website-490704` in backend-deploy.yml (not a secret — project id is already hardcoded in the workflow). Bundle with §1 (same file, separate concern; one commit for the deploy-env change is fine). |
| §5 signed-out reject is client-side | NICE-TO-HAVE | **FIX** | Doc-only: clarify in the manual-e2e steps that the backend reject proof uses a non-allowlisted Google account (signed-out is rejected client-side by authedFetch). |
| §6 CORS Authorization unverified | NICE-TO-HAVE | **NO-ACTION** | Correct by cors default; verify during manual e2e. Do NOT pre-add `allowedHeaders` (per PLAN note). |
| §7 `decoded` implicit any | NICE-TO-HAVE | **FIX** | One-liner: `let decoded: DecodedIdToken;` in auth.middleware.ts. |
| §8 firebase ^12 vs plan note | NICE-TO-HAVE | **NO-ACTION** | "Latest stable" intent honored; noted for traceability only. |
| §9 Windows build flakes | OUT-OF-SCOPE | **NO-ACTION** | Environmental; clears on clean rebuild. Operator note only. |

### Operator prerequisites before `develop -> main` deploy (carry forward, like D8)
- Register GitHub Actions secret **`ADMIN_EMAILS`** (comma-separated allowlist) — without it the prod backend throws at startup (§1).
- Register GitHub Actions secrets **`NEXT_PUBLIC_FIREBASE_API_KEY` / `_AUTH_DOMAIN` / `_PROJECT_ID` / `_APP_ID`** — without them prod sign-in is broken (§3). FE public values, stored as secrets per user's OK.
- `FIREBASE_PROJECT_ID` is inlined as a literal (§4) — no secret needed.

### Fix-phase scope
FIX: §1, §2, §3, §4, §5, §7.  NO-ACTION: §6, §8, §9.
Touches: `backend-deploy.yml`, `frontend-deploy.yml`, `backend/Dockerfile`,
`backend/src/middlewares/auth.middleware.ts` (§7), and a doc clarification (§5).
Note: §1/§3/§4 are CI/CD workflow files filtered on `backend/**` / `frontend/**`; they
are real code changes for this feature even though no AUTH-N ticket listed them.
