# Admin CMS — Data Cache + Backend Fixes (S3.2) — Review (Pass 1)

Fresh-eyes, read-only audit of `feat/admin-cms-perf` vs `develop`. No code changed.

## 1. Objective & scope

Review the S3.2 implementation against [PLAN.md](PLAN.md) (the contract), the LOCKED
Decisions log in [DISCUSSION.md](DISCUSSION.md) (PD1–PD6), and an edge-case checklist,
per [EXECUTION_FLOW.md](../../EXECUTION_FLOW.md) Phase 4.

**Diff scope** (`git diff develop...HEAD`, 14 commits): 8 code commits + 6 planning/doc
commits. All 7 tickets are marked DONE in PLAN.md and all are present in the diff.

Commit → ticket map (code commits only):
| Commit | Ticket |
|--------|--------|
| `5d18c37` | ACMP-1 backend atomic bulk reorder |
| `4234ab4` | ACMP-2 TanStack Query provider |
| `db204d3` | ACMP-3 public reads -> useQuery; delete useApi |
| `b9f5678` | ACMP-4 admin reads -> useQuery + invalidate |
| `7c08ce7` | ACMP-5 admin reorder via bulk endpoint |
| `ce5fa24` | ACMP-6 "View site" topbar link |
| `2e49e9f` | ACMP-7 docs (CLAUDE.md + test comment) |

Nothing is pending; the feature is fully built.

**Gates run by the reviewer (all green):**
- Backend unit: `npx vitest run tests/admin-cms-perf` -> 3 files / 8 tests pass.
- Frontend: `npm run typecheck` -> clean.
- Emulator slice (operator pre-PR gate, Java/Temurin 21 present): `npm run test:emulator`
  -> 6 files / 15 tests pass (includes the new `reorder.repository.emulator.test.ts`).
- 3 edited fake-repo files are covered by the unit run (the `satisfies` ripple typechecks).

## 2. Plan-conformance

| Ticket | Status | Evidence |
|--------|--------|----------|
| ACMP-1 backend reorder | **Met** | `reorder()` on the generic repo via `db.batch()` ([firestore.repository.ts:42-49](../../backend/src/shared/firestore.repository.ts#L42-L49)); shared Zod array schema with min/max + unique-id refine ([reorder.schema.ts](../../backend/src/shared/reorder.schema.ts)); service existence pre-check returns `{ok:false,missing}` ([skill.service.ts:25-36](../../backend/src/skills/skill.service.ts#L25-L36), [category.service.ts:23-34](../../backend/src/categories/category.service.ts#L23-L34)); controller 404/`sendSuccess`; routes register `/reorder` **before** `/:id` ([skill.routes.ts:20-21](../../backend/src/skills/skill.routes.ts#L20-L21), [category.routes.ts:20-21](../../backend/src/categories/category.routes.ts#L20-L21)). All ACs covered by the 3 scoped tests + emulator. |
| ACMP-2 provider | **Met** | [providers.tsx](../../frontend/app/providers.tsx) creates one client via `useState`, defaults match the contract; mounted at root ([layout.tsx:29](../../frontend/app/layout.tsx#L29)). Typecheck clean. |
| ACMP-3 public reads | **Met** | [queries.ts](../../frontend/lib/queries.ts) keys + typed hooks; 5 consumers migrated (Home/Projects/Resume/Navbar/Footer); `useApi.ts` deleted; grep for `useApi` is clean. |
| ACMP-4 admin reads + invalidate | **Partial** | List/dashboard/edit/singleton/create migrated and every write path invalidates (see Decision PD3 row). BUT two admin read paths are NOT migrated — see **§1**. |
| ACMP-5 reorder via bulk | **Met** | `reorderItems()` one PATCH ([api.ts:78-88](../../frontend/lib/admin/api.ts#L78-L88)); `move()` sends one swapped pair then invalidates, `Promise.all` two-PATCH removed ([DomainListClient.tsx](../../frontend/components/admin/DomainListClient.tsx)). |
| ACMP-6 View site | **Met** | [AdminShell.tsx:179-189](../../frontend/components/admin/AdminShell.tsx#L179-L189) — `<Link href="/">View site</Link>`, same tab, in the right-side group with Sign out. |
| ACMP-7 docs | **Met** | CLAUDE.md FE paragraph rewritten to the TanStack story, no `useApi` mention, rate-limit numbers unchanged; stale test comment fixed ([skill.endpoint.emulator.test.ts:11](../../backend/tests/test-harness/skill.endpoint.emulator.test.ts#L11)). |

## 3. Decision-conformance (PD1–PD6)

| Dec | Honored? | Evidence |
|-----|----------|----------|
| PD1 TanStack Query at root, per-endpoint keys + staleTime, dedup, useApi migrated | **Yes** | provider + queries.ts; `useApi.ts` deleted. |
| PD2 scope = public + admin | **Mostly** | Public + admin list/dashboard/edit/singleton cached; **two admin form-input reads still uncached** (§1). |
| PD3 invalidate after every create/update/delete/reorder | **Yes** | create ([DomainFormPage.tsx:110](../../frontend/components/admin/DomainFormPage.tsx#L110)), edit ([:158](../../frontend/components/admin/DomainFormPage.tsx#L158)), singleton ([:226](../../frontend/components/admin/DomainFormPage.tsx#L226)), delete + 404 path ([DomainListClient.tsx:179,183](../../frontend/components/admin/DomainListClient.tsx#L179-L183)), reorder ([:149](../../frontend/components/admin/DomainListClient.tsx#L149)). |
| PD4 bulk reorder endpoint, single batch, validate id set, FE one request | **Yes** | ACMP-1 + ACMP-5 above. |
| PD5 keep 60/min; only fix stale docs | **Yes** | No rate-limit code touched; only CLAUDE.md + the one test comment (ACMP-7). |
| PD6 "View site" topbar link, same tab | **Yes** | ACMP-6 above. |
| QueryClient defaults (staleTime 5m / focus off / retry 1) | **Yes** | [providers.tsx:16-22](../../frontend/app/providers.tsx#L16-L22). Singleton query overrides `retry:false` as planned. |

## 4. Edge-case checklist

| Case | Result |
|------|--------|
| Reorder body: non-array | 400 from array validator (endpoint test asserts message contains "array", not "Invalid ID format") — **pass** |
| Reorder body: empty array | `.min(1)` -> 400 — pass (schema) |
| Reorder: unknown id | service short-circuits `{ok:false,missing}` -> 404, `repo.reorder` not called (unit); repo `batch.update` also rejects atomically (emulator) — **pass, belt & suspenders** |
| Reorder: route shadowing by `/:id` | `/reorder` registered before `/:id`; endpoint test proves authed `{}` hits the array validator, not `validateSlugId` — **pass** |
| Reorder: atomicity, other fields untouched | emulator test asserts orders updated, `name` untouched, and nothing written on a missing id — **pass** |
| Reorder: no/bad auth | 401 no creds / inherits 403/500 from `authMiddleware` (x-api-key fallback confirmed) — **pass** |
| Reorder: duplicate ids in payload | `.refine` rejects (defensive; UI always sends 2 distinct ids) — pass |
| Public read error/empty/loading | Home/Projects/Resume preserve `<Loading/>`/`<ErrorMessage/>`; `data ?? []` on navbar/footer — **pass** |
| media-socials dedup (navbar+footer) | same `mediaSocials` key -> one request — pass (verified by key, manual network check deferred) |
| Admin list shared with dashboard count | same `adminKeys.domain(apiPath)` key; `select: rows.length` for the card — pass |
| Dashboard singleton card | query `enabled:false` (v5 reports `isPending:true`) but count label only renders for `!singleton` ([DashboardClient.tsx:32](../../frontend/components/admin/DashboardClient.tsx#L32)) — no spurious "..." — **pass** |
| Edit of missing item | `rows.find(id)` -> null -> NotFound "could not be found" — pass |
| Edit list load error | `isError` -> NotFound with the error message (retry:1 first) — pass (parity with old behavior) |
| Singleton not-yet-created (404) | `retry:false`; `is404` -> empty editable form; non-404 -> NotFound — **pass** |
| Invalidate while not on the list | marks key stale; list/dashboard refetch on next mount (freshness via stale flag, not just active refetch) — pass |
| Reorder in-flight UX | `reordering` disables buttons; `await invalidateQueries` resolves after refetch before re-enable — pass |
| StrictMode / remount double-fetch | React Query dedups in-flight -> the old per-mount double-fire is gone for migrated paths (NOT for §1 components) |
| Static export unaffected | provider is a client component; `out/` still builds (typecheck proxy; full `npm run build` not run by reviewer) |
| TOCTOU delete between findAll check and commit | surfaces as 500 not 404 — accepted per PLAN risks (single operator) |

## 5. Findings

### §1 — Two admin form-input reads bypass the new cache (`TechPicker`, `CategorySelect`)
- **Status:** [FIXED] — commit `6ea228b`.
- **Severity:** SHOULD-FIX
- **Where:** [TechPicker.tsx:21-35](../../frontend/components/admin/inputs/TechPicker.tsx#L21-L35) (fetches skills),
  [CategorySelect.tsx:21-35](../../frontend/components/admin/inputs/CategorySelect.tsx#L21-L35) (fetches categories).
- **What:** Both still load their option lists with a raw `useEffect` + `listDomain(...)`
  (`cache: 'no-store'`), not migrated to `useQuery`. They fire an uncached GET to
  `/api/skills` / `/api/categories` on every project-form / skill-form open (and double-fire
  under dev StrictMode).
- **Why it matters:** This is exactly the pattern S3.2 set out to remove. DISCUSSION
  objective #2 names "skills" re-firing on every visit, and PD2 locks the caching scope as
  "public site + **admin**". Leaving these two on `no-store` is an incomplete realization of
  PD2 and an inconsistency: most admin reads now hit the shared cache while these two don't.
  They use `bySlug["skills"].apiPath` / `bySlug["categories"].apiPath`, the same paths as the
  list/dashboard, so migrating them to `useQuery({ queryKey: adminKeys.domain(...), queryFn })`
  would dedup against the already-cached skills/categories list and cost nothing in freshness
  (those keys are invalidated on write). Net: free cache hits + consistency, and removes the
  StrictMode double-fire.
- **Recommended fix:** Replace each `useEffect` loader with the existing `useQuery` +
  `adminKeys.domain(...)` pattern (keep the `setError`/loading-null UX by mapping
  `isError`/`isPending`). No backend change.
- **Reference:** ACMP-4 (SCOPE: "admin read paths"), PD2, DISCUSSION objective #2.
- **Note on conformance:** ACMP-4's enumerated "Files to touch" did NOT list these two files,
  so the implementation faithfully executed the plan as written — this is a **plan
  under-scope**, surfaced for triage, not an implementation defect. Reasonable to mark
  DEFERRED if the user considers option-list loaders out of this feature's intended scope.

### §2 — Public and admin caches fetch skills/categories under separate keys (by design)
- **Severity:** OUT-OF-SCOPE / by-design (no action expected)
- **Where:** [queries.ts](../../frontend/lib/queries.ts) — public `queryKeys.skills = ["skills"]`
  vs admin `adminKeys.domain(apiPath) = ["admin", apiPath]`.
- **What:** The public site and the admin area cache the same endpoints under different keys,
  so a user who is on both surfaces fetches each endpoint twice.
- **Why it matters / why no action:** This is intentional per ACMP-4 ("admin lists are
  unfiltered and refetched on write; distinct from the public keys"). A given browser session
  is realistically on one surface at a time, so the duplication is theoretical. Recorded only
  so triage sees it was considered.

## 6. Open questions

1. **§1 scope call:** migrate `TechPicker` + `CategorySelect` to `useQuery` now (one small
   FE commit, no new tests beyond typecheck), or DEFER to a follow-up because ACMP-4 did not
   enumerate them? (My lean: FIX now — it's cheap, removes the StrictMode double-fire, and
   completes PD2.)
2. Any objection to relying on the reviewer's emulator run as the pre-PR gate, given it is
   green here? (Operator normally runs it; it passed.)

## 7. Decisions log (filled WITH the user during triage)

| Finding | Severity | Decision (FIX / DEFERRED / NO-ACTION) | Notes |
|---------|----------|----------------------------------------|-------|
| §1 TechPicker/CategorySelect uncached | SHOULD-FIX | **FIX** | Migrate both option-list loaders to `useQuery` + `adminKeys.domain(...)`; FE-only, typecheck. **[FIXED]** `6ea228b`. |
| §2 separate public/admin keys | OUT-OF-SCOPE | **NO-ACTION** | By design (ACMP-4); duplication is theoretical. |

# Pass 2 review

Fresh-eyes re-review of the §1 fix delta only (not a full re-audit). Delta base
`2845fcb`; range `2845fcb..HEAD` = `6ea228b` (the §1 fix) + `27573cd` (doc: mark
finding fixed). The §1 fix is FE-only — two component files; no backend/Firestore
code changed in the delta. No code changed by this review.

## Status of previous FIX findings

| Finding | Verdict | Evidence |
|---------|---------|----------|
| §1 TechPicker/CategorySelect uncached | **verified-fixed** | Both loaders now use `useQuery`, not `useEffect`+`listDomain`. `TechPicker` keys on `adminKeys.domain(bySlug["skills"].apiPath)` ([TechPicker.tsx:22-25](../../frontend/components/admin/inputs/TechPicker.tsx#L22-L25)); `CategorySelect` on `adminKeys.domain(bySlug["categories"].apiPath)` ([CategorySelect.tsx:22-25](../../frontend/components/admin/inputs/CategorySelect.tsx#L22-L25)). Both `useEffect`/`useState` loaders are gone (diff removes them wholesale). |

**Key-share proven (the whole point of the fix).** [config.ts:59,80](../../frontend/lib/admin/config.ts#L59-L80) gives `bySlug["skills"].apiPath === '/api/skills'` and `bySlug["categories"].apiPath === '/api/categories'`. The list view ([DomainListClient.tsx:104,116](../../frontend/components/admin/DomainListClient.tsx#L104-L116)) and dashboard count ([DashboardClient.tsx:16-17](../../frontend/components/admin/DashboardClient.tsx#L16-L17)) key on `adminKeys.domain(config.apiPath)` with the *same* `apiPath` string from the *same* config source. So the two inputs produce byte-identical keys `["admin","/api/skills"]` / `["admin","/api/categories"]` — they dedup into the already-fetched list/dashboard cache entry (one request) and are invalidated by a skills/categories write ([DomainFormPage.tsx:110](../../frontend/components/admin/DomainFormPage.tsx#L110), [DomainListClient.tsx:149](../../frontend/components/admin/DomainListClient.tsx#L149)). This fully resolves the stated problem: no more per-open `no-store` GET and no StrictMode double-fire. PD2 (caching scope = public + admin) is now completely realized; ACMP-4's "Partial" in §2 of Pass 1 is closed.

**Behavioral parity confirmed (no regression).**
- Loading: old `skills === null` / `categories === null` -> new `isPending`. On a cache hit `isPending` is already false, so the loader skips the spinner entirely — strictly better.
- Error: old `catch` set `[]` + `error` and still rendered the select; new path on `isError` has `data` undefined -> `skills/categories = data ?? []`, `errorMessage` mapped, select still renders. Same UX. The global `retry:1` default now applies before the error shows — consistent with every other migrated admin read, an improvement not a regression.
- `nameFor` / `available` / `knownCurrent` now read a guaranteed array (`data ?? []`) instead of `skills?.`/`(skills ?? [])`; logic unchanged.

## New findings

(Highest existing § is §2; continuing at §3.)

### §3 — Fix shipped without a unit test (by FE convention; gate is typecheck)
- **Severity:** INFO / NO-ACTION
- **What:** No automated test accompanies `6ea228b`. Per CLAUDE.md the frontend has
  **no test runner** ("Frontend: typecheck only"), so a unit test is neither expected
  nor possible here; the contractual FE gate is `npm run typecheck`.
- **Verification in lieu of a test:** `npm run typecheck` -> clean; code inspection
  confirms identical cache keys (above) and behavioral parity. Recorded transparently
  per the re-review checklist item "flag any fixed-without-a-test" — this one is
  acceptable because it matches the project's FE testing convention, not a gap.

## Recommendation

**CLOSE.** §1 is verified-fixed and fully resolves its stated problem; the delta
introduces no regression and no new FIX-worthy finding (§3 is INFO/NO-ACTION by FE
convention). Gates green on this branch: FE `npm run typecheck` clean; backend
emulator slice `npm run test:emulator` 6 files / 15 tests pass (Temurin 21 present) —
re-run for branch health even though the delta touches no backend code. Nothing blocks
close.
