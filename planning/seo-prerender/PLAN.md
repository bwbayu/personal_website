# SEO Pre-render of Public Pages (S6, T11) — Implementation Plan

Derived from [DISCUSSION.md](DISCUSSION.md) (LOCKED decisions D1-D5). Honor that
contract; this plan only fills in PLAN-level details left open there.

- **Branch:** `feat/seo-prerender` cut from `develop`.
- **Scope:** frontend only. No backend changes — no Vitest, no emulator slice.
- **Testing (FE = typecheck + build):** there is no FE test runner (CLAUDE.md). Each
  ticket's gate is `npm run typecheck` (bare `tsc --noEmit`, single-config — NO `-b`)
  plus, for any ticket touching metadata or build-time fetch, `npm run build` and a
  grep of the emitted `out/**/index.html`. **`npm run build` needs the dev backend
  reachable** at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`) because the
  existing blog/daily pages — and, after SEO-2+, the three converted pages — fetch at
  build. Start `cd backend; npm run dev` before building. If the backend can't be
  reached in the sandbox, run typecheck and STOP for the operator to run the build.

## PLAN-level decisions (filling gaps the discussion left to PLAN)

- **P1 — Granularity (refines D1).** Per Bayu: split Level 2 per page instead of one
  SEO-2 commit. Tickets: **SEO-1** (L1 metadata), **SEO-2** (Home), **SEO-3**
  (Projects), **SEO-4** (Resume), **SEO-5** (dead-layer cleanup). Still one session;
  each page ships independently; cleanup lands last once no page uses the hooks. This
  honors D1's intent (Level 1 then Level 2, Home->Projects->Resume) at finer commit
  granularity.
- **P2 — L1 metadata shape (settles §4 "metadata merge nuance").** Add EXPLICIT
  `openGraph` + `twitter` blocks per page (do NOT rely on Next auto-filling OG from the
  page title). Next merges metadata per-field across segments: a page that sets
  `openGraph` shallow-replaces the layout's `openGraph` object, so each page must
  re-state `type`/`siteName`/`images` to keep the card + default image. Mirror the root
  layout's block ([app/layout.tsx:21-34](../../frontend/app/layout.tsx#L21-L34)),
  reusing `/og-default.png` (D2), with a per-page `title`/`description`/`url`.
- **P3 — Build-fetcher file layout (settles D4 "PLAN detail").** ONE module
  `frontend/lib/public/content.ts` holding all five `force-cache` fetchers
  (`getAbout`, `getSkills`, `getCategories`, `getProjects`, `getResume`) + the local
  `ResumeData` type. Mirrors `lib/blog/posts.ts` / `lib/daily/logs.ts` shape (no
  `no-store`, no `AbortSignal.timeout`; `throw` on `!res.ok`). Singletons (`about`,
  `resume`) `throw` on missing `json.data` (Home/Resume depend on it — §4); lists
  (`skills`, `categories`, `projects`) return `json.data ?? []` on empty. Keyed by DATA
  domain so the shared `getSkills` dedups across Home + Projects via Next's build-time
  fetch dedup (force-cache is what enables the dedup). Fetchers are added incrementally
  by the ticket that first needs them (about/skills/categories in SEO-2, projects in
  SEO-3, resume in SEO-4).
- **P4 — Keep Loading/ErrorMessage (settles §4 + Q2).** `components/Loading` +
  `components/ErrorMessage` stay as-is; the three components only DROP their imports +
  early-return usage. D5 deletion is data-layer only.

---

## SEO-1 — Level 1: per-page OG/Twitter metadata (home / projects / resume)

**Depends on:** none. **Decisions:** D2, P2.

**Scope.** Add explicit per-page `openGraph` + `twitter` blocks (static, hand-written
strings + the existing default OG image) to the three public pages. No data fetch, no
component change. Sitemap/robots/metadataBase/default OG already exist from S4 (§2) —
untouched.

**Files to touch**
- [app/(public)/page.tsx](../../frontend/app/(public)/page.tsx) — Home currently exports
  NO `metadata`. Add a `metadata: Metadata` export (title + description + openGraph +
  twitter). `url: "/"`.
- [app/(public)/project/page.tsx](../../frontend/app/(public)/project/page.tsx) — extend
  the existing `metadata` (title+description) with openGraph + twitter. `url: "/project"`.
- [app/(public)/resume/page.tsx](../../frontend/app/(public)/resume/page.tsx) — same,
  `url: "/resume"`.

Each block mirrors the root layout shape: `openGraph: { type: "website", siteName:
"Bayu Wicaksono", title, description, url, images: ["/og-default.png"] }`, `twitter:
{ card: "summary_large_image", title, description, images: ["/og-default.png"] }`. Keep
the existing Projects/Resume title/description strings; give Home a hand-written
title+description (editorial — pick something like title "Bayu Wicaksono" / a one-line
bio description; Bayu may tweak the copy).

**Acceptance criteria**
1. `npm run typecheck` passes.
2. `npm run build` succeeds; `out/index.html`, `out/project/index.html`,
   `out/resume/index.html` each contain a page-specific `og:title`, `og:description`,
   `og:url`, `og:image` (absolute, resolved via metadataBase to
   `https://bwbayu.space/og-default.png` or the env origin) and `twitter:card`.
3. The three pages' OG titles/descriptions differ from each other and from the generic
   site-level card.

**Scoped tests.** `npm run typecheck`; `npm run build` then grep the three emitted
HTML files for `og:url` / `og:image` (e.g. `rg 'og:(url|image|title)' out/project/index.html`).

---

## SEO-2 — Convert Home to build-time render

**Depends on:** SEO-1 (shares the file; keeps its metadata export). **Decisions:** D3,
D4, P3, P4. **Edge cases:** §4 empty-states, about-singleton-throws.

**Scope.** Create `lib/public/content.ts` with `getAbout` / `getSkills` /
`getCategories`. Turn `app/(public)/page.tsx` into an `async` server component that
awaits the three (via `Promise.all`) and passes them as props to `HomeClient`.
`HomeClient` stays `"use client"`, drops its `useAbout/useSkills/useCategories` hooks +
the `Loading`/`ErrorMessage` early returns, and reads props instead. All interactivity
(role-rotation `useEffect`, contact-toggle `useState`, Accordion/Tooltip) unchanged.

**Files to touch**
- **NEW** `frontend/lib/public/content.ts` — add `getAbout(): Promise<AboutMeType>`
  (throw on `!data`), `getSkills(): Promise<SkillType[]>` (full unfiltered list, `?? []`),
  `getCategories(): Promise<CategoryType[]>` (`?? []`). Import types from
  `@/app/types/resume`. Pattern per P3.
- [app/(public)/page.tsx](../../frontend/app/(public)/page.tsx) — keep the SEO-1
  `metadata` export; change default export to
  `async function Home()` doing `const [about, skills, categories] = await
  Promise.all([getAbout(), getSkills(), getCategories()]); return <HomeClient
  about={about} skills={skills} categories={categories} />`.
- [components/HomeClient/index.tsx](../../frontend/components/HomeClient/index.tsx) —
  accept `{ about: AboutMeType; skills: SkillType[]; categories: CategoryType[] }`;
  remove the three `useXxx()` calls + `loading`/`error` branches + `Loading`/
  `ErrorMessage` imports; derive `aboutMe`/`skills`(filter `isShow`)/`categories` from
  props (keep the existing group-by-category + 2-level sort logic).

**Acceptance criteria**
1. `npm run typecheck` passes.
2. `npm run build` succeeds; `out/index.html` contains the rendered "My Toolbox"
   skills (e.g. a known category name / skill tooltip text) in the static HTML — i.e.
   content is present pre-JS. (Contact name/email stay behind the client toggle — not
   expected in initial HTML; that's fine, the toolbox is the indexable content.)
3. Home still hydrates: role-rotation + contact toggle work in the browser
   (manual/visual — note explicitly, can't assert headless).
4. Empty `skills`/`categories` -> "No skills to display." still renders; missing
   `about` doc -> build fails (throw).

**Scoped tests.** `npm run typecheck`; `npm run build` (backend up) then
`rg '<known category or skill name>' out/index.html`.

---

## SEO-3 — Convert Projects to build-time render

**Depends on:** SEO-2 (reuses `getSkills`). **Decisions:** D3, D4, P3, P4.
**Edge cases:** §4 skills-unfiltered, empty-states.

**Scope.** Add `getProjects` to `lib/public/content.ts`. Convert
`app/(public)/project/page.tsx` to an `async` server component awaiting `getProjects` +
`getSkills` (shared, dedups with Home) and passing props to `ProjectsClient`.
`ProjectsClient` stays `"use client"`, drops `useProjects/useSkills` +
`Loading`/`ErrorMessage`, reads props. Skills come UNFILTERED (project-only `isShow:false`
skills must resolve icons); per-page filtering stays in the component (it already uses the
full `skillMap`).

**Files to touch**
- `frontend/lib/public/content.ts` — add `getProjects(): Promise<ProjectType[]>` (`?? []`).
- [app/(public)/project/page.tsx](../../frontend/app/(public)/project/page.tsx) — keep
  SEO-1 metadata; default export becomes
  `async function ProjectsPage()` -> `const [projects, skills] = await
  Promise.all([getProjects(), getSkills()]); return <ProjectsClient projects={projects}
  skills={skills} />`.
- [components/ProjectsClient/index.tsx](../../frontend/components/ProjectsClient/index.tsx)
  — accept `{ projects: ProjectType[]; skills: SkillType[] }`; remove the two `useXxx()`
  calls + loading/error branches + imports; build `skillMap` / `recent` from props.

**Acceptance criteria**
1. `npm run typecheck` passes.
2. `npm run build` succeeds; `out/project/index.html` contains a known project name +
   its tech-stack icons resolved (incl. a project-only skill) in static HTML.
3. Empty `projects` -> "No recent projects" / "No projects to display." still render.
4. Tooltips/accordions still hydrate (manual note).

**Scoped tests.** `npm run typecheck`; `npm run build` then `rg '<known project name>'
out/project/index.html`.

---

## SEO-4 — Convert Resume to build-time render

**Depends on:** SEO-2 (uses the shared module). **Decisions:** D3, D4, P3, P4.
**Edge cases:** §4 resume-singleton-throws, empty-states.

**Scope.** Add `getResume` + the `ResumeData` type to `lib/public/content.ts`. Convert
`app/(public)/resume/page.tsx` to an `async` server component awaiting `getResume` and
passing props to `ResumeClient`. `ResumeClient` stays `"use client"`, drops `useResume`
+ `Loading`/`ErrorMessage`, reads props. Tab `useState` switcher unchanged.

**Files to touch**
- `frontend/lib/public/content.ts` — add `type ResumeData = { educations; experiences;
  certifications; achievements }` (move the shape from the to-be-deleted
  `app/api/resume.ts`) and `getResume(): Promise<ResumeData>` (throw on `!data`, §4).
- [app/(public)/resume/page.tsx](../../frontend/app/(public)/resume/page.tsx) — keep
  SEO-1 metadata; default export becomes `async function ResumePage()` -> `const resume
  = await getResume(); return <ResumeClient resume={resume} />`.
- [components/ResumeClient/index.tsx](../../frontend/components/ResumeClient/index.tsx) —
  accept `{ resume: ResumeData }`; remove `useResume` + loading/error branches + imports;
  destructure `educations/experiences/certifications/achievements` from the prop.

**Acceptance criteria**
1. `npm run typecheck` passes.
2. `npm run build` succeeds; `out/resume/index.html` contains a known education entry
   (the default `education` tab renders in static HTML; other tabs are gated by client
   state — acceptable, note it).
3. Empty arrays -> the per-tab "No ... to display." messages still render.
4. Tab switching still hydrates (manual note).

**Scoped tests.** `npm run typecheck`; `npm run build` then `rg '<known education
title>' out/resume/index.html`.

---

## SEO-5 — Delete the now-dead public client data layer (cleanup)

**Depends on:** SEO-2, SEO-3, SEO-4 (all hook consumers gone first). **Decisions:** D5,
P4. **MUST be last.**

**Scope.** Remove the dead public TanStack hooks + their `no-store` fetchers. KEEP
`useMediaSocials` + `app/api/mediaSocials.ts` (navbar/footer), `adminKeys` (admin), and
`components/Loading` + `components/ErrorMessage` (P4).

**Files to touch**
- [lib/queries.ts](../../frontend/lib/queries.ts) — delete the `about/skills/categories/
  projects/resume` entries from `queryKeys`, the five fetcher imports (lines 4-8), and
  the five hooks `useAbout/useSkills/useCategories/useProjects/useResume` (lines 40-53).
  Keep `queryKeys.mediaSocials`, `adminKeys`, the `Data<>` helper, and `useMediaSocials`.
- **DELETE** `frontend/app/api/about.ts`, `skills.ts`, `categories.ts`, `projects.ts`,
  `resume.ts`. **KEEP** `app/api/mediaSocials.ts`.

**Acceptance criteria**
1. `npm run typecheck` passes (no dangling imports/refs).
2. `rg 'useAbout|useSkills|useCategories|useProjects|useResume|fetchAbout|fetchSkills|
   fetchCategories|fetchProjects|fetchResume'` returns NO hits.
3. `app/api/mediaSocials.ts`, `useMediaSocials`, `adminKeys`, `components/Loading`,
   `components/ErrorMessage` still present.
4. `npm run build` still green.

**Scoped tests.** `npm run typecheck`; the two greps above; `npm run build`.

---

## Sequencing & traceability

Order: **SEO-1 -> SEO-2 -> SEO-3 -> SEO-4 -> SEO-5** (metadata first; per-page
conversions Home->Projects->Resume per D1; cleanup last once no consumer remains). One
commit per ticket. Record each ticket's commit SHA here during implement:

| Ticket | Scope | Commit |
|--------|-------|--------|
| SEO-1 | L1 per-page OG/Twitter (3 pages) | 0ee5c1c |
| SEO-2 | Home -> build-time render | _pending_ |
| SEO-3 | Projects -> build-time render | _pending_ |
| SEO-4 | Resume -> build-time render | _pending_ |
| SEO-5 | Delete dead public data layer | _pending_ |

Suggested commit subjects (per CLAUDE.md, no ticket suffix):
- SEO-1 `feat(frontend): add per-page Open Graph and Twitter card metadata`
- SEO-2 `refactor(frontend): render home page content at build time`
- SEO-3 `refactor(frontend): render projects page content at build time`
- SEO-4 `refactor(frontend): render resume page content at build time`
- SEO-5 `chore(frontend): remove dead public client data fetchers and hooks`
