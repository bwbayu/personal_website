# Data-Model Cleanup (S1) — Review (Phase 4)

> Fresh-eyes, read-only audit of `develop..HEAD` for `feat/data-model-cleanup`.
> Base branch: **develop** (merge-base `dba9e13`). No code changed in this phase.

## 1. Objective + scope

Audit the 8 implemented tickets (DMC-1..DMC-8) against PLAN.md acceptance criteria,
the LOCKED Decisions log (D1..D12) in DISCUSSION.md, and an edge-case checklist.

Commits reviewed (`develop..HEAD`, oldest first):

| SHA | Subject | Ticket |
|---|---|---|
| c6e365f | feat(backend): drop dead headline field from about | DMC-1 |
| 7422edf | feat(backend): add categories collection with ordered read | DMC-2 |
| 6b996cd | feat(backend): replace skill proficiency/category with categoryId + order | DMC-3 |
| f079065 | refactor(backend): project technologies reference skill ids | DMC-4 |
| a5f6214 | docs(backend): correct stale resume swagger schema | DMC-5 |
| 731b645 | chore(backend): add idempotent data-model cleanup patch script | DMC-6 |
| 7f03868 | feat(frontend): join skill categories for ordered toolbox | DMC-7 |
| 2c4c906 | feat(frontend): resolve project technologies against skills | DMC-8 |

**Nothing pending** — all 8 planned tickets are built.

**Gates run by the reviewer (all green):**
- `npm run build` (backend tsc) — clean.
- `npx vitest run tests/data-model-cleanup tests/test-harness/skill.service.test.ts` — **22 passed** (5 unit files).
- `npm run test:emulator` (Java/Temurin 21 present) — **13 passed** (5 emulator files). Operator pre-PR gate confirmed locally.
- `cd frontend; npm run typecheck` — clean.
- Grep `proficiency|SkillCategory|SKILL_CATEGORIES|headline` over `backend/src`: only the intentional `FieldValue.delete()` lines in the patch + one unrelated "student proficiency" string in `experiences.seed.ts`. Frontend grep for `headline|proficiency|tech.name|.category` on the home/projects path: clean.

## 2. Plan-conformance table

| Ticket | Status | Evidence |
|---|---|---|
| DMC-1 headline removal | **met** | `about.type.ts`/`about.schema.ts` drop `headline`; `about.seed.ts` no longer sets it; `swagger.ts:23` About has no `headline`; `about.schema.test.ts` pins new shape; tsc green. |
| DMC-2 categories collection | **met** | Full domain `backend/src/categories/*` (DI-factory repo, slug-id controller, `/api/categories` routes with `validateSlugId->auth->validate`); `findAll` = `findAllOrdered('order','asc')`; seed + `seedCategories()` (early-return) in `migration.ts:49-64,80`; swagger `Category` + 4 ops; service unit + ordered emulator test. |
| DMC-3 skill shape | **met** | `skill.type.ts`/`skill.schema.ts` drop `proficiency`+enum, add `categoryId`+`order`; seed uses per-`categoryId` running counter (`skills.seed.ts:62-73`); swagger updated; harness tests updated in place. |
| DMC-4 project technologies | **met** | `project.type.ts` `technologies: string[]` (Tech deleted); schema `z.array(z.string()...).max(30)`; module DI-converted (repo/service/controller/routes) keeping UUID `validateId` + `findAllOrdered('date')`; seed maps names->`toSlug`; service unit + seed drift + referential emulator tests. |
| DMC-5 resume swagger | **met** | `swagger.ts` Resume now `educations/experiences/certifications/achievements` via `$ref` (all 4 components exist); matches `resume.repository.ts:15-20`; no `skills`/`projects`/`degree`/`field`. |
| DMC-6 patch script | **met** | `patch-data-model-cleanup.ts` exports `applyPatch(db)` (categories upsert + skills + projects + about), `require.main` guard, sources order/categoryId from the seed; `package.json` script added; idempotency emulator test (run twice, deep-equal). |
| DMC-7 FE toolbox join | **met** | `resume.ts` types updated + `CategoryType`; `app/api/categories.ts`; `HomeClient` Promise.all(about,skills,categories), group by `categoryId`, 2-level sort by `order`, title=category.name, tooltip name-only, empty categories filtered. |
| DMC-8 FE project resolution | **met** | `ProjectType.technologies: string[]`; `ProjectsClient` fetches projects + **unfiltered** skills, builds `Map<id,skill>`, shared `TechStack` helper for both blocks, skips unknown ids via `if (!skill) return null`. |

## 3. Decision-conformance table

| # | Decision | Honored? | Evidence |
|---|---|---|---|
| D1 | Full headline removal | yes | type/schema/seed/swagger all cleaned; patch deletes it on `main`. |
| D2 | `categories` `{id,name,order}`, slug ids, DI-factory, `order asc`, API-key writes | yes | `categories/*`; routes mirror skills; emulator test asserts asc ordering. |
| D3 | Skill refs category by `categoryId` (slug); display name from joined doc | yes | `categoryId: string`; HomeClient joins for the title; PATCH name keeps stable doc id (rename-safe). |
| D4 | Skill drops proficiency, adds `order:int`+`categoryId`, enum deleted | yes | `skill.type.ts`/`skill.schema.ts`. |
| D5 | Integer order; skills per-category 0-based by seed appearance; categories by enum order; no reindex | yes | `skills.seed.ts` running counter keyed on `categoryId`; `categories.seed.ts` `.map((name,order)=>...)`. |
| D6 | `technologies: string[]` of skill slug ids; inline icon objects deleted | yes | `project.schema.ts`, `projects.seed.ts` `raw.map(...toSlug)`. |
| D7 | Resolution on FE at render; BE returns ids; BE tests referential validity only | yes | `ProjectsClient` map resolution; `project.seed.test.ts` + `project.emulator.test.ts` assert ids resolve to skill docs. |
| D8 | One in-place idempotent patch; preserves project UUIDs; seeds updated in parallel | yes | `applyPatch` guarded transforms; emulator test asserts UUID preserved + idempotency. |
| D9 | FE shape changes (types, fetcher, HomeClient join+sort, ProjectsClient unfiltered) | yes | `resume.ts`, `categories.ts`, both clients. |
| D10 | Tests: categories unit+emulator; skills harness updated; projects DI+unit+referential emulator; about schema unit | yes | all present and green. |
| D11 | No category-ref FK check at write time in S1 | yes | `categoryId`/`technologies` are plain string schemas; no existence check. |
| D12 | BE+FE one branch / one deploy; breaking wire shapes internal; no versioning | yes | single feature branch; no dual-read code. |

## 4. Edge-case checklist

| Case | Verdict | Note |
|---|---|---|
| Patch run twice (idempotency) | PASS | `patch.emulator.test.ts` runs `applyPatch` twice; deep-equals docs; resolves undefined. |
| `FieldValue.delete()` on already-absent field | PASS | second run deletes absent `proficiency`/`category`/`headline` without throwing (asserted). |
| Project tech already `string[]` on re-run | PASS | guard `typeof t === 'string' ? t : toSlug(t.name)`. |
| Project UUID preserved by patch | PASS | `project1.id === projectId` asserted. |
| About doc missing | PASS | `if (aboutDoc.exists)` guard before update. |
| Categories ordered query | PASS | emulator test seeds out of order, expects `[0,3,4]`. |
| Project `findAll` still date-desc | PASS | emulator test expects `['2025-09-01','2024-10-01']`. |
| Empty Toolbox category (no shown skills) | PASS | `.filter((group) => group.skills.length > 0)`. |
| Dangling tech id on projects page | PASS | `if (!skill) return null` in `TechStack`. |
| Project page uses UNFILTERED skills | PASS | comment + no `isShow` filter; `isShow:false` skills resolve. |
| Seed referential integrity (tech id -> skill id) | PASS | `project.seed.test.ts` (no dangling) + slug-format assertion. |
| Slug ids pass `validateSlugId` regex | PASS | `toSlug` collapses `/`,`&`,`()` to single `-` + strips trailing `-`; e.g. `web-cross-platform-framework-libraries`, `amazon-web-services-aws`. |
| Skill with categoryId having no category doc (home) | see §1 | shown skill silently dropped from Toolbox (behavior change). |
| `toSlug` empty-id on symbol-only name | see §4 | pre-existing in skills controller; gated. |

## 5. Findings

### §1 — Toolbox silently drops a shown skill whose `categoryId` has no category doc
- **Severity:** NICE-TO-HAVE
- **Where:** [frontend/components/HomeClient/index.tsx](../../frontend/components/HomeClient/index.tsx) (the `orderedCategories` build — iterates `categories`, attaches `skillsByCategory[category.id]`).
- **What:** The old code grouped by `skill.category` directly, so every `isShow` skill always rendered. The new code drives rendering from the fetched `categories` list, so a shown skill whose `categoryId` matches no category doc never appears (its group is never created).
- **Why it matters:** A category seed/typo drift, or a category deleted while skills still point at it (S3 admin), makes shown skills vanish from the home page with no signal. Seed data is internally consistent today, so no current impact.
- **Recommended fix (optional):** Accept as-is (parallels D7 "silently skip dangling"), OR append an "uncategorized" bucket for shown skills whose `categoryId` is unmatched. Likely an S3 (admin) concern.
- **Ref:** D3, D9; DISCUSSION edge cases (covers empty categories, not orphaned skills).

### §2 — Patch `categories` upsert overwrites the whole doc on every run
- **Severity:** NICE-TO-HAVE
- **Where:** [backend/src/config/patch-data-model-cleanup.ts:15-17](../../backend/src/config/patch-data-model-cleanup.ts#L15-L17) — `batch.set(...doc(category.id), category)`.
- **What:** `set` (not merge) rewrites `name` + `order` from the seed each run.
- **Why it matters:** Re-running the patch after a future admin renames/reorders a category would clobber that edit back to the seed values.
- **Recommended fix (optional):** None for S1 — this is a one-off migration that runs before admin CRUD exists (D11/D12), and full-overwrite is exactly what makes the category seeding deterministic. Note for the S3 admin work (use `set(..., {merge:true})` or skip-if-exists then).
- **Ref:** D8, D11.

### §3 — Patch reads-then-writes outside a transaction
- **Severity:** NICE-TO-HAVE
- **Where:** [backend/src/config/patch-data-model-cleanup.ts](../../backend/src/config/patch-data-model-cleanup.ts) — `.get()` snapshots then a single `batch.commit()`.
- **What:** Documents are read, then written in one batch; a concurrent write between read and commit could be lost (no optimistic locking).
- **Why it matters:** Negligible here — one-off operator-run script on a low-traffic personal site during a coordinated deploy window (D12 explicitly tolerates brief skew). Batch write count (~6 + 36 skills + 14 projects + 1 about) is well under the 500 limit.
- **Recommended fix:** None (documented acceptance). Listed for completeness.
- **Ref:** D8, D12.

### §4 — `toSlug(name)` can yield an empty doc id for symbol-only names
- **Severity:** OUT-OF-SCOPE (pre-existing)
- **Where:** [backend/src/categories/category.controller.ts:18](../../backend/src/categories/category.controller.ts#L18) — `id: toSlug(req.body.name)` (identical to [skill.controller.ts:18](../../backend/src/skills/skill.controller.ts#L18)).
- **What:** A name of only non-alphanumerics (e.g. `"!!!"`) slugs to `""`; `collection().doc("")` throws at write time.
- **Why it matters:** Only reachable by an authenticated (API-key) writer with a deliberately degenerate name; S1 writes come only from seed/patch (D11). The categories controller faithfully mirrors the existing skills controller, so this is not a regression introduced here.
- **Recommended fix:** Defer to S3 admin validation (reject empty-slug names) — applies to skills and categories alike.
- **Ref:** D2 (parity-with-skills), D11.

### §5 — Patch project transform assumes a `name` on non-string tech entries
- **Severity:** NICE-TO-HAVE
- **Where:** [backend/src/config/patch-data-model-cleanup.ts:45-47](../../backend/src/config/patch-data-model-cleanup.ts#L45-L47) — `typeof t === 'string' ? t : toSlug((t as { name: string }).name)`.
- **What:** A legacy `technologies` entry that is neither a string nor an object with `name` would make `toSlug(undefined)` throw.
- **Why it matters:** No such data exists — every old `Tech` object carries `name` (verified in `projects.seed.ts` history). Purely defensive.
- **Recommended fix (optional):** Guard with `toSlug(typeof t === 'string' ? t : t?.name ?? '')` or skip falsy results. Low value.
- **Ref:** D6, D8.

## 6. Open questions for discussion

1. **§1** — Accept the silent-drop of shown skills with an unmatched `categoryId` (consistent with D7), or add an "uncategorized" fallback bucket now? (My read: accept for S1, revisit in S3.)
2. **§2** — Anything to change for S1, or just carry the `set`-overwrite caveat into the S3 admin ticket? (My read: carry it; no S1 change.)
3. Confirm the **patch is intended to be run manually once** during the develop->main deploy (not wired into CI/startup) — the `require.main` guard + `npm run patch:data-model-cleanup` suggests yes.

## 7. Decisions log (filled WITH the user during triage)

| Finding | Severity | Decision (FIX / DEFERRED / NO-ACTION) | Note |
|---|---|---|---|
| §1 | NICE-TO-HAVE | **NO-ACTION** | Accepted: silent-drop of shown skills with unmatched `categoryId` is consistent with D7; revisit in S3 admin. |
| §2 | NICE-TO-HAVE | **DEFERRED** | No S1 change; carry the `set`-overwrite caveat into the S3 admin ticket. |
| §3 | NICE-TO-HAVE | **NO-ACTION** | Acceptable per D12 (one-off, low traffic, coordinated deploy). |
| §4 | OUT-OF-SCOPE | **NO-ACTION** | Pre-existing parity with skills controller; defer empty-slug validation to S3. |
| §5 | NICE-TO-HAVE | **NO-ACTION** | Defensive only; no such legacy data exists. |

**Open-question answers (triage):**
- Q1 (§1) -> accept silent-drop, no fallback bucket in S1.
- Q2 (§2) -> carry caveat to S3, no S1 change.
- Q3 -> patch is run manually ONCE during the develop->main deploy; **operator has already run it in prod.** Decision: **KEEP** the script (NO-ACTION), matching the retained `patch-media-socials.ts` precedent (idempotent, serves as migration record, stays under emulator test).

**Outcome: nothing marked FIX.** Review loop CLOSES — proceed to open a PR `feat/data-model-cleanup` -> `develop` (no /wf-fix needed).
