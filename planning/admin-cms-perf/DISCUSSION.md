# Admin CMS — Data Cache + Backend Fixes (S3.2) — Design Discussion

> Sub-session S3.2 of the feature roadmap, after S3 (admin-cms) and S3.1
> (admin-cms-design). Scope = a small batch of follow-ups, mostly backend: client-side
> read caching, an atomic backend reorder, a read rate-limit adjustment, and a "back to
> site" button in the admin. The earlier LOCKED contracts (admin-cms D1–D11,
> admin-cms-design DD1–DD6, auth) must not be regressed.
>
> Branch note: the S3.1 frontend FIX pass (REVIEW.md SS1/SS2/SS4/SS5) is in flight on
> `feat/admin-cms-design` and is UNRELATED to this work — ignore it here. S3.2 will branch
> from `develop` once that fix merges. For grounding NOW, code is read from
> `feat/admin-cms-design`.

## 1. Objective

Four follow-ups (user's words):
1. **Home button in admin** — an easy link back to the public site from the admin.
2. **Cache read data** — every visit to project / experience / skills re-fires the read
   endpoint. Optimize with a cache (TanStack-style): serve cache when data is unchanged;
   on an update, refetch and update the cache.
3. **Atomic reorder** — the two-PATCH reorder can leave inconsistent `order` on partial
   failure (REVIEW SS7); needs a backend atomic swap/reorder.
4. **Read rate limit** — bump and/or rely on caching. Currently 60/min read; operator hits
   429 just opening admin (REVIEW SS10). If caching lands, 60/min may suffice; otherwise
   raise to 100.

## 2. Grounding (verified against code)

- **Rate limiters** ([backend/app.ts:27-34](../../backend/app.ts#L27-L34)): read
  `windowMs 60s, max 60`; write `max 10`; applied to `/api`, per-IP (`trust proxy 1`).
  GET responses also get `Cache-Control: public, max-age=300, s-maxage=600`
  ([app.ts:35-40](../../backend/app.ts#L35-L40)) — but see next point. (CLAUDE.md still
  says "200/15min read, 20/15min write" — STALE vs the actual 60/10 per minute.)
- **FE read path bypasses HTTP cache**: public fetchers and the admin list/read helpers
  fetch with `cache: 'no-store'` ([useApi.ts](../../frontend/lib/useApi.ts) fetches on
  every mount; [authedFetch.ts](../../frontend/lib/authedFetch.ts) defaults `no-store`),
  so the server `Cache-Control` is never honored and there is no in-memory dedup/cache.
- **Dashboard fan-out**: `/admin` fires one GET per non-singleton domain (8) on every
  mount (REVIEW SS6/SS10) — the main 429 amplifier, doubled under dev StrictMode.
- **Reorder** ([DomainListClient.tsx:125-147](../../frontend/components/admin/DomainListClient.tsx#L125-L147)):
  `move()` swaps `order` via `Promise.all` of two independent PATCHes, then refetches.
  Partial failure = two rows share an `order`, no rollback. Only skills + categories are
  reorderable (D3). No backend batch/transaction endpoint exists; the generic
  [FirestoreRepository<T>](../../backend/src/shared/firestore.repository.ts) has no batch
  method (Firestore client DOES support `db.batch()` / `runTransaction`).
- **Admin topbar** ([AdminShell.tsx:125-157](../../frontend/components/admin/AdminShell.tsx#L125-L157)):
  shows the user email + a Sign-out link only. After DD1 the admin no longer renders the
  public navbar, so there is no link back to `/`.
- **Deps**: frontend has no `@tanstack/react-query`
  ([frontend/package.json](../../frontend/package.json)); has `firebase`, `flowbite-react`.

## 3. Key decisions (all RESOLVED — see Decisions log §5)

All six are LOCKED: PD1 TanStack Query; PD2 scope = public + admin; PD3 invalidate on
writes; PD4 bulk reorder endpoint (Firestore batch); PD5 keep read limit at 60/min (only
fix stale docs); PD6 "View site" topbar link (same tab).

## 4. Edge cases (collecting)
- Cache staleness across tabs (edit in tab A, tab B shows stale until refetch/TTL) —
  acceptable single-operator; TanStack refetch-on-focus can mitigate.
- Reorder batch where one id no longer exists -> backend should 404/validate the set.
- Cache + auth: admin reads are public GETs today; caching them is fine (no per-user data).
- Bumping limits must not weaken abuse protection for the public API (reads are cheap;
  writes stay tight / auth-gated).
- HTTP-cache-only (D1c): a stale 300s window could hide a just-saved admin edit — needs a
  cache-busting refetch after writes regardless.

## 5. Decisions log (the contract)
- 2026-06-21 — Scope LOCKED: S3.2 = home button + read caching + atomic backend reorder +
  read rate-limit adjustment. Branches from `develop` after the S3.1 FIX pass merges; the
  in-flight S3.1 frontend fix is unrelated and out of scope here.
- 2026-06-21 — PD1 LOCKED: caching = **TanStack Query** (`@tanstack/react-query`).
  `QueryClientProvider` at the app root; queries keyed per endpoint with a `staleTime`;
  automatic dedup; refactor `useApi` consumers + admin fetchers onto it.
- 2026-06-21 — PD2 LOCKED: caching scope = **public site (home/project/resume) + admin**.
- 2026-06-21 — PD3 LOCKED: invalidation = after every successful create/update/delete/
  reorder, `invalidateQueries` for the affected domain so the admin reflects fresh data
  immediately (honors functional D10/D-CRUD behavior).
- 2026-06-21 — PD4 LOCKED: atomic reorder = **bulk reorder endpoint** per reorderable
  domain (skills, categories), e.g. `PATCH /api/<domain>/reorder` taking `[{id, order}]`,
  written in a single Firestore `batch()` (atomic). Add a `reorder`/batch method to the
  generic repo + a write-gated route. FE `move()` sends ONE request (replaces the two-PATCH
  swap); validate that every id in the set exists.
- 2026-06-21 — PD5 LOCKED: read rate limit = **keep 60/min** (caching is the real fix); no
  limit change. Only correct the STALE CLAUDE.md numbers (doc says 200/15min read,
  20/15min write; actual is 60/min read, 10/min write).
- 2026-06-21 — PD6 LOCKED: home button = a **"View site" link in the admin topbar** (next
  to email / Sign out) to `/`, navigating in the **same tab** (Firebase session persists).

## 6. Parking lot / later
- Drag-and-drop reorder UI (enabled by a bulk endpoint).
- Refetch-on-window-focus / background revalidation (if TanStack).
- Record S3.2 as a sub-session row in the roadmap DISCUSSION (bookkeeping, separate doc
  commit).
- ETag / conditional GET (304) instead of time-based cache — overkill at this scale.
