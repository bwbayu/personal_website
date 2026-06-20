# Data-Model Cleanup (S1) — Implementation Design Discussion

> Scope: IMPLEMENTATION-level design for the four interdependent S1 changes
> (T4, T8-categories, T2, T3), shipped on one `feat/data-model-cleanup` branch.
> The HIGH-LEVEL decisions are already LOCKED in
> [planning/feature-roadmap/DISCUSSION.md](../feature-roadmap/DISCUSSION.md)
> (sections T2/T3/T4/T8 + the 2026-06-19 Decisions log) — treated as contract,
> not relitigated here.

## 1. Objective

Clean up the skills/projects/about data model in dependency order, on one branch:

1. **T4** — remove the unused `headline` field everywhere (5 locations).
2. **T8 (categories slice)** — move skill categories from the hardcoded enum in
   `skill.schema.ts` to a Firestore `categories` collection (admin-CRUDable later),
   each category carrying its own `order`.
3. **T2** — drop skill `proficiency`/`experience` from schema/type/seed/UI; add a
   per-category `order` on skills. Two-level ordering = category `order` +
   skill-within-category `order`.
4. **T3** — `project.technologies` references skill IDs from the `skills` collection
   (single source of truth). `isShow` gates Toolbox visibility; icons live on the
   skill; project pages resolve skillId -> skill at render.

Why: eliminate icon/tech drift (skills <-> projects), kill a dead field, make
category list + ordering data-driven (no redeploy), and simplify the skill model.

## 2. Grounding / Data Flow (verified against code)

### Domain shapes today
- **Skill** `{ id, name, iconClass?, iconImage?, category, proficiency, isShow }`
  — [skill.type.ts:3-11](../../backend/src/skills/skill.type.ts#L3-L11). `category`
  is a 6-value enum — [skill.schema.ts:3-16](../../backend/src/skills/skill.schema.ts#L3-L16).
  Skills use **slug doc ids** (`toSlug(name)`, e.g. `go`, `node-js`,
  `amazon-web-services-aws`) — [migration.ts:40-42](../../backend/src/config/migration.ts#L40-L42),
  [skill.controller.ts:18](../../backend/src/skills/skill.controller.ts#L18); writes
  validated by `validateSlugId` — [skill.routes.ts:19-20](../../backend/src/skills/skill.routes.ts#L19-L20).
  Repo already **DI-converted** in S0 — [skill.repository.ts:7-15](../../backend/src/skills/skill.repository.ts#L7-L15).
- **Project** `{ id, name, date, description, technologies: Tech[], role[],
  category[], url?, githubUrl?, youtubeUrl? }` where `Tech = {name, iconClass?,
  iconImage?}` — [project.type.ts:1-14](../../backend/src/projects/project.type.ts#L1-L14).
  Projects use **random UUID doc ids** — [project.controller.ts:17](../../backend/src/projects/project.controller.ts#L17),
  validated by `validateId` (UUID regex) — [project.routes.ts:12-13](../../backend/src/projects/project.routes.ts#L12-L13).
  Repo **NOT DI-converted** (module singleton) — [project.repository.ts:4-9](../../backend/src/projects/project.repository.ts#L4-L9),
  [project.service.ts:1](../../backend/src/projects/project.service.ts#L1).
  `project.category` (e.g. `['Web','ML']`) is **project-type tagging, unrelated to
  skill categories** — do not conflate.
- **About** `{ id, name, email, headline }` — [about.type.ts:1-6](../../backend/src/about/about.type.ts#L1-L6).
  Single fixed doc `main` — [about.repository.ts:4](../../backend/src/about/about.repository.ts#L4).

### Frontend consumption
- **Toolbox** (home): fetches about + skills, filters `isShow`, groups by
  `skill.category` via `reduce` (order = arbitrary Firestore order), tooltip shows
  `name` + `proficiency` — [HomeClient/index.tsx:22-25,42-51,165-176](../../frontend/components/HomeClient/index.tsx#L42-L51).
- **Projects** page: fetches projects only; renders `tech.iconClass`/`tech.iconImage`
  + `tech.name` tooltip — [ProjectsClient/index.tsx:15,76-96](../../frontend/components/ProjectsClient/index.tsx#L76-L96).
  Does **not** currently fetch skills.
- **Resume** page: educations/experiences/certifications/achievements only — no
  skills/projects/about — [ResumeClient/index.tsx:36](../../frontend/components/ResumeClient/index.tsx#L36).
- Shared FE types (misnamed file) live in
  [resume.ts](../../frontend/app/types/resume.ts): `AboutMeType` (headline:51),
  `SkillType` (proficiency:58, category:59), `ProjectType` (technologies:44).
- API fetchers return `json.data` as-is — [app/api/skills.ts](../../frontend/app/api/skills.ts),
  [projects.ts](../../frontend/app/api/projects.ts), [about.ts](../../frontend/app/api/about.ts).
  Response envelope `{ success, data }` — [response.util.ts:3-5](../../backend/src/utils/response.util.ts#L3-L5).

### Drift evidence (motivates T3)
Skill vs project icon paths for the same tech diverge:
`cognee.jpeg`/`crewai.jpg`/`gradio.jpg` (skill) vs `cognee.png`/`crewai.png`/`gradio.png`
(project) — [skills.seed.ts:47,50,51](../../backend/src/database/seeds/skills.seed.ts#L47)
vs [projects.seed.ts:29,32,33](../../backend/src/database/seeds/projects.seed.ts#L29).
Every project tech name is a verbatim copy of a skill name -> `toSlug(name)` ===
skill id, so the string->skillId backfill is deterministic and lossless.

### Migration reality (IMPORTANT)
Seeds only populate EMPTY collections (`seedCollection`/`seedSkills` early-return on
non-empty; `seedAbout` on doc-exists) — [migration.ts:16-18,32-34,50-53](../../backend/src/config/migration.ts#L16-L18).
Prod is already seeded, so editing seeds changes nothing in prod. **S1 must ship a
one-off idempotent patch script** (the [patch-media-socials.ts](../../backend/src/config/patch-media-socials.ts)
pattern, run via an `npm run patch:*` script) to transform existing prod data. Seeds
remain the source of truth for fresh/local/emulator installs.

### Test harness (S0 template)
DI service unit (fake repo) — [skill.service.test.ts](../../backend/tests/test-harness/skill.service.test.ts);
generic repo emulator test (findAllOrdered etc.) —
[firestore.repository.emulator.test.ts](../../backend/tests/test-harness/firestore.repository.emulator.test.ts);
endpoint smoke (auth/Zod/CRUD round-trip) —
[skill.endpoint.emulator.test.ts](../../backend/tests/test-harness/skill.endpoint.emulator.test.ts);
helpers `clearFirestore`/`withApiKey` — [emulator.ts](../../backend/tests/helpers/emulator.ts).
The skill tests hardcode `proficiency` (service:20,48; endpoint:16,62,84-86) and WILL
go red under T2 — S1 must update them.

## 3. Key Decisions

Inherited-locked from the roadmap are marked **[L]**; this session's open
implementation calls are marked **[OPEN]** / **[DECIDE]**.

- **D1 [L] T4 headline removal** — full removal across the 5 locations above. No
  back-compat needed (field is dead).
- **D2 [L] `categories` collection shape** — new domain following the
  per-domain pattern. Doc `{ id, name, order }`, **slug doc ids** (`toSlug(name)`,
  parity with skills), e.g. `programming-languages`. DI-factory repo from the start.
  `getAll` returns ordered by `order asc` (the testable "deviation"). Routes under
  `/api/categories`, slug-id validated, write-gated by the existing API key.
- **D3 [L] Skill references category by `categoryId` (slug).** Skill drops the
  `category` name field and stores `categoryId` (e.g. `programming-languages`,
  matching the category doc id). The display name comes from the joined category
  doc. Rename-safe (renaming a category = one doc write); FE joins skill->category
  (it already needs categories for `order`).
- **D4 [L] Skill schema/type changes (T2)** — drop `proficiency`; add
  `order: number (int)`; replace the `category` enum with `categoryId:
  z.string().min(1).max(200)` (enum deleted). `iconClass`/`iconImage`/`isShow`
  unchanged. Skill doc id stays the name slug.
- **D5 [L] Ordering semantics** — integer `order`. Skills: per-category,
  0-based, contiguous, assigned by current seed appearance order. Categories:
  0-based following the existing enum order (Programming Languages, Web/Cross
  Platform, DevOps Tools, Databases, Cloud Platforms, Data/AI). No auto-reindex /
  gap strategy in S1 (the reorder endpoint + admin UI are S3); S1 only assigns
  initial values + adds the field. Two-level sort happens on the FE after the join.
- **D6 [L] T3 project.technologies -> skill ids** — `technologies: string[]` (skill
  slug ids). Schema `z.array(z.string().min(1).max(200)).max(30)`. Seed rewritten to
  id arrays; inline icon objects (and their drift) deleted.
- **D7 [L] technologies resolution = FE at render** — projects endpoint returns
  `string[]`; the project page fetches skills, builds `Map<id, skill>`, resolves
  name+icons at render. Consequence: the render-join lives on the typecheck-only FE
  (no unit test); the BE "deviation" we DO test is that stored ids are valid slugs
  that correspond to seeded skills (referential sanity), satisfying the roadmap's
  "technologies->skill resolution" test intent at the data layer.
- **D8 [L] Prod migration = one in-place idempotent patch script**
  (`patch:data-model-cleanup`, ts-node, `npm run patch:*`). Transforms existing docs
  in place, preserves project UUIDs, re-runnable safely:
  - skills: `FieldValue.delete()` `proficiency`; set `order`; set `categoryId =
    toSlug(existingCategoryName)`; `FieldValue.delete()` old `category`. (Per-category
    `order` derived from the canonical seed appearance order, matched by skill id.)
  - projects: map `technologies` -> ids, guarded
    `typeof t === 'string' ? t : toSlug(t.name)` (idempotent).
  - about: `FieldValue.delete()` `headline` on doc `main`.
  - categories: upsert the 6 docs (`set`, idempotent).
  Seeds are updated in parallel as the source of truth for fresh/local/emulator.
- **D9 [L] FE shape changes** —
  - `AboutMeType`: drop `headline`.
  - `SkillType`: drop `proficiency`; add `order`; `category` -> `categoryId`
    (icons, isShow unchanged).
  - `ProjectType`: `technologies: string[]`.
  - New `CategoryType { id, name, order }` + `app/api/categories.ts` fetcher.
  - HomeClient: fetch about + skills + categories (Promise.all); filter `isShow`;
    group by `categoryId`; sort categories by `order`, skills by `order`; accordion
    title = joined category `name`; tooltip = skill `name` only (proficiency line
    removed).
  - ProjectsClient: fetch projects + ALL skills (unfiltered — project-only skills
    are `isShow:false`); resolve `technologies` ids via the map; skip unknown ids.
- **D10 [L] Tests (S1 = about/skills/projects/categories)** —
  - categories: service unit (fake repo) + emulator ordered-query test
    (`getAll` -> `order asc`).
  - skills: UPDATE the existing harness tests to the new shape (drop proficiency,
    add order + category ref). No new query deviation (skills stay `findAll`).
  - projects: DI-convert, then service unit (fake repo) + an emulator test asserting
    a seeded project's `technologies` are slug ids that resolve to existing skill
    docs (referential sanity) + `findAllOrdered('date')` still holds.
  - about: minimal — schema unit (no `headline`); no emulator test needed.
- **D11 [L] Category-ref integrity** — not FK-checked at write time in S1
  (schema = plain string). Admin (S3) may add existence validation. Acceptable
  because S1 writes come only from seed/patch under the static API key.
- **D12 [L] API/wire back-compat** — BE + FE ship on the SAME branch into one
  coordinated develop->main deploy, so the breaking wire-shape changes (skills lose
  proficiency / gain order+categoryRef; projects technologies object->string[]) are
  internal. Brief deploy-window skew is tolerated (personal site, low traffic). No
  versioning/dual-read.

## 4. Edge Cases
- **Dangling skillId in a project** (skill deleted/renamed) -> FE `map.get` miss.
  S1 behavior: filter out unresolved ids (icon+name silently drop). Relevant once
  admin can delete skills (S3); seed is internally consistent.
- **Renaming a category** — under `categoryId` (D3=id) a rename touches only the
  category doc; under `category` (D3=name) it would require rewriting every skill.
- **Patch idempotency** — re-running must be safe: deleting an absent field is a
  no-op; the project transform must guard `typeof tech === 'string' ? tech :
  toSlug(tech.name)` so a second run doesn't crash on already-migrated arrays.
- **`isShow` on the Toolbox** — already filtered (HomeClient); project page must NOT
  filter `isShow` (it needs the project-only skills).
- **Empty categories** — a category with no shown skills should not render an empty
  accordion (FE: only render categories that have >=1 resolved shown skill).
- **toSlug collisions** — none in current data; names are distinct. New skills via
  admin could theoretically collide (S3 concern).

## 5. Decisions Log (the contract)
- 2026-06-20 — D1 LOCKED (inherited): T4 full `headline` removal, 5 locations.
- 2026-06-20 — D6 LOCKED (inherited): project.technologies = skill slug-id `string[]`.
- 2026-06-20 — D7 LOCKED (inherited): technologies resolved on the FE at render; BE
  returns ids; BE test asserts referential validity only.
- 2026-06-20 — D3 LOCKED: skill references category by `categoryId` (slug); skill
  drops the `category` name field; display name comes from the joined category doc.
- 2026-06-20 — D8 LOCKED: prod migrated via one in-place idempotent patch script
  (preserves project UUIDs); seeds updated in parallel for fresh installs.
- 2026-06-20 — D2 LOCKED: new `categories` collection `{id,name,order}`, slug ids,
  DI-factory repo, `getAll` ordered `order asc`, routes `/api/categories` (API-key
  gated writes).
- 2026-06-20 — D4 LOCKED: skill drops `proficiency`, adds `order:int` and
  `categoryId:string`; the 6-value enum is deleted; doc id stays the name slug.
- 2026-06-20 — D5 LOCKED: integer `order`; skills per-category 0-based contiguous
  (seed appearance order); categories ordered by the legacy enum sequence; no
  reindex/gap logic in S1 (-> S3); 2-level sort done on the FE post-join.
- 2026-06-20 — D9 LOCKED: FE — `AboutMeType` drop headline; `SkillType` drop
  proficiency + add `categoryId`/`order`; `ProjectType.technologies: string[]`; new
  `CategoryType` + `app/api/categories.ts`; HomeClient join+2-level-sort, tooltip
  name-only; ProjectsClient resolves ids against ALL skills (unfiltered), skips
  unknown ids.
- 2026-06-20 — D10 LOCKED: tests — categories unit + ordered emulator; skills update
  the S0 harness tests to the new shape; projects DI-convert + service unit +
  referential emulator (technologies are slug ids resolving to skill docs); about
  minimal schema unit.
- 2026-06-20 — D11 LOCKED: no category-ref FK check at write time in S1 (string
  schema); existence validation deferred to admin (S3).
- 2026-06-20 — D12 LOCKED: BE+FE ship on one branch / one coordinated deploy;
  breaking wire-shape changes are internal; brief deploy-window skew tolerated; no
  versioning/dual-read.
- 2026-06-20 — Design LOCKED in full; ready for /wf-plan.

## 6. Parking Lot / Later
- Swagger `Resume` schema is stale (documents skills/projects + wrong education
  fields; real endpoint returns educations/experiences/certifications/achievements)
  — [swagger.ts:130-151](../../backend/src/config/swagger.ts#L130-L151). Fix
  opportunistically while editing swagger for D1/D4, else defer.
- About PATCH validates the `:id` param as a UUID but the repo ignores it and always
  writes doc `main` — [about.routes.ts:11](../../backend/src/about/about.routes.ts#L11),
  [about.repository.ts:17-24](../../backend/src/about/about.repository.ts#L17-L24).
  Pre-existing quirk, unrelated to headline; leave alone.
- Category-ref FK validation at write time -> S3 (admin).
- Bulk-reorder endpoint + reindex/gap strategy -> S3.
