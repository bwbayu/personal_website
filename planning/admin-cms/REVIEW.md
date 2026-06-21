# Admin CMS Scaffold (S3) — Review (Pass 1)

Fresh-eyes, read-only audit of the `admin-cms` feature. No code changed.

## 1. Objective + scope

Review `feat/admin-cms` against [PLAN.md](PLAN.md) (the execution contract),
[DISCUSSION.md](DISCUSSION.md) (LOCKED Decisions D1-D11), and CLAUDE.md / EXECUTION_FLOW
conventions.

- **Base used:** `develop` (the branch `feat/admin-cms` was cut from). Confirmed local
  `develop` exists and diff scoped to `develop...HEAD`.
- **Commits reviewed (feature only):** 26 commits = 13 code + 13 planning/docs.
  - Backend DI batch: `bb2fb90` (ADMIN-CMS-1), `02810ed` (2), `9b8a092` (3),
    `2ba1935` (4), `b541e06` (5), `aa3fd84` (6), `96d8747` (7).
  - Frontend scaffold: `2bc5aeb` (8), `e3f7b3e` (9), `b75e56f` (10), `34745ee` (11),
    `d556c39` (12), `e1d1a7b` (13).
- **Pending / not-built:** none. All 13 tickets are marked DONE in PLAN and are present
  in the diff.
- **Gates run by this review (all green):**
  - `npx vitest run tests/admin-cms` -> 6 files, **31 tests passed**.
  - Emulator slice `npm run test:emulator` (Temurin 21 present) -> 5 files,
    **13 tests passed** (confirms the DI conversion + resume aggregation still work
    against real Firestore).
  - `npm run typecheck` -> clean.
  - `npm run build` -> clean, **33 static pages** ([domain]=9, edit/new=8 each,
    about excluded from create/edit as designed).

**Overall:** a clean, faithful implementation. No BLOCKER or SHOULD-FIX findings; all
findings below are NICE-TO-HAVE / acknowledged-by-design.

## 2. Plan-conformance table

| Ticket | Status | Evidence |
|---|---|---|
| ADMIN-CMS-1 remove `experience.technologies` | **met** | field gone from [experience.type.ts](../../backend/src/experiences/experience.type.ts), [experience.schema.ts](../../backend/src/experiences/experience.schema.ts), and swagger ([swagger.ts](../../backend/src/config/swagger.ts) -1); `project.technologies` untouched; tsc clean. |
| ADMIN-CMS-2 experiences -> DI | **met** | factory repo/service/controller + composition-root routes; `findAllOrdered('startDate')`, `randomUUID()`; resume rewired ([resume.repository.ts](../../backend/src/resume/resume.repository.ts:5-13)); service test green. |
| ADMIN-CMS-3 educations -> DI | **met** | factories wired ([education.routes.ts:11](../../backend/src/educations/education.routes.ts#L11)); test + emulator green. |
| ADMIN-CMS-4 certifications -> DI | **met** | factories wired ([certification.routes.ts:11](../../backend/src/certifications/certification.routes.ts#L11)). |
| ADMIN-CMS-5 achievements -> DI | **met** | factories wired ([achievements.routes.ts:11](../../backend/src/achievements/achievements.routes.ts#L11)); filenames preserved. |
| ADMIN-CMS-6 media-socials -> DI | **met** | factories wired ([mediaSocial.routes.ts:11](../../backend/src/mediaSocials/mediaSocial.routes.ts#L11)); unordered `findAll`; not in resume. |
| ADMIN-CMS-7 about -> DI (singleton) | **met** | custom repo preserved (fixed `about/main`, id ignored), optional `db`; routes still `GET /` + `PATCH /:id` ([about.routes.ts](../../backend/src/about/about.routes.ts)). |
| ADMIN-CMS-8 config core + api client | **met** | all 9 domains in `registry` + `bySlug` ([config.ts](../../frontend/lib/admin/config.ts)); `ApiError` + authedFetch reuse ([api.ts](../../frontend/lib/admin/api.ts)). |
| ADMIN-CMS-9 shell + guard + probe | **met** | [AdminGuard.tsx](../../frontend/components/admin/AdminGuard.tsx) probe = DELETE to zero-UUID; 401/403 -> signOut + message; extra recoverable "error" state; shell sidebar lists all domains ([AdminShell.tsx](../../frontend/components/admin/AdminShell.tsx)). |
| ADMIN-CMS-10 generic list view | **met** | [DomainListClient.tsx](../../frontend/components/admin/DomainListClient.tsx): columns, New/Edit/Delete, loading/empty/error, 404-on-delete -> notice + refresh, unknown slug -> not-found, singleton -> edit form; `generateStaticParams`. |
| ADMIN-CMS-11 generic form (D2, D10) | **met** | [DomainFormPage.tsx](../../frontend/components/admin/DomainFormPage.tsx): list-then-select edit (no GET/:id), required check, form-level error, create sends no id; `?id=` under `<Suspense>`. |
| ADMIN-CMS-12 custom widgets (D6) | **met** | [StringArrayInput](../../frontend/components/admin/inputs/StringArrayInput.tsx), [CategorySelect](../../frontend/components/admin/inputs/CategorySelect.tsx), [TechPicker](../../frontend/components/admin/inputs/TechPicker.tsx); dangling refs render + removable; registry wires all 3 ([inputs/index.tsx:123-133](../../frontend/components/admin/inputs/index.tsx#L123-L133)). |
| ADMIN-CMS-13 reorder (D3) | **met** | per-item PATCH swap; skills grouped per-category, categories global; buttons disabled at ends / during write; refetch after ([DomainListClient.tsx:99-123](../../frontend/components/admin/DomainListClient.tsx#L99-L123)). |

## 3. Decision-conformance table

| Decision | Honored? | Evidence |
|---|---|---|
| D1 no auth code change | yes | no edits under `backend/src/middlewares/`; auth carve-out intact in all converted routes. |
| D2 no GET /:id (reuse list) | yes | no `findById`; EditForm fetches the list then selects ([DomainFormPage.tsx:137-155](../../frontend/components/admin/DomainFormPage.tsx#L137-L155)). See §2 note (always re-fetches). |
| D3 per-item PATCH reorder | yes | two `updateItem({order})` PATCHes, no bulk endpoint ([DomainListClient.tsx:113-116](../../frontend/components/admin/DomainListClient.tsx#L113-L116)). |
| D4 probe-on-login | yes | one DELETE probe; 401/403 -> signOut + "not authorized" ([AdminGuard.tsx:47-68](../../frontend/components/admin/AdminGuard.tsx#L47-L68)). See §1. |
| D5 URL/text assets only | yes | image/icon fields are `url`/`text` inputs; no upload/storage code. |
| D6 four widgets | yes | tech-picker (a), category select (b), about singleton (c), string-array (d) all present. |
| D7 reuse Flowbite/Tailwind | yes | Tailwind utility classes only; no second UI framework added. |
| D8 DI-convert 6 domains | yes | about/experiences/educations/certifications/achievements/mediaSocials all factory-DI; only `resume` (out of scope) keeps namespace imports. |
| D9 DomainConfig + registry | yes | shared list + form consume `DomainConfig`; field-type -> input registry. |
| D10 BE Zod source of truth | yes | FE does light required check, surfaces BE message form-level ([DomainForm.tsx:44-55](../../frontend/components/admin/DomainForm.tsx#L44-L55)); no schema duplication. |
| D11 real admin shell | yes | dashboard + sidebar + per-domain list/create/edit; reuses AuthContext + authedFetch. |

## 4. Edge-case checklist

| Case | Verdict | Notes |
|---|---|---|
| Empty list | OK | "No items yet" state ([DomainListClient.tsx:173-174](../../frontend/components/admin/DomainListClient.tsx#L173)). |
| List load error | OK | error banner + empty rows. |
| Delete 404 (gone elsewhere) | OK | notice + refresh ([DomainListClient.tsx:134-136](../../frontend/components/admin/DomainListClient.tsx#L134)). |
| PATCH 404 on edit | OK | "no longer exists" message ([DomainFormPage.tsx:164-165](../../frontend/components/admin/DomainFormPage.tsx#L164)). |
| BE 400 validation | OK | concatenated Zod string surfaced form-level. |
| Required-field empty submit | OK | blocked client-side with field list. |
| Direct refresh of edit URL (no list in memory) | OK | always fetches list first. |
| Unknown `[domain]` slug | OK | NotFoundView. |
| about singleton (no list/create/delete) | OK | SingletonForm, edit-only; PATCH with placeholder UUID (repo ignores id). |
| about doc not yet created (404 on GET) | OK | treated as empty editable form ([DomainFormPage.tsx:215-216](../../frontend/components/admin/DomainFormPage.tsx#L215)). |
| Dangling skill id in project.technologies | OK | renders "{id} (unknown)", removable ([TechPicker.tsx:36-37](../../frontend/components/admin/inputs/TechPicker.tsx#L36)). |
| Deleted category as skill.categoryId | OK | stays selectable as "(unknown)" ([CategorySelect.tsx:40,56](../../frontend/components/admin/inputs/CategorySelect.tsx#L40)). |
| Date round-trip | OK | BE stores `YYYY-MM-DD` ([schema.util.ts:8-9](../../backend/src/utils/schema.util.ts#L8)); matches `<input type=date>` exactly. |
| Token expired mid-session | OK | authedFetch retries once on 401 (S2, unchanged). |
| Not-allowlisted | OK | probe 403 -> signOut + message; redirect suppressed while "denied". |
| Concurrent reorder writes | OK-by-design | refetch after each pair; single-writer assumption (D3). |
| Reorder at group ends | OK | up/down disabled when no neighbor. |
| Reorder with equal/missing `order` | weak | silent no-op; see §3. |
| URL field invalid | OK | inline warning; BE is validator of record ([inputs/index.tsx:85-105](../../frontend/components/admin/inputs/index.tsx#L85)). |
| resume aggregation after DI | OK | emulator slice green; factories instantiated once in resume.repository. |

## 5. Findings

### §1 — Login probe is a write and consumes the write rate-limit budget — NICE-TO-HAVE
- **File:** [AdminGuard.tsx:12,53](../../frontend/components/admin/AdminGuard.tsx#L12),
  write limiter in [backend/app.ts](../../backend/app.ts) (write = 20 / 15 min).
- **What:** the D4 probe is `DELETE /api/projects/<zero-uuid>`, which passes through the
  **write** rate limiter. Every hard reload of an admin page spends one write token, on
  top of real create/update/delete/reorder writes.
- **Why it matters:** a busy editing session (reorders issue 2 PATCHes each) plus a few
  reloads could trip `429`. A `429` is not `401/403`, so the guard treats it as
  "authorized" and renders the dashboard, but subsequent writes then fail until the
  window resets — confusing rather than broken.
- **Recommended:** acknowledge as personal-scale acceptable, OR raise the write limit /
  exempt the probe path, OR (cleanest) probe with a method that is not rate-limited as a
  write. Note: there is no authed GET to probe (reads are public), so the
  DELETE-to-nonexistent is the only auth-exercising call available under D1/D2 — this is
  inherent to D4, not a coding defect.
- **Ref:** D4 / ADMIN-CMS-9.

### §2 — EditForm always re-fetches the list instead of reusing in-memory data — NICE-TO-HAVE (acceptable)
- **File:** [DomainFormPage.tsx:137-155](../../frontend/components/admin/DomainFormPage.tsx#L137-L155).
- **What:** D2 / ADMIN-CMS-11 describe "reuse the already-fetched list data if present,
  else fetch the list and select the item." The implementation always fetches the list.
- **Why it matters:** it is one extra list GET per edit open. But under the static-export
  route model each `/admin/[domain]/edit` page is an independent component with no shared
  list store, so there is no in-memory list to reuse — always-fetch is the only viable
  path and it fully honors D2's hard constraint (no `GET /:id`, no `findById`). Reads are
  public + cheap.
- **Recommended:** no action; the "reuse" wording was an optimization that does not apply
  to this architecture. Flagged only for the record.
- **Ref:** D2 / ADMIN-CMS-11.

### §3 — Reorder is a silent no-op when neighbor `order` values are equal/missing — NICE-TO-HAVE — [FIXED] (`0d123fd`)
- **File:** [DomainListClient.tsx:113-116](../../frontend/components/admin/DomainListClient.tsx#L113-L116)
  (`Number(neighbor.order ?? 0)` swap).
- **What:** reorder swaps `order` values. If two adjacent rows share the same `order`
  (e.g. both default `0`, see §5), the swap writes identical values and the visible order
  does not change, though the buttons are enabled.
- **Why it matters:** confusing UX in the (uncommon) case of duplicate/missing order
  values; not data-corrupting.
- **Recommended:** acceptable per D3 (single writer, low risk). If desired later, seed
  sequential `order` on create or normalize order on load.
- **Ref:** D3 / PLAN §5 edge cases.

### §4 — Skills list "Category" column shows the raw `categoryId` slug — NICE-TO-HAVE
- **File:** [config.ts:62-66](../../frontend/lib/admin/config.ts#L62) +
  [DomainListClient.tsx:194-198](../../frontend/components/admin/DomainListClient.tsx#L194).
- **What:** the column labeled "Category" renders `row.categoryId` (a slug id) rather than
  the category name.
- **Why it matters:** cosmetic; category ids are `toSlug(name)` so they are human-readable
  (e.g. `frontend`), but it is the id not the display name.
- **Recommended:** acceptable; if polishing, resolve names via the categories fetch in the
  list (extra GET) or leave as-is.
- **Ref:** ADMIN-CMS-10 / PLAN §2.2.

### §5 — `buildPayload` always sends number defaults on create and cannot clear an optional string on edit — NICE-TO-HAVE (documented)
- **File:** [DomainFormPage.tsx:56-71](../../frontend/components/admin/DomainFormPage.tsx#L56-L71).
- **What:** numbers (incl. `order: 0`) are always included; empty strings are omitted, so
  clearing a previously-set optional text/url field via PATCH does not unset it server-side.
- **Why it matters:** new skills/categories all get `order: 0` (feeds §3); an admin cannot
  blank out an optional field once set. Both are explicitly called out as accepted in PLAN
  tickets 11 and 13.
- **Recommended:** no action for S3; revisit if unsetting fields becomes a need.
- **Ref:** ADMIN-CMS-11 / ADMIN-CMS-13.

### §6 — Probe URL omits the `?? ''` env fallback used elsewhere — NICE-TO-HAVE (cosmetic)
- **File:** [AdminGuard.tsx:12](../../frontend/components/admin/AdminGuard.tsx#L12) vs
  [api.ts:8](../../frontend/lib/admin/api.ts#L8).
- **What:** `PROBE_URL` interpolates `process.env.NEXT_PUBLIC_API_URL` directly; api.ts
  guards with `?? ''`. If the env var were unset the probe URL would contain the literal
  `undefined`.
- **Why it matters:** `NEXT_PUBLIC_API_URL` is a required build-time var, so this never
  fires in practice — purely a consistency nit.
- **Recommended:** optional; mirror the `?? ''` fallback for symmetry.
- **Ref:** ADMIN-CMS-8/9.

### §7 — resume.repository instantiates repo factories separate from the route singletons — OUT-OF-SCOPE (observation)
- **File:** [resume.repository.ts:9-12](../../backend/src/resume/resume.repository.ts#L9-L12).
- **What:** resume creates its own `createXxxRepository()` instances at module load,
  distinct from the instances each domain's routes create.
- **Why it matters:** harmless — all wrap the default Firestore client; it is the
  convention chosen and documented in ADMIN-CMS-2 and verified by the green emulator slice.
- **Recommended:** no action.
- **Ref:** PLAN ADMIN-CMS-2 resume-aggregation note.

## 6. Open questions for discussion

1. **§1 (probe vs write limiter):** accept as personal-scale, or do you want a tweak
   (raise/relax the write limit, or exempt the zero-UUID probe path)? This is the only
   finding with a real (if low-frequency) user-visible failure mode.
2. **§3/§5 (order defaults):** are you content with `order: 0` on create + manual reorder,
   or should create auto-assign the next order so reorder always has distinct values?
3. **§4 (category column):** show category names in the skills list, or leave the slug id?

## 7. Decisions log (filled WITH the user during triage)

| Finding | Severity | Decision (FIX / DEFERRED / NO-ACTION) | Notes |
|---|---|---|---|
| §1 probe rate-limit | NICE-TO-HAVE | **NO-ACTION** | 20 writes / 15 min is enough for a single-user personal site; accept as-is. |
| §2 edit re-fetch | NICE-TO-HAVE | **NO-ACTION** | Honors D2 already; no in-memory list to reuse under static-export routing. |
| §3 reorder no-op | NICE-TO-HAVE | **FIXED** (`0d123fd`) | Auto-assign the next `order` on create so reorder always has distinct values (skills: max order in the same `categoryId` group + 1; categories: max order overall + 1). Done in the skill/category service `insert` (client-supplied order ignored on create). |
| §4 category column | NICE-TO-HAVE | **NO-ACTION** | Leave the slug id; it is human-readable. |
| §5 buildPayload defaults | NICE-TO-HAVE | **PARTIAL FIX** | The `order: 0`-on-create part is resolved by the §3 fix (`0d123fd`) — new items now get a distinct server-assigned order. The "cannot unset an optional string via PATCH" part stays NO-ACTION (documented-accepted for S3). |
| §6 probe env fallback | NICE-TO-HAVE | **NO-ACTION** | Cosmetic; `NEXT_PUBLIC_API_URL` is a required build-time var. |
| §7 resume instances | OUT-OF-SCOPE | **NO-ACTION** | Harmless; chosen convention, emulator-verified. |

### Triage outcome
One finding to fix: **§3** (auto-assign next `order` on create for the two reorderable
domains, which also resolves the `order: 0` part of §5). Everything else NO-ACTION.

**Fix status:** §3 FIXED in `0d123fd` (skill/category service `insert` assigns the next
order; client-supplied order ignored on create). The `order: 0` part of §5 is resolved by
the same commit. No other findings actioned (all NO-ACTION / OUT-OF-SCOPE).

---

# Pass 2 review

Fresh-eyes RE-REVIEW of the fix delta only. Delta base `c9c52e0` (last commit Pass 1
reviewed) -> `HEAD`. Read-only; no code changed.

- **Delta scoped (`c9c52e0..HEAD`):** 2 commits = 1 code + 1 docs.
  - `0d123fd` fix(backend): auto-assign next order when creating skills and categories
    (the single triaged FIX = §3, plus the `order: 0` sub-part of §5).
  - `59e4ed3` docs: mark admin-cms review finding 3 fixed (REVIEW.md only).
- **Files in the code delta:** [skill.service.ts](../../backend/src/skills/skill.service.ts),
  [category.service.ts](../../backend/src/categories/category.service.ts) (+2 new scoped
  test files). No schema/controller/route/type changes — confirmed the fix lives entirely
  in the service layer.
- **Gates run by this pass (all green):**
  - `npx vitest run tests/admin-cms` -> **8 files, 38 tests passed** (was 6/31 in Pass 1;
    +2 files / +7 tests, all from this fix).
  - Emulator slice `npm run test:emulator` (Temurin 21.0.11 present) -> **5 files, 13
    tests passed**; the live `POST /api/skills 201` round-trip confirms the new
    `await repo.findAll()` read inside `insert` did not break create end-to-end.
  - `npm run typecheck` (frontend) -> clean (no FE delta, but verified).

## Status of previous FIX findings

| § | Decision | Verdict | Evidence |
|---|---|---|---|
| §3 reorder no-op on equal/missing `order` | FIX | **verified-fixed** | [skill.service.ts:10-18](../../backend/src/skills/skill.service.ts#L10-L18) assigns `max(order in same categoryId) + 1` (0 for first); [category.service.ts:10-17](../../backend/src/categories/category.service.ts#L10-L17) assigns `max(order over all) + 1`. `repo.save({ ...data, order })` puts the computed `order` last, so client-supplied order is overridden. Proven by `skill.service.test.ts` (first=0, max+1, per-category scoping, client-override) and `category.service.test.ts` (first=0, global max+1, client-override). Seed data ([skills.seed.ts:55-70](../../backend/src/database/seeds/skills.seed.ts#L55-L70), [categories.seed.ts:16-19](../../backend/src/database/seeds/categories.seed.ts#L16-L19)) already assigns distinct contiguous orders, so no live row collides on 0 either — the only remaining duplicate-order path is a concurrent multi-writer race, excluded by D3. Fully closes the stated problem. |
| §5 `buildPayload` order-0-on-create sub-part | PARTIAL FIX | **verified-fixed (the actioned sub-part)** | Same commit: new items now get a distinct server-assigned order regardless of the FE's `order: 0`. The other half ("cannot unset an optional string via PATCH") was triaged NO-ACTION and is correctly untouched. |

Both fixes shipped **with** scoped tests that directly prove closure — no "fixed without a
test."

## New findings

### §8 — Auto-order uses read-then-write, so concurrent creates could still collide — NICE-TO-HAVE (observation, NO-ACTION recommended)
- **File:** [skill.service.ts:11-17](../../backend/src/skills/skill.service.ts#L11-L17),
  [category.service.ts:11-16](../../backend/src/categories/category.service.ts#L11-L16).
- **What:** `insert` reads all rows, computes `max(order) + 1`, then saves — not in a
  transaction. Two near-simultaneous creates in the same category (categories: globally)
  could read the same max and both write the same `order`, re-introducing the exact
  duplicate-order condition §3 fixed.
- **Why it matters:** only under concurrent writers. D3 locks a single-writer
  personal-scale model, and the reorder path itself already carries the same single-writer
  assumption (REVIEW Pass 1 §4 "Concurrent reorder writes -> OK-by-design"). So this is
  consistent with the locked posture, not a new defect introduced by the fix.
- **Recommended:** no action for S3; if multi-writer ever matters, move the read+save into
  a Firestore transaction. Flagged only for the record.
- **Ref:** §3 fix (`0d123fd`) / D3 single-writer assumption.

## Recommendation

**CLOSE.** The single triaged FIX (§3, plus §5's order-0 sub-part) is verified-fixed at
file:line with scoped tests that prove closure; the fix is confined to the service layer
with no schema/controller/type changes and no other `insert` callers affected. No
regressions: all gates green (unit 8/38, emulator slice 5/13 on Temurin 21, FE typecheck
clean). The one new finding (§8, read-then-write concurrency) is an observation that is
inherent to the already-locked D3 single-writer model and is NOT FIX-worthy — nothing
blocks close.
