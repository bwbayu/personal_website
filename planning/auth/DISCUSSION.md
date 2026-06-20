# Auth (S2) — Design Discussion

> Session S2 of the feature roadmap. Implements T6 (LOCKED): admin auth via Firebase
> Auth Google provider + email allowlist; BE verifies the Firebase ID token via the
> Admin SDK on write routes. This doc takes the LOCKED T6 decision as its contract and
> works out the code-level design. The roadmap Decisions log
> ([planning/feature-roadmap/DISCUSSION.md](../feature-roadmap/DISCUSSION.md)) is LOCKED
> and must not be contradicted.

## 1. Objective

Let Bayu sign in to the (future) admin area with his Google account and have the
backend trust those requests. Concretely:
- **FE**: Google sign-in flow + attach the Firebase ID token to API calls.
- **BE**: verify the Firebase ID token via the Admin SDK on write routes, restricted to
  an email allowlist (Bayu's Gmail).
- Prerequisite for S3 (admin CMS scaffold). S2 should *prove the auth path works
  end-to-end* before the CMS is built on top.

## 2. Grounding / data flow (verified against code)

- **BE write auth today** = single static `x-api-key`, timing-safe compared against
  `config.apiKey`, applied per-route — [auth.middleware.ts](../../backend/src/middlewares/auth.middleware.ts).
  Wiring order per route: `validateSlugId -> authMiddleware -> validate(schema) -> controller`
  (e.g. [skill.routes.ts:17-20](../../backend/src/skills/skill.routes.ts#L17-L20)). Reads are public.
- **Config** is env-driven — [env.ts](../../backend/src/config/env.ts): `apiKey` from
  `API_KEY`; required in prod. No Firebase config yet.
- **Firestore client** uses ADC on Cloud Run (`new Firestore()`, no key file) —
  [firestore.ts](../../backend/src/config/firestore.ts).
- **BE deps**: no `firebase-admin` yet — [backend/package.json](../../backend/package.json).
- **FE deps**: no `firebase` yet — [frontend/package.json](../../frontend/package.json).
- **FE data flow** is read-only today: `useApi` fetches on mount
  ([useApi.ts](../../frontend/lib/useApi.ts)); per-domain fetchers do plain `GET` with
  `cache: 'no-store'` and NO auth header (e.g. [skills.ts](../../frontend/app/api/skills.ts)).
  There is no write path / no `/admin` route group yet.
- **Deployment**: FE on Firebase Hosting, BE on Cloud Run, both under one GCP/Firebase
  project sharing `GCP_SA_KEY`. A Firebase project therefore already exists; Firebase
  **Auth** (Google provider) just needs enabling in the console (manual setup step).

### Wrong-premise surfaced
- T6 says "static API key kept for **seed/CLI scripts**." Verified false: `npm run
  migrate` / `patch:*` ([migration.ts](../../backend/src/config/migration.ts)) talk to
  Firestore **directly** via the `db` client — they never call the HTTP API, so they
  never send `x-api-key`. The only real consumer of `x-api-key` today is manual/Postman
  admin writes. => Keeping `x-api-key` is a *break-glass / non-browser client*
  convenience choice, not a script requirement. (Affects Decision 2.)

### Note on Admin SDK credentials
- `admin.auth().verifyIdToken()` validates the JWT signature against Google's public
  certs (fetched over plain HTTPS) with `audience = projectId`, `issuer = securetoken`.
  It needs the **project ID**, not a privileged service account. On Cloud Run, ADC
  supplies the project; locally we just set a project-id env var. So credentials are a
  near-non-issue — no new key file needed. (Affects Decision 4.)

## 3. Key decisions

1. **S2 route-wiring scope** — LOCKED. Wire the combined auth middleware onto ALL
   existing write routes now and prove end-to-end. Reconciles with roadmap S3 row: S2
   makes write routes *accept* the Firebase token (alongside `x-api-key`); the optional
   *removal* of `x-api-key` ("swap") remains a later/S3 nicety, not required.
2. **`x-api-key` fate on HTTP write routes** — LOCKED. Combined: middleware accepts an
   allowlisted Firebase ID token OR the static `x-api-key`. Key stays as break-glass /
   non-browser (Postman, curl) access. Nothing breaks.
3. **Email allowlist location** — LOCKED. Env var `ADMIN_EMAILS` (comma-separated),
   parsed in [env.ts](../../backend/src/config/env.ts) like `allowedOrigins`. Changing
   the list = redeploy/restart. Firestore-backed allowlist is parked (overkill for one
   user).
4. **BE Admin SDK init + local credentials** — LOCKED. Add `firebase-admin`, init the
   app once at startup (own config module), project id from env (`FIREBASE_PROJECT_ID`,
   fallback `GOOGLE_CLOUD_PROJECT`), ADC supplies it in prod. No new service-account key
   file — `verifyIdToken` only needs the project id.
5. **FE sign-in approach** — LOCKED. Add `firebase` Web SDK; Google **popup** sign-in
   (`signInWithPopup`) at `/admin/login`; SDK persists the session (IndexedDB) and
   auto-refreshes; an auth context exposes the user; `getIdToken()` is fetched per write
   request and attached as `Authorization: Bearer`. New `NEXT_PUBLIC_FIREBASE_*` env.
   Deliverables are **reusable by S3**: `/admin` route group, login page, auth context +
   route guard, and an `authedFetch` helper. Prove end-to-end by hitting one existing
   write route (e.g. a skill PATCH) from a signed-in session.
6. **Combined middleware shape** — LOCKED. Rewrite the existing `authMiddleware` in
   place (keep the export name so no per-route file changes): if `Authorization: Bearer`
   present -> `verifyIdToken` + require `email_verified` + email in `ADMIN_EMAILS`; else
   fall back to the current timing-safe `x-api-key` check. Pass either => `next()`.
7. **Testing** — LOCKED. Unit-test the combined middleware in `backend/tests/auth/`
   (mock `verifyIdToken`): valid+allowlisted -> pass; valid+non-allowlist -> 403;
   `email_verified=false` -> reject; bad/expired token -> 401; missing token falls back
   to `x-api-key` (valid pass / invalid 403). Frontend stays typecheck-only.
8. **Manual setup (outside code)** — enable Firebase Authentication + Google provider in
   the console; add the Hosting domain(s) to Firebase Auth authorized domains.

## 4. Edge cases (collecting)
- Token expired / clock skew -> 401, FE forces token refresh (`getIdToken(true)`).
- Signed-in Google user NOT on allowlist -> 403 (authenticated but not authorized).
- `email_verified === false` -> reject.
- Missing/garbled `Authorization` header -> 401.
- Admin SDK not initialized / project id missing -> 500 "server misconfigured".
- CORS: `Authorization` header must be allowed (current cors config — verify it doesn't
  block custom headers).
- Rate limiting: write limiter (20/15min) still applies; login itself is on Firebase, not
  our API.

## 5. Decisions log (the contract)
- 2026-06-21 — D1 LOCKED: S2 wires the combined auth middleware onto ALL existing write
  routes now + proves end-to-end. `x-api-key` removal ("swap") is a later/S3 nicety, not
  required by S2.
- 2026-06-21 — D2 LOCKED: combined auth — accept an allowlisted Firebase ID token OR the
  static `x-api-key`. Key kept as break-glass / non-browser access.
- 2026-06-21 — D3 LOCKED: email allowlist = env var `ADMIN_EMAILS` (comma-separated),
  parsed in env.ts. Firestore allowlist parked.
- 2026-06-21 — Premise correction: seed/CLI scripts hit Firestore directly (not the HTTP
  API), so they never used `x-api-key`; keeping the key is a break-glass choice, not a
  script requirement.
- 2026-06-21 — D4 LOCKED: `firebase-admin`, init once, project id from env, ADC in prod,
  no new key file.
- 2026-06-21 — D5 LOCKED: `firebase` Web SDK, Google popup sign-in at `/admin/login`,
  auth context + guard + `authedFetch`; all reusable by S3; prove via one existing write
  route.
- 2026-06-21 — D6 LOCKED: rewrite `authMiddleware` in place as combined (Bearer token
  first, else x-api-key fallback); keep export name so per-route wiring is untouched.
- 2026-06-21 — D7 LOCKED: unit-test combined middleware in `backend/tests/auth/` (mock
  verifyIdToken); FE typecheck-only.
- 2026-06-21 — Manual setup noted: enable Firebase Auth + Google provider; add Hosting
  domain to authorized domains.

## 6. Parking lot / later
- Firebase custom claims (role-based) instead of email allowlist — overkill for one user.
- Revocation check (`verifyIdToken(token, true)` + `checkRevoked`) — adds a Firestore/
  network round-trip; likely unnecessary at this scale.
- Session cookies (Admin SDK `createSessionCookie`) instead of bearer tokens — heavier;
  bearer-per-request is simpler for a static-export SPA.
