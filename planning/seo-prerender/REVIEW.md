# SEO Pre-render of Public Pages (S6, T11) — Review (Pass 1)

Fresh-eyes, read-only audit of the feature diff. No code changed.

## 1. Objective + scope

- **Slug:** `seo-prerender`. **Base:** `develop` (used `develop...HEAD`). **Branch:** `feat/seo-prerender`.
- **Args note:** the wf-review prompt rendered the slug as `develop`; the real args were
  `seo-prerender develop` (slug `seo-prerender`, base `develop`). Reviewed against
  `planning/seo-prerender/{PLAN,DISCUSSION}.md`.
- **Commits reviewed** (code only; planning-doc commits excluded):
  - `0ee5c1c` SEO-1 — per-page OG/Twitter metadata (3 pages)
  - `f8ac894` SEO-2 — Home -> build-time render
  - `7a076f4` SEO-3 — Projects -> build-time render
  - `ddcd7fc` SEO-4 — Resume -> build-time render
  - `3edb38d` SEO-5 — delete dead public client data layer
- **Pending / not built:** none — all five PLAN tickets implemented.
- **Verification status:** `npm run typecheck` run here = **GREEN**. `npm run build` +
  the emitted-HTML greps (the AC2/AC3 build checks of every ticket) **NOT run**: the dev
  backend was unreachable in the sandbox (`http://localhost:3001` -> conn refused), and
  the PLAN explicitly says to typecheck-and-stop in that case. Frontend has no test
  runner and this is FE-only, so no Vitest/emulator slice applies.

## 2. Plan-conformance table

| Ticket | Status | Evidence |
|--------|--------|----------|
| SEO-1 (per-page OG/Twitter) | **Met** (build-grep pending) | Explicit `openGraph`+`twitter` blocks added to all three pages, mirroring layout shape, reusing `/og-default.png`, per-page `url`/`title`/`description` — [page.tsx:6-29](../../frontend/app/(public)/page.tsx#L6-L29), [project/page.tsx:5-28](../../frontend/app/(public)/project/page.tsx#L5-L28), [resume/page.tsx:5-29](../../frontend/app/(public)/resume/page.tsx#L5-L29). AC1 typecheck GREEN; AC2/AC3 (grep emitted HTML) unverified — build not run. |
| SEO-2 (Home build-time) | **Met** (build-grep pending) | `lib/public/content.ts` adds `getAbout/getSkills/getCategories`; `Home` is `async` with `Promise.all` ([page.tsx:31-38](../../frontend/app/(public)/page.tsx#L31-L38)); `HomeClient` takes props, drops the three hooks + Loading/Error early-returns, filters `isShow`, keeps role-rotation/contact-toggle/2-level sort ([HomeClient/index.tsx:16-61](../../frontend/components/HomeClient/index.tsx#L16-L61)). AC4 empty-state "No skills to display." preserved ([:151](../../frontend/components/HomeClient/index.tsx#L151)); missing `about` -> build throw ([content.ts:34](../../frontend/lib/public/content.ts#L34)). |
| SEO-3 (Projects build-time) | **Met** (build-grep pending) | `getProjects` added; `ProjectsPage` `async` + `Promise.all([getProjects(), getSkills()])` ([project/page.tsx:30](../../frontend/app/(public)/project/page.tsx#L30)); `ProjectsClient` takes props, skills UNFILTERED, drops hooks/Loading/Error, builds `skillMap`/`recent` ([ProjectsClient/index.tsx:52-62](../../frontend/components/ProjectsClient/index.tsx#L52-L62)). Empty states preserved ([:71,:172](../../frontend/components/ProjectsClient/index.tsx#L71)). |
| SEO-4 (Resume build-time) | **Met** (build-grep pending) | `ResumeData` type + `getResume` (throw on `!data`) in content.ts ([:21-26,:71](../../frontend/lib/public/content.ts#L21-L26)); `ResumePage` `async` ([resume/page.tsx:28](../../frontend/app/(public)/resume/page.tsx#L28)); `ResumeClient` takes `{ resume }`, type-only import of `ResumeData`, drops `useResume`/Loading/Error, keeps tab `useState` ([ResumeClient/index.tsx:16,26-29](../../frontend/components/ResumeClient/index.tsx#L26-L29)). Per-tab empty states preserved. |
| SEO-5 (cleanup) | **Met** | 5 fetchers deleted (`app/api/{about,skills,categories,projects,resume}.ts`); `queryKeys` trimmed to `mediaSocials`; 5 public hooks removed; `useMediaSocials`+`adminKeys`+`mediaSocials.ts` kept ([queries.ts](../../frontend/lib/queries.ts)). AC2 grep for dead symbols = **NO hits** (verified). `Loading.tsx`/`ErrorMessage.tsx` kept (still used by admin). AC4 build unverified. |

## 3. Decision-conformance table

| Decision | Honored? | Evidence |
|----------|----------|----------|
| D1 — two levels sequenced (L1, then L2 Home->Projects->Resume) | Yes | P1 split SEO-1..SEO-5; commit order matches. |
| D2 — static hand-written metadata + default OG image | Yes | All strings hand-written; `/og-default.png` reused; no data-derived metadata. |
| D3 — blog/daily pattern (server page -> props -> still-client component; drops hooks; Providers stays) | Yes | All three pages converted; components stay `"use client"` minus data hooks. `Providers` still wraps in [layout.tsx:52](../../frontend/app/layout.tsx#L52); `useMediaSocials` still on TanStack Query. |
| D4 — per-endpoint `force-cache` fetchers mirroring blog/daily; shared skills dedups | Yes | `content.ts` matches `lib/blog/posts.ts`/`lib/daily/logs.ts` shape (force-cache, throw on `!res.ok`, `?? []` for lists); single `getSkills` shared by Home+Projects. |
| D5 — delete dead public hooks+fetchers; keep mediaSocials + adminKeys | Yes | See SEO-5 row. |
| P3 — one `lib/public/content.ts`; singletons throw, lists `?? []` | Yes | `getAbout`/`getResume` throw on `!data`; `getSkills/getCategories/getProjects` return `?? []`. |
| P4 — keep Loading/ErrorMessage; only drop usage | Yes | Both files present and still imported by admin components. |

## 4. Edge-case checklist

| Case | Result |
|------|--------|
| Empty lists at build (`skills/categories/projects` = []) | OK — fetchers `?? []`; components render "No ... to display." |
| Missing `about` singleton | OK — `getAbout` throws -> build fails (per §4). |
| Missing `resume` aggregation | OK — `getResume` throws -> build fails. |
| Skills unfiltered for Projects (project-only `isShow:false` icons) | OK — `getSkills` returns full list; Home filters `isShow` locally, Projects uses `skillMap` over all. |
| Shared skills fetch dedup (Home + Projects) | Plausible by design (force-cache + identical URL); not build-verified. |
| Dangling imports / refs after cleanup | OK — grep for all 10 dead symbols + 5 deleted module paths = no hits; typecheck GREEN. |
| Client/server boundary (ResumeClient imports from content.ts) | OK — type-only import (`import type { ResumeData }`), erased at compile; no server fetcher pulled into client bundle. |
| Loading/ErrorMessage still resolvable | OK — `components/{Loading,ErrorMessage}.tsx` present, used by admin. |
| metadataBase resolves relative OG image/url | Present in [layout.tsx:18](../../frontend/app/layout.tsx#L18); absolute resolution is build-verified only (pending). |
| Resume non-default tabs / Home contact info in static HTML | Not in initial HTML (gated by client state) — accepted per PLAN AC. |

## 5. Findings

### §1 — Build-grep acceptance criteria unverified (sandbox backend down) — SHOULD-FIX (operator gate, not a code defect)
- **Where:** all tickets' AC2/AC3 (e.g. PLAN:76-79, 118-121, 158-160, 191-193, 225).
- **What:** `npm run build` + the `rg 'og:...' out/**/index.html` and content greps could
  not run here — `http://localhost:3001` was unreachable, so no `out/` was produced.
- **Why it matters:** typecheck proves types, not that OG tags + page content actually
  land in the emitted static HTML — which is the entire point of this feature.
- **Recommended:** operator runs `cd backend; npm run dev`, then `cd frontend; npm run build`,
  then the per-ticket greps (og tags on the three pages; a known skill/project/education
  string in the respective `index.html`). This is the PLAN's stated stop-point, not a fix
  to apply — record the result before PR.
- **Ref:** PLAN testing note (lines 8-15).

### §2 — Base-URL resolution duplicated across fetchers — NICE-TO-HAVE
- **Where:** [content.ts:28,40,49,58,67](../../frontend/lib/public/content.ts#L28) — `const base = process.env.NEXT_PUBLIC_API_URL ?? "";` repeated in all five, plus the two pre-existing copies in `lib/blog/posts.ts` and `lib/daily/logs.ts` (7 total).
- **What/why:** minor repetition; a shared `apiBase()` (or a thin `fetchData<T>(path)`) helper would DRY all build fetchers.
- **Recommended:** optional extract; **note it mirrors the locked reference pattern (P3 "mirror lib/blog/posts.ts"),** so leaving it is also defensible for consistency. Low value either way.
- **Ref:** D4 / P3.

### §3 — Comment wedged inside the props type literal — NICE-TO-HAVE
- **Where:** [ProjectsClient/index.tsx:56-59](../../frontend/components/ProjectsClient/index.tsx#L56-L59) — the "skills come in UNFILTERED" note now sits between `projects:` and `skills:` inside the inline type annotation.
- **What/why:** reads slightly awkwardly (explanatory comment inside a type literal). Purely stylistic.
- **Recommended:** optionally move the note above the function or onto the `getSkills` call site. Cosmetic.

### §4 — `getAbout` throws build for data that is not indexable — NICE-TO-HAVE (observation; per locked decision)
- **Where:** [content.ts:34](../../frontend/lib/public/content.ts#L34) vs [HomeClient/index.tsx:126-135](../../frontend/components/HomeClient/index.tsx#L126-L135).
- **What:** `about` (name/email) is rendered ONLY behind the `showContactInfo` client toggle, so it never lands in the initial static HTML — yet a missing `about` doc hard-fails the whole Home build.
- **Why it matters:** it couples Home's buildability to data that contributes nothing to SEO. Not a defect — DISCUSSION §4 explicitly locked "missing about -> build fails since Home depends on name/email." Flagging only so the trade-off is conscious.
- **Recommended:** no action unless you want Home to tolerate a missing `about` (would contradict the locked edge-case decision). Leave as-is.

### §5 — Untracked `backend-dev.log` at repo root, not gitignored — OUT-OF-SCOPE
- **Where:** repo root (`git status` shows `?? backend-dev.log`); `git check-ignore` -> NOT IGNORED.
- **What/why:** a dev-backend log artifact sits untracked and un-ignored; risk of an accidental `git add`. Not part of this feature's diff.
- **Recommended:** add `*.log` (or `backend-dev.log`) to `.gitignore` in a separate chore, or delete the file. Outside SEO scope.

## 6. Open questions

1. **§1 build verification** — can you run `npm run dev` (backend) + `npm run build` (frontend) and confirm the three OG blocks and a known skill/project/education string appear in the emitted `out/**/index.html`? That is the one substantive gate I could not close.
2. **§2** — extract a shared `apiBase()`/fetch helper across blog/daily/public fetchers, or keep the mirrored per-fetcher copies for pattern consistency?
3. **§5** — want `*.log` gitignored as a quick chore on this branch, or handle separately?

## 7. Decisions log (filled during triage)

- 2026-06-22 — Triage with Bayu. §1 VERIFIED by reviewer: backend up (`/health` 200),
  `npm run build` ran; emitted HTML confirmed — distinct OG title/description/url +
  absolute `og:image` (`https://bwbayu.space/og-default.png`) + `twitter:card` on
  `index.html`/`project.html`/`resume.html`; rendered content baked in (`TypeScript` +
  `Data/AI Framework` in `index.html`, `VisiQ` in `project.html`, `Universitas
  Pendidikan Indonesia` in `resume.html`). Note: Next emits `project.html`/`resume.html`
  (trailingSlash:false), not `project/index.html` — PLAN AC path wording was off, output
  correct. All build ACs PASS.
- 2026-06-22 — §2 FIX, §5 FIX (Bayu approved). §3, §4 NO-ACTION (cosmetic / per locked
  decision D-edgecase). §1 NO-ACTION (verified pass, nothing to change).

| Finding | Severity | Triage | Note |
|---------|----------|--------|------|
| §1 build-grep unverified | SHOULD-FIX (operator gate) | NO-ACTION | Verified PASS by reviewer; nothing to change. |
| §2 base-URL duplication | NICE-TO-HAVE | **FIX** [FIXED] | `lib/apiBase.ts` added; content.ts + blog/posts.ts + daily/logs.ts use it. |
| §3 comment in type literal | NICE-TO-HAVE | NO-ACTION | Cosmetic. |
| §4 getAbout throw vs hidden data | NICE-TO-HAVE | NO-ACTION | Per locked DISCUSSION §4 edge case. |
| §5 backend-dev.log not ignored | OUT-OF-SCOPE | **FIX** [FIXED] | `*.log` added to root `.gitignore`. |

---

# Pass 2 review

Fresh-eyes re-review of the FIX delta only (not a full re-audit). Read-only.

- **Delta base:** `06c644a` (`docs: record SEO-5 commit in plan` — last commit Pass 1
  reviewed). **Range:** `06c644a..HEAD`.
- **Delta commits:**
  - `c92aa6e` refactor(frontend): extract shared `apiBase` helper for build fetchers — closes §2
  - `12f7546` chore: ignore log files — closes §5
  - `7cb47e8` docs: add seo-prerender discussion and review notes — planning docs only (excluded)
- **Verification:** `npm run typecheck` run here = **GREEN**. FE-only, no Vitest/emulator
  slice applies. No backend code touched, so no emulator gate.

## Status of previous FIX findings

| § | Verdict | Evidence |
|---|---------|----------|
| §2 base-URL duplication | **verified-fixed** | New [lib/apiBase.ts:4-6](../../frontend/lib/apiBase.ts#L4-L6) returns `process.env.NEXT_PUBLIC_API_URL ?? ""` — byte-identical to the old inline default (empty-string fallback preserved, so `/api/...` append behavior is unchanged). All 7 build-fetcher copies now call it: [content.ts:30,40,49,58,67](../../frontend/lib/public/content.ts#L30) (5), [blog/posts.ts:22](../../frontend/lib/blog/posts.ts#L22), [daily/logs.ts:15](../../frontend/lib/daily/logs.ts#L15). Grep confirms no inline `process.env.NEXT_PUBLIC_API_URL` remains in any build fetcher; the 3 surviving copies (`app/api/mediaSocials.ts`, `admin/AdminGuard.tsx`, `lib/admin/api.ts`) are RUNTIME client fetchers, outside §2's stated scope (build fetchers) — correctly untouched. Typecheck GREEN. |
| §5 backend-dev.log not ignored | **verified-fixed** | [.gitignore:11-12](../../.gitignore#L11-L12) adds a `# Logs` / `*.log` block at repo root; `git check-ignore backend-dev.log` -> match (exit 0). The artifact can no longer be accidentally `git add`-ed. |

## New findings

None. The delta is a behavior-preserving extract plus a gitignore line; both touch
exactly what §2/§5 called for and nothing adjacent. No regression, no locked-decision
violation (§2 even improves on D4/P3 by centralizing the base the locked pattern
duplicated, without changing fetch shape). No test gap: this is FE-only refactor/chore
work where `typecheck` is the established gate (CLAUDE.md: FE has no test runner), and
it is GREEN.

## Recommendation

**CLOSE.** Both triaged FIX findings are verified-fixed with file:line evidence; the fix
delta introduces no new issues and typecheck is green. §1 was already verified-PASS by
the Pass 1 reviewer (build greps confirmed OG tags + baked content in emitted HTML);
§3/§4 were NO-ACTION (cosmetic / per locked edge case). Nothing blocks close.
