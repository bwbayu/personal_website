# Auth (S2) — Implementation Plan

Turns the LOCKED design in [DISCUSSION.md](DISCUSSION.md) into per-ticket tickets.
Honors the Decisions log (D1–D7) — do not relitigate. Branch: `feat/auth` cut from
`develop`. One commit per ticket. Scoped tests only.

## Verification of design currency (Phase 0, done)
Confirmed against code — no drift:
- [auth.middleware.ts](../../backend/src/middlewares/auth.middleware.ts) is still the
  static `x-api-key` timing-safe check; export name `authMiddleware`.
- [env.ts](../../backend/src/config/env.ts) shape matches (`apiKey`, `allowedOrigins`
  via `split(',').map(trim).filter`); prod-required guard present.
- Per-route order `validateSlugId -> authMiddleware -> validate -> controller` confirmed
  ([skill.routes.ts:17-20](../../backend/src/skills/skill.routes.ts#L17-L20)).
- No `firebase-admin` in [backend/package.json], no `firebase` in
  [frontend/package.json].
- CORS = `cors({ origin: ... })` with **no** `allowedHeaders`
  ([app.ts:17](../../backend/app.ts#L17)). The `cors` package default reflects the
  request's `Access-Control-Request-Headers`, so `Authorization` is permitted with no
  change — verify during AUTH-3/AUTH-6; only add `allowedHeaders` if a browser write is
  actually blocked.
- FE root [layout.tsx](../../frontend/app/layout.tsx) renders public Navbar + Footer on
  every route; no `/admin` group, no auth context, no write path yet.
- Test harness: unit config [vitest.config.ts] (`tests/**/*.test.ts`, excludes
  `*.emulator.test.ts`), [tests/setup.ts] seeds `API_KEY`/project env. Mirror the DI/mock
  style of [skill.service.test.ts](../../backend/tests/test-harness/skill.service.test.ts).

### Resolved open choices (this session)
- **Admin chrome**: leave root layout as-is; add a nested `app/admin/layout.tsx` for the
  AuthProvider only. No `(public)/(admin)` route-group refactor in S2.
- **req identity**: combined middleware attaches the verified admin identity
  (`req.adminEmail`) via an Express Request type augmentation, for S3 reuse.

## Sequencing
Backend lands before the FE that consumes it: AUTH-1 -> AUTH-2 -> AUTH-3 (BE), then
AUTH-4 -> AUTH-5 -> AUTH-6 (FE). AUTH-6 is the end-to-end proof and depends on all prior.

## Manual prerequisites (outside code — D8)
Before AUTH-6 can be proven end-to-end (operator does these in the Firebase console):
- Enable Firebase Authentication + Google sign-in provider.
- Add the Hosting domain(s) + `localhost` to Firebase Auth **authorized domains**.
- Capture the Firebase Web config values for the FE `NEXT_PUBLIC_FIREBASE_*` env and the
  project id for the BE `FIREBASE_PROJECT_ID` env.

---

## AUTH-1 — Backend env: ADMIN_EMAILS + FIREBASE_PROJECT_ID
**Decisions:** D3, D4 (config portion).
**Scope:** Parse the new env in [env.ts](../../backend/src/config/env.ts); update
[.env.example](../../backend/.env.example). No behavior wired yet.

**Files**
- `backend/src/config/env.ts` — add:
  - `adminEmails: (process.env.ADMIN_EMAILS?.split(',') ?? []).map(s => s.trim().toLowerCase()).filter(Boolean)`
    (lowercase so allowlist matching is case-insensitive).
  - `firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT`
    (fallback per D4; may be `undefined` locally and resolved by ADC in prod).
  - Production guard: if `nodeEnv === 'production'` and `adminEmails.length === 0`, throw
    (an empty allowlist in prod would lock out the only admin / silently rely on
    `x-api-key`). Keep the existing `API_KEY` prod guard.
- `backend/.env.example` — add `ADMIN_EMAILS=you@example.com` and
  `FIREBASE_PROJECT_ID=your-gcp-project-id` with a one-line comment each.

**Acceptance criteria**
- `config.adminEmails` is a trimmed, lowercased, empty-filtered array; empty when unset.
- `config.firebaseProjectId` prefers `FIREBASE_PROJECT_ID`, falls back to
  `GOOGLE_CLOUD_PROJECT`, else `undefined`.
- Prod + empty `ADMIN_EMAILS` throws at import; dev + empty does not.
- `.env.example` documents both vars.

**Tests** — `backend/tests/auth/env.test.ts` (unit; manipulate `process.env` +
`vi.resetModules()` to re-import `config`):
- parse list with spaces/casing -> trimmed, lowercased, filtered.
- unset -> `[]`.
- `FIREBASE_PROJECT_ID` wins over `GOOGLE_CLOUD_PROJECT`; fallback works; both unset ->
  `undefined`.
- prod + empty `ADMIN_EMAILS` throws; dev + empty does not.
Run: `npx vitest run tests/auth` (from `backend/`).

---

## AUTH-2 — Backend Firebase Admin init module
**Decisions:** D4.
**Scope:** Add `firebase-admin`; create a config module that initializes the Admin app
exactly once and exposes a thin `verifyIdToken` seam the middleware will call. Module
self-initializes on first import (no app.ts wiring needed; the middleware import pulls it
in at startup).

**Files**
- `backend/package.json` — add `firebase-admin` (latest stable) to `dependencies`
  (`npm install firebase-admin`).
- `backend/src/config/firebase-admin.ts` — new:
  - Init guard using `admin.apps.length` (or `getApps()`), `initializeApp({ projectId:
    config.firebaseProjectId })` — `projectId` lets `verifyIdToken` set audience without a
    key file; ADC supplies it in prod (D4).
  - Export `verifyIdToken(token: string): Promise<DecodedIdToken>` delegating to
    `admin.auth().verifyIdToken(token)`. Keep this as the single mockable seam (AUTH-3
    mocks this module, not the SDK).

**Acceptance criteria**
- `firebase-admin` in `dependencies`; `package-lock.json` updated.
- `initializeApp` is called at most once even if the module is imported repeatedly
  (guard works).
- `verifyIdToken` is exported and forwards to `admin.auth().verifyIdToken`.
- Import does not throw when `firebaseProjectId` is undefined (init is lazy/guarded;
  failure surfaces only on an actual verify call).

**Tests** — `backend/tests/auth/firebase-admin.test.ts` (unit; `vi.mock('firebase-admin')`
with fake `apps`/`initializeApp`/`auth().verifyIdToken`):
- importing the module calls `initializeApp` once; a second import (after re-mock with a
  non-empty `apps`) does not re-init.
- `verifyIdToken('t')` calls `admin.auth().verifyIdToken('t')` and returns its result.
Run: `npx vitest run tests/auth`.

---

## AUTH-3 — Combined auth middleware (Bearer OR x-api-key)
**Decisions:** D1, D2, D6, D7 + resolved "attach identity".
**Scope:** Rewrite `authMiddleware` IN PLACE (keep the export name so no per-route file
changes — D6). If `Authorization: Bearer <token>` present: `verifyIdToken` + require
`email_verified === true` + `email` (lowercased) in `config.adminEmails`; on success
attach `req.adminEmail` and `next()`. Otherwise fall back to the existing timing-safe
`x-api-key` check. No changes to any `*.routes.ts` (D1: already wired on all write routes).

**Files**
- `backend/src/middlewares/auth.middleware.ts` — rewrite:
  - import `verifyIdToken` from `../config/firebase-admin` and `config` from `../config/env`.
  - Branch: header starts with `Bearer ` -> verify path; else -> existing key path.
  - Verify path errors -> `401` (`Invalid or expired token`); `email_verified !== true`
    -> `401` (or `403` — see note) `Email not verified`; email not in allowlist -> `403`
    (`Not authorized`); Admin SDK init/config failure (e.g. missing project id) -> `500`
    (`Server misconfigured`).
  - Key path: unchanged semantics (missing -> 401, no `apiKey` configured -> 500,
    mismatch -> 403).
- `backend/src/types/express.d.ts` (or existing global d.ts) — augment
  `Express.Request` with optional `adminEmail?: string`. Ensure it's picked up by tsconfig
  `include` (verify `tsc` build still passes).

**Decision points to honor (call out, don't expand scope)**
- Per D6 edge list: `email_verified === false` -> reject. Use **401** (token not usable)
  vs **403** — DISCUSSION §4 lists both reject/401 framings; pick **403** (authenticated
  but not acceptable) to distinguish from a bad/expired token (**401**). Document the
  chosen codes in the test names. (If the user prefers 401 for unverified, flip in
  Stage B.)
- Email comparison is case-insensitive (compare `decoded.email?.toLowerCase()` against the
  already-lowercased `config.adminEmails`).

**Acceptance criteria**
- Valid Bearer token, `email_verified` true, email in allowlist -> `next()` called,
  `req.adminEmail` set, no response sent.
- Valid token, email NOT in allowlist -> `403`, `next` not called.
- Valid token, `email_verified` false -> `403` (chosen code), `next` not called.
- Bad/expired token (`verifyIdToken` rejects) -> `401`, `next` not called.
- No `Authorization` header, valid `x-api-key` -> `next()` (fallback preserved).
- No `Authorization` header, invalid `x-api-key` -> `403`; missing key -> `401`.
- `verifyIdToken` is never called on the x-api-key fallback path.
- All existing `*.routes.ts` unchanged (export name preserved).

**Tests** — `backend/tests/auth/auth.middleware.test.ts` (unit; `vi.mock` the
`firebase-admin` config module's `verifyIdToken`; build fake `req`/`res`/`next` like the
existing service test style). Cover every AC above. Set `config.adminEmails` via env +
module reset, or mock the env module. Assert status codes + `next` call + `req.adminEmail`.
Run: `npx vitest run tests/auth`.

> No Firestore touched in AUTH-1..3, so the emulator slice is not required for these.
> Still run `cd backend; npm run test:emulator` once before the FIRST commit if any change
> incidentally touches Firestore-backed code (it should not here).

---

## AUTH-4 — Frontend Firebase Web SDK init + env
**Decisions:** D5 (init portion).
**Scope:** Add `firebase`; create a single client init module reading
`NEXT_PUBLIC_FIREBASE_*`; document env. No UI yet.

**Files**
- `frontend/package.json` — add `firebase` (latest stable v10/11) to `dependencies`.
- `frontend/lib/firebase.ts` — new (client-only): `initializeApp` from
  `NEXT_PUBLIC_FIREBASE_{API_KEY,AUTH_DOMAIN,PROJECT_ID,APP_ID}` (+ others as the console
  provides), guarded with `getApps().length` so HMR/static export doesn't double-init;
  export `auth = getAuth(app)` and a `googleProvider = new GoogleAuthProvider()`.
- `frontend/.env.example` — add the `NEXT_PUBLIC_FIREBASE_*` keys with placeholder values
  and a comment that they come from the Firebase console (D8).

**Acceptance criteria**
- `lib/firebase.ts` initializes at most once (`getApps()` guard) and exports `auth` +
  `googleProvider`.
- All config values come from `NEXT_PUBLIC_FIREBASE_*` env (no hardcoded secrets).
- `.env.example` lists every key the module reads.

**Tests** — typecheck only: `cd frontend; npm run typecheck` (bare `tsc --noEmit`, no `-b`).

---

## AUTH-5 — Frontend auth context + provider + authedFetch
**Decisions:** D5 (context + helper portions). Reusable by S3.
**Scope:** Auth context exposing the current user + auth state; `authedFetch` that pulls a
fresh ID token per request and attaches `Authorization: Bearer`. No pages yet.

**Files**
- `frontend/lib/AuthContext.tsx` — new client component: `AuthProvider` subscribing to
  `onAuthStateChanged(auth, ...)`; context value `{ user, loading, signIn, signOut }`
  where `signIn = signInWithPopup(auth, googleProvider)` and `signOut = firebaseSignOut`.
  Export a `useAuth()` hook.
- `frontend/lib/authedFetch.ts` — new: `authedFetch(input, init?)` that gets
  `auth.currentUser.getIdToken()` (throws/redirects if no user), merges
  `Authorization: Bearer <token>` into headers, defaults `cache: 'no-store'` to mirror the
  existing fetchers ([skills.ts](../../frontend/app/api/skills.ts)). On `401` it may retry
  once with `getIdToken(true)` (force refresh) per DISCUSSION §4 clock-skew edge case.

**Acceptance criteria**
- `useAuth()` returns `{ user, loading, signIn, signOut }`; `AuthProvider` updates on
  `onAuthStateChanged`.
- `authedFetch` attaches `Authorization: Bearer` from a fresh `getIdToken()`; one forced-
  refresh retry on `401`.
- Types compile; no use of `NEXT_PUBLIC_API_URL` hardcoding beyond the existing pattern.

**Tests** — typecheck only: `cd frontend; npm run typecheck`.

---

## AUTH-6 — Frontend /admin route group + login + end-to-end proof
**Decisions:** D1, D5 (prove end-to-end via one existing write route). Depends on AUTH-1..5
and the manual prerequisites.
**Scope:** Minimal `/admin` area that proves the full path: sign in with Google popup,
then perform one authenticated write (skill PATCH) and show the result. Chrome left as-is
(nested layout only — resolved choice).

**Files**
- `frontend/app/admin/layout.tsx` — new client layout wrapping children in `AuthProvider`
  (public Navbar/Footer from root layout still render — accepted for S2).
- `frontend/app/admin/login/page.tsx` — `useAuth()`; a "Sign in with Google" button
  (`signIn`); redirect to `/admin` once `user` is set.
- `frontend/app/admin/page.tsx` — route guard: if `!user && !loading` -> redirect to
  `/admin/login`; otherwise render a minimal proof control that calls `authedFetch` against
  one existing write route (e.g. `PATCH /api/skills/:id` with a no-op-ish field like
  `{ order }`) and displays success/error + the signed-in email. Throwaway UI; the reusable
  parts are the layout/guard/context/authedFetch.

**Acceptance criteria**
- Visiting `/admin` unauthenticated redirects to `/admin/login`.
- Google popup sign-in succeeds for an allowlisted account; session persists across reload
  (Firebase IndexedDB persistence).
- The proof control performs an authenticated write that the backend ACCEPTS (200), and a
  signed-out / non-allowlisted attempt is rejected (401/403) — confirming AUTH-3
  end-to-end.
- `npm run build` (static export) still succeeds with the new `/admin` routes.

**Tests**
- Typecheck: `cd frontend; npm run typecheck`.
- Build smoke: `cd frontend; npm run build` (static export must not break).
- **Manual e2e (operator):** after the D8 console setup, run BE + FE locally, sign in with
  the allowlisted Google account, trigger the proof write, confirm 200; then sign out (or
  use a non-allowlisted account) and confirm rejection. FE auth cannot be exercised
  headless — call this out in the ticket per EXECUTION_FLOW Stage C.

---

## Ticket -> commit SHA (filled during /wf-implement)
| Ticket | Subject | SHA |
|--------|---------|-----|
| AUTH-1 | feat(backend): parse ADMIN_EMAILS + FIREBASE_PROJECT_ID env | 099b641 |
| AUTH-2 | feat(backend): add firebase-admin init module | ea0e130 |
| AUTH-3 | feat(backend): verify Firebase ID token alongside x-api-key | e1c8018 |
| AUTH-4 | feat(frontend): add Firebase Web SDK client init | |
| AUTH-5 | feat(frontend): add auth context and authed fetch helper | |
| AUTH-6 | feat(frontend): add /admin login and prove authed write | |

## Out of scope (parked — DISCUSSION §6 / roadmap S3)
- Removing `x-api-key` from write routes ("swap") — S3 nicety, not S2 (D1/D2).
- (public)/(admin) route-group refactor for clean admin chrome.
- Firebase custom claims / role-based auth; token revocation check; session cookies.
- Real admin CMS UI (S3).
