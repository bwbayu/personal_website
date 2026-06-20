# Data-Model Cleanup (S1) — Implementation Plan

> Phase 2 output. Turns the LOCKED design in
> [DISCUSSION.md](DISCUSSION.md) (Decisions log D1..D12 + edge cases) into
> per-ticket, independently-shippable commits on one `feat/data-model-cleanup`
> branch. Honor the contract; do not relitigate locked decisions.

## Verification of design currency (Phase 0 discovery)

All DISCUSSION line refs were re-opened and still match HEAD (`develop`, commit
dba9e13). Key confirmations:

- Skill shape + 6-value enum, slug doc ids, DI repo — match.
- Project shape (`technologies: Tech[]`), random-UUID ids, repo NOT DI-converted
  (module singleton) — match. **DI-convert blast radius is contained:** the
  `projects` module is consumed only by [project.routes.ts](../../backend/src/routes/index.ts#L18);
  `resume` aggregates educations/experiences/certifications/achievements ONLY
  ([resume.repository.ts:7-21](../../backend/src/resume/resume.repository.ts#L7-L21)),
  so it does not touch projects/skills/about.
- About `{id,name,email,headline}`, fixed doc `main` — match.
- Seeds early-return on non-empty -> prod needs the one-off patch (D8) — match.
- Existing harness tests hardcode `proficiency` (service:20,48; endpoint:16,62,84-86)
  and will go red under T2 — confirmed; DMC-3 updates them in place.
- Unit run = `tests/**/*.test.ts` excluding `*.emulator.test.ts`
  ([vitest.config.ts](../../backend/vitest.config.ts)); emulator run = the
  `*.emulator.test.ts` glob ([vitest.emulator.config.ts](../../backend/vitest.emulator.config.ts)),
  run as a whole via `npm run test:emulator`. New per-ticket unit tests live under
  `backend/tests/data-model-cleanup/`; new emulator tests use the `*.emulator.test.ts`
  suffix (any dir — the emulator config globs `tests/**`).

## Phase-2 clarifications (answered)

- **Patch script (DMC-6) IS tested** via the emulator: factor the transform into an
  exported pure-ish function and assert OLD-shape -> NEW-shape + idempotency on a
  second run. (Edge case "patch idempotency" is thereby verified automatically.)
- **Resume swagger fix IS in scope** as its own small `docs(backend)` commit
  (DMC-5). It corrects a pre-existing stale schema; doc-only, non-prod surface.

## Test conventions used below

- **BE unit (repo mocked):** `cd backend; npx vitest run tests/<dir>`
  (e.g. `tests/data-model-cleanup`, or `tests/test-harness` for the updated skill
  unit). Fast, no Java.
- **BE emulator slice (LOCAL gate, needs Java/Temurin 21):**
  `cd backend; npm run test:emulator` — runs the WHOLE slice, not scoped. Run before
  committing any Firestore-touching ticket (DMC-2, -3, -4, -6). If the sandbox lacks
  Java, STOP and have the operator run it.
- **FE:** `cd frontend; npm run typecheck` (bare `tsc --noEmit`; single-config, NO `-b`).

---

## Sequence (dependency order)

```
DMC-1 about/headline ──► DMC-2 categories ──► DMC-3 skills ──► DMC-4 projects ──┐
                                                                                │
   DMC-5 resume-swagger (docs, independent) ◄───────────────────────────────────┤
   DMC-6 patch script (needs new shapes 1-4) ◄──────────────────────────────────┘
                                                                                │
                                          DMC-7 FE home (needs DMC-2,3) ◄────────┤
                                          DMC-8 FE projects (needs DMC-3,4) ◄─────┘
```

Backend (and its swagger/patch) lands before the FE that consumes the new wire
shape. DMC-5 and DMC-6 are order-flexible after DMC-4 but precede the FE.

---

## DMC-1 — Remove the dead `headline` field (T4 / D1)

**Scope.** Drop `headline` from the About domain everywhere it is declared.
No back-compat (field is dead). Prod docs still carrying `headline` are cleaned by
the DMC-6 patch; extra fields on reads are harmless meanwhile.

**Files to touch.**
- [backend/src/about/about.type.ts](../../backend/src/about/about.type.ts) — remove `headline`.
- [backend/src/about/about.schema.ts](../../backend/src/about/about.schema.ts) — remove `headline` from `aboutInsertSchema`.
- [backend/src/database/seeds/about.seed.ts](../../backend/src/database/seeds/about.seed.ts) — remove the `headline` property.
- [backend/src/config/swagger.ts](../../backend/src/config/swagger.ts#L20-L28) — drop `headline` from the `About` component schema.

**Acceptance criteria.**
1. `About` interface = `{ id, name, email }`; `aboutInsertSchema` has no `headline`;
   `aboutUpdateSchema` (partial) inherits the change.
2. `aboutSeed` no longer sets `headline`.
3. Swagger `About` schema has no `headline` property.
4. `cd backend; npm run build` (tsc) is green — no dangling `headline` reference.

**Scoped tests.**
- New `backend/tests/data-model-cleanup/about.schema.test.ts` (unit, no emulator):
  - valid `{name,email}` parses; `aboutInsertSchema` REJECTS an object that still
    carries `headline`? No — Zod by default strips unknowns, so instead assert the
    PARSED result has no `headline` key and that a valid body succeeds, and that a
    missing/invalid `email` fails. (Pins the new shape without over-asserting strictness.)
- Run: `npx vitest run tests/data-model-cleanup -t "about"`.

**Commit.** `feat(backend): drop dead headline field from about`

---

## DMC-2 — New `categories` collection (T8 / D2, D5)

**Scope.** Add a `categories` domain following the per-domain pattern, DI-factory repo
from the start (parity with skills). Docs `{ id, name, order }`, **slug doc ids**
(`toSlug(name)`), `getAll` returns ordered by `order asc` (the testable deviation).
Routes under `/api/categories`, slug-id validated, writes API-key gated. Seed the 6
categories and wire them into `migration.ts` (doc-id seeding like `seedSkills`).

**Category data (D5 — legacy enum order = `order` 0..5):**

| order | name | doc id (`toSlug`) |
|---|---|---|
| 0 | Programming Languages | `programming-languages` |
| 1 | Web/Cross Platform Framework & Libraries | `web-cross-platform-framework-libraries` |
| 2 | DevOps Tools | `devops-tools` |
| 3 | Databases | `databases` |
| 4 | Cloud Platforms | `cloud-platforms` |
| 5 | Data/AI Framework & Libraries | `data-ai-framework-libraries` |

(These slug ids are exactly what `toSlug(existingSkill.category)` yields, so DMC-3's
`categoryId` and DMC-6's patch line up with them.)

**Files to create** (mirror the skills module):
- `backend/src/categories/category.type.ts` — `export interface Category { id: string; name: string; order: number; }`
- `backend/src/categories/category.schema.ts` — `categoryInsertSchema = z.object({ name: z.string().min(1).max(200), order: z.number().int() })`; `categoryUpdateSchema = .partial()`.
- `backend/src/categories/category.repository.ts` — `createCategoryRepository(db?)` wrapping `FirestoreRepository<Category>('categories')`; expose `findAll: () => repo.findAllOrdered('order','asc')`, plus `save/update/remove` (parity with [skill.repository.ts](../../backend/src/skills/skill.repository.ts)).
- `backend/src/categories/category.service.ts` — `createCategoryService(repo)` with `getAll/insert/update/deleteById` (parity with [skill.service.ts](../../backend/src/skills/skill.service.ts)).
- `backend/src/categories/category.controller.ts` — `createCategoryController(service)`; `insert` sets `id: toSlug(req.body.name)` (parity with [skill.controller.ts:18](../../backend/src/skills/skill.controller.ts#L18)).
- `backend/src/categories/category.routes.ts` — composition root; `get/post/patch/:id/delete` with `validateSlugId -> authMiddleware -> validate` (parity with [skill.routes.ts](../../backend/src/skills/skill.routes.ts)).
- `backend/src/database/seeds/categories.seed.ts` — `categoriesSeed: Category[]` (the 6 rows above).

**Files to touch.**
- [backend/src/routes/index.ts](../../backend/src/routes/index.ts) — import + `router.use('/categories', categoryRoutes)`.
- [backend/src/config/migration.ts](../../backend/src/config/migration.ts) — add `seedCategories()` (doc-id seeding, early-return on non-empty, like `seedSkills`) and call it in `migrate()`.
- [backend/src/config/swagger.ts](../../backend/src/config/swagger.ts) — add a `Category` component schema (`{id,name,order}`) and `/api/categories` + `/api/categories/{id}` paths (GET/POST/PATCH/DELETE) mirroring the Skills paths.

**Acceptance criteria.**
1. `GET /api/categories` returns the 6 docs ordered by `order asc`.
2. Writes are API-key gated and slug-id validated (same middleware order as skills).
3. `npm run migrate` on an empty `categories` collection seeds 6 docs with slug ids;
   re-running is a no-op (early-return).
4. Swagger shows the `Category` schema and the 4 category operations.
5. `npm run build` green.

**Scoped tests.**
- New `backend/tests/data-model-cleanup/category.service.test.ts` (unit, fake repo,
  modeled on [skill.service.test.ts](../../backend/tests/test-harness/skill.service.test.ts)):
  `getAll` passes through `repo.findAll`; `insert/update/deleteById` forward correctly.
- New `backend/tests/data-model-cleanup/category.emulator.test.ts` (emulator):
  seed 3+ category docs out of order, assert `createCategoryRepository().findAll()`
  returns them sorted by `order asc` (the deviation). Use `clearFirestore` in
  before/after like the existing emulator tests.
- Run: `npx vitest run tests/data-model-cleanup -t "category"` then the full emulator
  slice `npm run test:emulator`.

**Commit.** `feat(backend): add categories collection with ordered read`

---

## DMC-3 — Skill schema/type/seed changes (T2 / D3, D4, D5)

**Scope.** Drop `proficiency`; add `order: number (int)`; replace the `category` enum
with `categoryId: string`. Skill doc id stays the name slug. Rewrite the seed to the
new shape, assigning per-category 0-based contiguous `order` by seed appearance
(D5) — compute it with a per-`categoryId` running counter inside the `.map`, do NOT
hardcode. Update the existing S0 harness tests in place (D10).

**Files to touch.**
- [backend/src/skills/skill.type.ts](../../backend/src/skills/skill.type.ts) — delete `SkillCategory` type + `proficiency`; `category` -> `categoryId: string`; add `order: number`. Result: `{ id, name, iconClass?, iconImage?, categoryId, order, isShow }`.
- [backend/src/skills/skill.schema.ts](../../backend/src/skills/skill.schema.ts) — delete `SKILL_CATEGORIES`; drop `proficiency`; `category: z.enum(...)` -> `categoryId: z.string().min(1).max(200)`; add `order: z.number().int()`.
- [backend/src/database/seeds/skills.seed.ts](../../backend/src/database/seeds/skills.seed.ts) — `RawSkill` drops `experience`; map drops `proficiency`, sets `categoryId: toSlug(s.category)`, and sets `order` via per-`categoryId` counter (seed appearance order). Keep `iconClass`/`iconImage`/`isShow`. (The 36 rows keep their existing category strings as the slug source.)
- [backend/src/config/swagger.ts](../../backend/src/config/swagger.ts#L108-L129) — `Skill` schema: drop `proficiency`, replace `category` enum with `categoryId: {type:string}`, add `order: {type:integer}`.

**Tests to update in place (D10).**
- [backend/tests/test-harness/skill.service.test.ts](../../backend/tests/test-harness/skill.service.test.ts) — `sampleSkill` -> new shape (`categoryId:'programming-languages'`, `order:0`, no `proficiency`); the `update` test's partial `{proficiency:...}` -> `{order: N}` (assert `order`).
- [backend/tests/test-harness/skill.endpoint.emulator.test.ts](../../backend/tests/test-harness/skill.endpoint.emulator.test.ts) — `validSkill` -> `{name:'Go', categoryId:'programming-languages', order:0, isShow:true}`; the Zod-400 body still omits `name`; the PATCH round-trip sends `{order:3}` and asserts `data.order === 3` (was `proficiency`). Keep the write count unchanged (do not add writes — respect the 20-writes/15-min limiter note).

**Acceptance criteria.**
1. `Skill` = `{ id, name, iconClass?, iconImage?, categoryId, order, isShow }`; the
   enum/`SkillCategory`/`proficiency` are fully gone (grep clean across `backend/src`).
2. `skillsSeed` produces, per category, contiguous `order` 0..n-1 in seed appearance
   order; every `categoryId` is a slug matching a DMC-2 category id.
3. Swagger `Skill` reflects the new shape.
4. `npm run build` green; updated harness unit + endpoint tests pass.

**Scoped tests.**
- `npx vitest run tests/test-harness -t "skill"` (updated unit).
- `npm run test:emulator` (updated skill endpoint smoke runs in the slice).

**Commit.** `feat(backend): replace skill proficiency/category with categoryId + order`

---

## DMC-4 — Project `technologies` -> skill ids + DI-convert (T3 / D6, D7)

**Scope.** `technologies` becomes `string[]` of skill slug ids (single source of
truth on the skill). Delete the inline `Tech` icon objects (and their drift). Rewrite
the seed to id arrays. DI-convert the projects module to the factory pattern (parity
with skills) so the service unit + emulator tests can inject an emulator client.

**Files to touch.**
- [backend/src/projects/project.type.ts](../../backend/src/projects/project.type.ts) — delete `Tech`; `technologies: string[]`.
- [backend/src/projects/project.schema.ts](../../backend/src/projects/project.schema.ts) — delete `techSchema`; `technologies: z.array(z.string().min(1).max(200)).max(30)`.
- [backend/src/projects/project.repository.ts](../../backend/src/projects/project.repository.ts) — `createProjectRepository(db?)` wrapping `FirestoreRepository<Project>('projects')`; expose `findAll: () => repo.findAllOrdered('date')` (keep the date ordering), plus `save/update/remove`. `export type ProjectRepository = ReturnType<...>`.
- [backend/src/projects/project.service.ts](../../backend/src/projects/project.service.ts) — `createProjectService(repo)` with `getAll/insert/update/deleteById`.
- [backend/src/projects/project.controller.ts](../../backend/src/projects/project.controller.ts) — `createProjectController(service)`; `insert` keeps `id: randomUUID()`.
- [backend/src/projects/project.routes.ts](../../backend/src/projects/project.routes.ts) — composition root wiring repo->service->controller (keep `validateId` UUID middleware — project ids stay UUIDs).
- [backend/src/database/seeds/projects.seed.ts](../../backend/src/database/seeds/projects.seed.ts) — each `technologies` entry -> `toSlug(name)` string id; the array stays in the same order. Drop all inline `iconClass`/`iconImage`. (Every project tech name is a verbatim skill name, so `toSlug` ids match seeded skill ids — lossless.)
- [backend/src/config/swagger.ts](../../backend/src/config/swagger.ts#L85-L107) — `Project` schema: `technologies` -> `{type:array, items:{type:string}}`.

**Acceptance criteria.**
1. `Project.technologies` is `string[]`; no `Tech` type remains; schema validates a
   string array (max 30).
2. Projects module is DI-factory-wired exactly like skills; `findAll` still orders by
   `date` (default desc); project ids remain UUIDs (insert + `validateId`).
3. `projectsSeed`: every `technologies` id is a slug that exists in `skillsSeed` ids
   (no dangling reference); UUID-less seed unchanged otherwise.
4. `npm run build` green.

**Scoped tests.**
- New `backend/tests/data-model-cleanup/project.service.test.ts` (unit, fake repo,
  modeled on the skill service test): `getAll/insert/update/deleteById` forwarding.
- New `backend/tests/data-model-cleanup/project.seed.test.ts` (unit, no emulator,
  cheap drift guard, complements D10): assert every `projectsSeed[*].technologies` id
  is present in the set of `skillsSeed` ids (referential sanity at build-data level).
- New `backend/tests/data-model-cleanup/project.emulator.test.ts` (emulator, D10):
  seed `skillsSeed` + a project into the emulator; assert (a) the project's
  `technologies` ids each resolve to an existing skill doc, and (b)
  `createProjectRepository().findAll()` returns date-desc ordering.
- Run: `npx vitest run tests/data-model-cleanup -t "project"` then `npm run test:emulator`.

**Commit.** `refactor(backend): project technologies reference skill ids`

---

## DMC-5 — Fix stale Resume swagger schema (Parking Lot, doc-only)

**Scope.** Correct the `Resume` component schema to match the real endpoint
([resume.repository.ts:7-21](../../backend/src/resume/resume.repository.ts#L7-L21)):
it returns `educations`, `experiences`, `certifications`, `achievements` only — NOT
`skills`/`projects`, and educations use `institution`/`title`/`startDate`/`endDate`
(not `degree`/`field`). Doc-only; non-prod surface; no behavior change.

**Files to touch.**
- [backend/src/config/swagger.ts](../../backend/src/config/swagger.ts#L130-L151) —
  `Resume` schema: drop `skills`/`projects`; keep `experiences` ($ref Experience) +
  add `certifications` ($ref Certification) + `achievements` ($ref Achievement);
  `educations` -> `$ref: '#/components/schemas/Education'` (which already has the
  correct fields) instead of the inline wrong `degree`/`field` object.

**Acceptance criteria.**
1. Swagger `Resume` lists exactly `educations, experiences, certifications,
   achievements`, each via the correct `$ref`.
2. No `skills`/`projects`/`degree`/`field` remain in the Resume schema.
3. `npm run build` green (swagger is a plain object; tsc must still compile).

**Scoped tests.** None (doc-only). Verify by `npm run build` + eyeballing the schema.

**Commit.** `docs(backend): correct stale resume swagger schema`

---

## DMC-6 — One-off idempotent prod patch script (D8) + emulator test

**Scope.** A single re-runnable `ts-node` script + `npm run patch:data-model-cleanup`
that transforms existing prod docs in place to the new shapes, preserving project
UUIDs. Factor the per-collection transform into an **exported** function so it can be
unit-driven against the emulator (the answered clarification).

**Transform (idempotent by construction):**
- **skills:** `FieldValue.delete()` `proficiency`; set `categoryId = toSlug(existing
  category)`; `FieldValue.delete()` old `category`; set `order` (per-category seed
  appearance order, matched by skill id — reuse the same ordering logic/source as the
  seed so both agree).
- **projects:** map `technologies` -> ids, guarded
  `typeof t === 'string' ? t : toSlug(t.name)` (second run sees strings, no-op).
- **about:** `FieldValue.delete()` `headline` on doc `main`.
- **categories:** upsert the 6 docs (`set`, idempotent).

**Files to create.**
- `backend/src/config/patch-data-model-cleanup.ts` — modeled on
  [patch-media-socials.ts](../../backend/src/config/patch-media-socials.ts); export an
  async `applyPatch(db: Firestore)` doing the 4 transforms in a batch; the module
  bottom runs `applyPatch(db).catch(console.error)` when executed directly. Reuse
  `toSlug`. Pull the category list + skill-order source from the seeds/a shared const
  so seed and patch cannot drift.

**Files to touch.**
- [backend/package.json](../../backend/package.json) — add
  `"patch:data-model-cleanup": "ts-node src/config/patch-data-model-cleanup.ts"`.

**Acceptance criteria.**
1. Running once against OLD-shape docs yields: skills with `categoryId`+`order` and no
   `proficiency`/`category`; projects with `technologies: string[]`; about `main`
   without `headline`; 6 category docs present.
2. Running a SECOND time changes nothing (idempotent) and does not throw on
   already-migrated arrays/absent fields.
3. Seeds (DMC-2/3/4) and the patch agree on category ids + skill order.

**Scoped tests.**
- New `backend/tests/data-model-cleanup/patch.emulator.test.ts` (emulator): write a
  handful of OLD-shape docs (skill with `proficiency`+`category`, project with `Tech`
  objects, about with `headline`); run `applyPatch(db)`; assert the NEW shape; run
  `applyPatch(db)` again and assert the docs are unchanged (idempotency) and no throw.
- Run: `npm run test:emulator` (whole slice). Also optionally a manual
  `npm run patch:data-model-cleanup` dry-run against a local emulator.

**Commit.** `chore(backend): add idempotent data-model cleanup patch script`

---

## DMC-7 — Frontend: home Toolbox category join + 2-level sort (D9)

**Scope.** Update the shared FE types touched by the home page, add the categories
fetcher, and rework `HomeClient` to fetch about + skills + categories, group skills by
`categoryId`, sort categories by `order` and skills by `order`, title each accordion
with the joined category `name`, and show a name-only tooltip. `ProjectType` is NOT
touched here (kept independent so this commit typechecks green; projects are DMC-8).

**Files to touch.**
- [frontend/app/types/resume.ts](../../frontend/app/types/resume.ts) —
  `AboutMeType`: drop `headline`. `SkillType`: drop `proficiency`, add `order: number`,
  `category` -> `categoryId: string`. Add `CategoryType = { id: string; name: string;
  order: number }`. (Leave `ProjectType` unchanged.)
- New `frontend/app/api/categories.ts` — `fetchCategories(): Promise<CategoryType[]>`
  modeled on [skills.ts](../../frontend/app/api/skills.ts).
- [frontend/components/HomeClient/index.tsx](../../frontend/components/HomeClient/index.tsx) —
  `Promise.all([fetchAbout(), fetchSkills(), fetchCategories()])`; filter `isShow`;
  group by `categoryId`; build an ordered category list (sort by `order`); within each,
  sort skills by `order`; accordion title = the joined category `name`; only render a
  category that has >=1 shown+resolved skill (edge case: no empty accordions); tooltip
  = `skill.name` only (remove the `proficiency` line).

**Acceptance criteria.**
1. Toolbox renders categories in `order` asc, each skill block in `order` asc.
2. Accordion title shows the human category `name` (joined from categories), not the id.
3. Tooltip shows skill name only; no `proficiency`/`category`/`headline` references
   remain in the home path.
4. Categories with no shown skills do not render.
5. `cd frontend; npm run typecheck` green.

**Scoped tests.** Typecheck only (no FE test runner). The render-time join/sort cannot
be exercised headless — call this out at commit time.

**Commit.** `feat(frontend): join skill categories for ordered toolbox`

---

## DMC-8 — Frontend: project tech resolution against skills (D9, D7)

**Scope.** `ProjectType.technologies` becomes `string[]`; `ProjectsClient` fetches
projects + ALL skills (unfiltered — project-only skills are `isShow:false`), builds a
`Map<id, skill>`, and resolves each technology id to a skill for its icon + name
tooltip, skipping unknown ids (edge case: dangling id silently drops). Independent of
DMC-7 (different type field), so it typechecks green on its own.

**Files to touch.**
- [frontend/app/types/resume.ts](../../frontend/app/types/resume.ts) —
  `ProjectType.technologies: string[]`.
- [frontend/components/ProjectsClient/index.tsx](../../frontend/components/ProjectsClient/index.tsx) —
  fetch projects + skills (`Promise.all`, via `useApi`); build `Map<id, SkillType>`;
  in BOTH the "Recent" and "All" tech-stack blocks, map `technologies` ids ->
  `map.get(id)`, render `skill.iconClass`/`skill.iconImage` (guard `isSafeUrl`) +
  `skill.name` tooltip; skip ids with no match. (Both blocks currently duplicate the
  tech-render markup — keep them in sync; a small local helper is acceptable.)

**Acceptance criteria.**
1. Each project's tech icons + tooltips come from the resolved skill (single source of
   truth), not inline objects.
2. Skills fetch is UNFILTERED (project-only `isShow:false` skills still resolve).
3. Unknown/dangling ids are skipped without crashing.
4. `cd frontend; npm run typecheck` green.

**Scoped tests.** Typecheck only. Resolution/skip behavior is render-time, not
headless-testable — call this out at commit time.

**Commit.** `feat(frontend): resolve project technologies against skills`

---

## Ticket -> commit SHA map (filled during /wf-implement)

| Ticket | Commit subject | SHA |
|---|---|---|
| DMC-1 | feat(backend): drop dead headline field from about | c6e365f |
| DMC-2 | feat(backend): add categories collection with ordered read | 7422edf |
| DMC-3 | feat(backend): replace skill proficiency/category with categoryId + order | 6b996cd |
| DMC-4 | refactor(backend): project technologies reference skill ids | f079065 |
| DMC-5 | docs(backend): correct stale resume swagger schema | a5f6214 |
| DMC-6 | chore(backend): add idempotent data-model cleanup patch script | 731b645 |
| DMC-7 | feat(frontend): join skill categories for ordered toolbox | 7f03868 |
| DMC-8 | feat(frontend): resolve project technologies against skills | 2c4c906 |

## Out of scope (deferred per DISCUSSION Parking Lot / decisions)

- Category-ref FK validation at write time -> S3 (D11).
- Bulk-reorder endpoint + reindex/gap strategy -> S3 (D5).
- About PATCH `:id` UUID-vs-`main` quirk — pre-existing, unrelated; leave alone.
- No API versioning/dual-read — single coordinated deploy (D12).
