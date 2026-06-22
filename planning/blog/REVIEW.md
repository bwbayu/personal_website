# Blog (S4) — Review Notes (Phase 4)

> Fresh-eyes, read-only audit. No code changed, nothing committed. Stops for triage.

## 1. Objective + scope

- **Feature slug:** `blog` (the `/wf-review` arg parsed as "blog develop"; the command
  template mis-substituted "develop" as the slug — the real slug is `blog`, base is
  `develop`). Reviewed `develop..HEAD` on `feat/blog`.
- **Base used:** `develop`.
- **Commits reviewed** (code only; doc commits omitted):
  - `e5e69c3` feat(backend): posts domain — **BLOG-1**
  - `026cf15` feat(backend): authed POST /api/rebuild — **BLOG-2**
  - `ea2c190` feat(frontend): markdown + select admin widgets — **BLOG-3**
  - `1e7ebb7` feat(frontend): wire posts into admin scaffold — **BLOG-4**
  - `064a777` feat(frontend): public blog pages + build-time markdown — **BLOG-5**
  - `50c59a6` fix(frontend): build /blog/[slug] with zero published posts — **BLOG-5 AC3**
  - `f27d989` feat(frontend): site-wide SEO plumbing — **BLOG-6**
  - `4d9bd03` feat(frontend): admin Rebuild site button — **BLOG-7**
- **Pending / not built:** none — all 7 tickets implemented.
- **Tests run by the reviewer (all green):**
  - Backend unit (`npx vitest run tests/blog`): **25 passed** (post.service, post.schema, rebuild.controller).
  - Backend emulator slice (`npm run test:emulator`, Java/Temurin 21 present): **22 passed / 8 files** — includes the posts repository + endpoint emulator tests.
  - Frontend `npm run typecheck`: clean.

## 2. Plan-conformance table

| Ticket | Status | Evidence / notes |
|--------|--------|------------------|
| BLOG-1 posts domain | **Met** | [post.repository.ts](../../backend/src/posts/post.repository.ts), [post.service.ts](../../backend/src/posts/post.service.ts), [post.controller.ts](../../backend/src/posts/post.controller.ts), [post.routes.ts](../../backend/src/posts/post.routes.ts). All 7 ACs covered by tests. Documented deviation (admin `findAll` in-memory sort) present + tested. **Caveat → §2** (prod composite index). |
| BLOG-2 POST /api/rebuild | **Met** | [rebuild.controller.ts](../../backend/src/rebuild/rebuild.controller.ts), [rebuild.routes.ts](../../backend/src/rebuild/rebuild.routes.ts). 503/502/202 + URL/headers/body all asserted in [rebuild.controller.test.ts](../../backend/tests/blog/rebuild.controller.test.ts). |
| BLOG-3 markdown + select widgets | **Met** | [MarkdownInput.tsx](../../frontend/components/admin/inputs/MarkdownInput.tsx) (`ssr:false` dynamic), [SelectInput.tsx](../../frontend/components/admin/inputs/SelectInput.tsx), registry + `defaultForType`. Typecheck green. |
| BLOG-4 admin posts integration | **Met** | `adminListPath`/`adminAuthRead` on DomainConfig, [read.ts](../../frontend/lib/admin/read.ts) read-path/key unification across list/edit/create/delete/dashboard, `listDomainAuthed`. Non-posts key strings unchanged. |
| BLOG-5 public blog pages | **Met** | [page.tsx](../../frontend/app/(public)/blog/page.tsx), [[slug]/page.tsx](../../frontend/app/(public)/blog/[slug]/page.tsx), [PostContent.tsx](../../frontend/components/blog/PostContent.tsx), [posts.ts](../../frontend/lib/blog/posts.ts), navbar link. `dynamicParams=false`, single force-cache fetch, zero-post fallback. Build verified per PLAN status. |
| BLOG-6 site-wide SEO | **Met (with §1)** | [layout.tsx](../../frontend/app/layout.tsx) metadataBase + default OG, [sitemap.ts](../../frontend/app/sitemap.ts), [robots.ts](../../frontend/app/robots.ts), og-default.png, CI env wiring. Fallback behavior on an unset secret is broken → **§1**. |
| BLOG-7 Rebuild button | **Met** | [RebuildButton.tsx](../../frontend/components/admin/RebuildButton.tsx) (confirm modal, pending guard), dashboard header + posts-only list header, shared [confirmModalTheme.ts](../../frontend/components/admin/confirmModalTheme.ts). |

## 3. Decision-conformance table (D1-D12, all LOCKED)

| # | Decision | Honored? | Evidence |
|---|----------|----------|----------|
| D1 | Markdown editor, raw markdown stored, client-only | Yes | MarkdownInput dynamic `ssr:false`; content stored as string; public render separate (D5). |
| D2 | uuid doc id + editable unique slug, findBySlug, no GET/:id | Yes | controller `randomUUID()`; `findBySlug` on insert/update; routes have no `GET /:id`. Non-atomic check → §6 (accepted). |
| D3 | Manual rebuild button → shared authed endpoint → workflow_dispatch, token BE-only | Yes | `/api/rebuild` not under `/posts`; token read from `config`; browser only calls the proxy. |
| D4 | Separate authed `/all`; public published-only; adminListPath | Yes | `GET /` published-only, `GET /all` authed; `adminListPath:'/api/posts/all'`. |
| D5 | react-markdown + remark-gfm + rehype-sanitize + rehype-highlight at build | Yes | PostContent server component; sanitize before highlight. |
| D6 | Reading time derived + stored on write | Yes | `readingTime()` on insert + on content change; FE only displays. |
| D7 | publishedAt set on first publish, never cleared, list desc | Yes | service logic + tests; `findAllPublished` orders desc. |
| D8 | Cover = safeUrl, doubles as OG | Yes | schema `cover: safeUrl.optional()`; per-post OG `images:[cover]`. |
| D9 | tags string[] + client-side filter | Yes | string-array field; tag filter in BlogListClient. |
| D10 | markdown+select field types, slug=text, posts config + Blog nav | Yes | FieldType union extended; posts DomainConfig; `navGroups` Blog group + exhaustiveness guard. |
| D11 | Single force-cache build fetch reused by 3 consumers; dynamicParams=false; navbar link | Yes | `getPublishedPosts` force-cache; reused by params/list/[slug]/sitemap; navbar Blog link. |
| D12 | Optional excerpt + ~160-char fallback | Yes | `excerptOf()`; used for card text + meta/OG description. |

## 4. Edge-case checklist

| Case | Result |
|------|--------|
| Zero published posts → build succeeds | OK — `EMPTY_FALLBACK_SLUG` + empty state (BLOG-5 AC3, verified). |
| Draft never reachable publicly (API/page/direct URL) | OK — `where status==published`; build uses public route; `dynamicParams=false` 404. Emulator test confirms. |
| Slug uniqueness (insert + update, self-slug allowed) | OK functionally — non-atomic check → §6 (accepted by D2). |
| publishedAt set-once / never-clear | OK — unit tests cover all three transitions. |
| readingTime re-derive only on content change | OK — unit test. |
| Server-managed fields (id/publishedAt/readingTime) not injectable | OK — Zod strips + service derives; schema + service tests. |
| Rebuild unconfigured → 503; non-204 → 502; token not in browser; no double-fire | OK — controller + RebuildButton pending guard. |
| Auth gate on `/all` + writes (401/403) | OK — emulator endpoint test. |
| Empty/over-long content, non-http cover rejected | OK — schema test. |
| Markdown XSS sanitized | OK — rehype-sanitize before highlight (PLAN verified script/onerror stripped). |
| **Prod composite index for published query** | **MISSING → §2.** |
| **Site URL secret unset in CI → graceful fallback** | **BROKEN → §1.** |
| Trailing slash in site URL (robots) | Minor → §3. |
| Clearing an optional field (excerpt/cover) via admin | Pre-existing limitation → §5. |

## 5. Findings

### §1 — `NEXT_PUBLIC_SITE_URL` unset in CI crashes the build (`??` + empty string + `new URL`)
- **Severity:** SHOULD-FIX (deploy-gating)
- **Where:** [layout.tsx:12,17](../../frontend/app/layout.tsx#L12), [sitemap.ts:9](../../frontend/app/sitemap.ts#L9), [robots.ts:3](../../frontend/app/robots.ts#L3)
- **What:** All three read `process.env.NEXT_PUBLIC_SITE_URL ?? "<default>"`. CI now sets
  `NEXT_PUBLIC_SITE_URL: ${{ secrets.NEXT_PUBLIC_SITE_URL }}`. If that secret is **unset**,
  GitHub Actions sets the env var to an **empty string**, not undefined. `?? ` does not
  treat `""` as absent, so `siteUrl` becomes `""` and `metadataBase: new URL("")` **throws
  `TypeError: Invalid URL`**, failing the static export build. Verified locally:
  `new URL("")` throws; `"" ?? "d"` → `""`; `"" || "d"` → `"d"`.
- **Why it matters:** BLOG-6's own status note says an unset secret should "fall back to
  the default." It does NOT — it crashes the build. The action item ("set the
  `NEXT_PUBLIC_SITE_URL` GitHub secret") becomes a hard requirement with a confusing
  failure mode instead of a safe default. sitemap/robots wouldn't crash but would emit a
  broken empty base.
- **Recommended fix:** Use `|| "<default>"` (or an explicit `?.trim() ? ... : default`)
  so an empty string also falls back. Best done once in a shared helper (see §4).
- **Ref:** BLOG-6.

### §2 — Published-only query needs a Firestore composite index that the repo/deploy does not provide
- **Severity:** SHOULD-FIX (deploy-gating)
- **Where:** [post.repository.ts:13](../../backend/src/posts/post.repository.ts#L13) →
  [firestore.repository.ts:28-40](../../backend/src/shared/firestore.repository.ts#L28)
- **What:** `findAllPublished` runs `where('status','==','published').orderBy('publishedAt','desc')`.
  This is the **first** equality-filter + orderBy-on-a-different-field query in the codebase
  (every other domain uses single-field `findAllOrdered`, which auto-indexes). Firestore
  native mode **requires a composite index** `(status ASC, publishedAt DESC)` for this query.
  The emulator does **not** enforce indexes, so the emulator slice is green while prod will
  return `FAILED_PRECONDITION: The query requires an index` on the first `GET /api/posts`.
  There is no `firestore.indexes.json` in the repo, [backend/firebase.json](../../backend/firebase.json)
  only deploys `firestore.rules` (no `indexes`), and DEPLOYMENT.md is silent.
- **Why it matters:** The public `GET /api/posts` is exactly what the FE static build fetches
  (`getPublishedPosts`), so a missing index breaks **both** the public API **and** the
  production frontend build/deploy — not just a runtime edge. PLAN BLOG-1 + cross-cutting
  notes flagged "needs a composite index in prod… note any index in the commit / for the
  deploy," but no index artifact or deploy note was added.
- **Recommended fix (pick one):** (a) commit a `firestore.indexes.json` with the
  `status`/`publishedAt` composite, wire `firestore.indexes` into `backend/firebase.json`,
  and add an index-deploy step; or (b) at minimum, document a one-time manual index
  creation (console/`gcloud`) in DEPLOYMENT.md and create it before the `develop -> main`
  deploy.
- **Ref:** BLOG-1, cross-cutting notes.

### §3 — `robots.ts` does not strip a trailing slash from the site URL (sitemap does)
- **Severity:** NICE-TO-HAVE
- **Where:** [robots.ts:3,10](../../frontend/app/robots.ts#L3) vs [sitemap.ts:10](../../frontend/app/sitemap.ts#L10)
- **What:** sitemap normalizes with `siteUrl.replace(/\/$/, "")`; robots uses `siteUrl`
  raw, so a `NEXT_PUBLIC_SITE_URL` ending in `/` yields `https://site//sitemap.xml`.
- **Why it matters:** Cosmetic/robustness; the default has no trailing slash so it doesn't
  bite today, but it's an inconsistency waiting for a mis-set secret.
- **Recommended fix:** Mirror the trailing-slash strip (and fold into the §4 helper).
- **Ref:** BLOG-6.

### §4 — Duplicated site-URL default literal across three files (reuse smell)
- **Severity:** NICE-TO-HAVE
- **Where:** [layout.tsx:12](../../frontend/app/layout.tsx#L12), [sitemap.ts:9](../../frontend/app/sitemap.ts#L9), [robots.ts:3](../../frontend/app/robots.ts#L3)
- **What:** The same `process.env.NEXT_PUBLIC_SITE_URL ?? "https://personal-website-490704.web.app"`
  literal is repeated three times.
- **Why it matters:** A future domain change must touch three files; and §1/§3 both stem
  from this duplication.
- **Recommended fix:** A single `lib/siteUrl.ts` (`getSiteUrl()` returning a normalized,
  empty-safe origin) consumed by all three — resolves §1, §3, §4 at once.
- **Ref:** BLOG-6.

### §5 — Optional string fields (excerpt, cover) can't be cleared via the admin form
- **Severity:** OUT-OF-SCOPE (pre-existing scaffold behavior; note only)
- **Where:** [DomainFormPage.tsx:64-79](../../frontend/components/admin/DomainFormPage.tsx#L64) (`buildPayload`)
- **What:** `buildPayload` omits empty strings, so editing a post to blank its excerpt or
  cover leaves the previous value untouched (the field is simply not sent, so the PATCH
  doesn't unset it). `tags` (an array) can be cleared because arrays are always sent.
- **Why it matters:** For blog posts, removing an excerpt/cover is a plausible edit; today
  it silently no-ops. This is generic scaffold behavior shared by all domains, not
  blog-specific, hence out of scope — flagged for awareness.
- **Recommended fix (if ever wanted):** A scaffold-level convention to send `null`/`""`
  for intentionally-cleared optional fields — separate effort.

### §6 — Slug uniqueness is check-then-act (non-atomic)
- **Severity:** NICE-TO-HAVE (accepted by D2 + DISCUSSION §4)
- **Where:** [post.service.ts:19-20,35-37](../../backend/src/posts/post.service.ts#L19)
- **What:** `findBySlug` then `save`/`update` is not transactional; two concurrent inserts
  with the same slug could both pass the check.
- **Why it matters:** Firestore has no unique constraint; D2 explicitly chose findBySlug
  over slug-as-id. At single-author scale the race is effectively impossible and accepted.
- **Recommended fix:** None now (accepted). Could wrap in a transaction later if multi-author.

### §7 — `excerptOf` fallback strips hyphens from words
- **Severity:** NICE-TO-HAVE
- **Where:** [posts.ts:40](../../frontend/lib/blog/posts.ts#L40)
- **What:** `.replace(/[#>*_~`-]/g, " ")` turns `well-known` into `well known` in the
  derived excerpt (only when no explicit excerpt is set).
- **Why it matters:** Purely cosmetic on auto-derived card/meta text.
- **Recommended fix:** Drop `-` from the leftover-punctuation class, or strip line-leading
  list markers more narrowly.

### §8 — Blog pages set no canonical / `openGraph.url`
- **Severity:** NICE-TO-HAVE
- **Where:** [[slug]/page.tsx:32-48](../../frontend/app/(public)/blog/[slug]/page.tsx#L32), [blog/page.tsx:5-8](../../frontend/app/(public)/blog/page.tsx#L5)
- **What:** Per-post and list metadata omit `alternates.canonical` / `openGraph.url`.
  metadataBase is set so relative OG images resolve, but no canonical URL is emitted.
- **Why it matters:** Minor SEO nicety for a SEO-motivated feature; not in any AC.
- **Recommended fix:** Add `alternates: { canonical: "/blog/<slug>" }` (resolves via
  metadataBase) if desired.

## 6. Open questions for discussion

1. **§2 (index):** prefer a committed `firestore.indexes.json` + deploy step, or a manual
   one-time index documented in DEPLOYMENT.md created before `develop -> main`? This is the
   single biggest ship risk — the prod FE build fetches `/api/posts`.
2. **§1 (site URL):** switch `??` → `||` (or a shared empty-safe helper)? Confirm whether the
   `NEXT_PUBLIC_SITE_URL` GitHub secret is actually set today — if it is, the crash is latent,
   not active, but the fix is still cheap and correct.
3. **§4:** want the shared `lib/siteUrl.ts` helper (folds in §1 + §3), or keep the three
   inline copies and just fix §1 in place?
4. **§5:** accept the "can't clear excerpt/cover" limitation for now (out of scope), or open
   a follow-up against the scaffold?

## 7. Decisions log (triaged WITH the user 2026-06-22)

| Finding | Severity | Triage | Notes |
|---------|----------|--------|-------|
| §1 site URL fallback | SHOULD-FIX | **[FIXED] `544a375`** | Resolved via the §4 shared helper (empty-safe `||`). Operator action DONE: `NEXT_PUBLIC_SITE_URL` GitHub secret set to the custom domain `https://bwbayu.space`. The hardcoded fallback default (currently `https://personal-website-490704.web.app`) is to be updated to `https://bwbayu.space` in the §4 helper so the canonical/sitemap/OG/fallback all use the custom domain. |
| §2 composite index | SHOULD-FIX | **[FIXED] `0842f7a`** | Option A: commit `backend/firestore.indexes.json` with `(status ASC, publishedAt DESC)` + wire `firestore.indexes` into `backend/firebase.json`. Deploy `firebase deploy --only firestore:indexes` is an operator step before `develop -> main` (cannot be verified headless — emulator does not enforce indexes). **OPERATOR ACTION STILL OUTSTANDING.** |
| §3 robots trailing slash | NICE-TO-HAVE | **[FIXED] `544a375`** | Folded into the §4 helper (normalized origin). |
| §4 siteUrl dedup | NICE-TO-HAVE | **[FIXED] `544a375`** | New `lib/siteUrl.ts` exporting a normalized, empty-safe origin; layout/sitemap/robots consume it. This single change resolves §1 + §3 + §4 (one commit). |
| §5 clear optional fields | OUT-OF-SCOPE | **DEFERRED** | Pre-existing scaffold behavior across all domains; separate follow-up against the scaffold if ever wanted. |
| §6 slug race | NICE-TO-HAVE | **NO-ACTION** | Accepted by D2 + DISCUSSION §4 (single-author scale). |
| §7 excerpt hyphen strip | NICE-TO-HAVE | **[FIXED] `5f94fd7`** | Small regex tweak in `excerptOf` (stop turning `well-known` into `well known`); line-leading list markers now stripped separately so bullets are still removed. |
| §8 canonical URL | NICE-TO-HAVE | **DEFERRED** | Not in any AC; optional SEO nicety for later. |

### Fix-phase commit map (for /wf-fix)
- **Commit 1 (§4 + §1 + §3) — DONE `544a375`:** add `frontend/lib/siteUrl.ts` (normalized, empty-safe origin via trim + `||`, default `https://bwbayu.space`); rewire `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts` to use it.
- **Commit 2 (§2) — DONE `0842f7a`:** add `backend/firestore.indexes.json` + wire `firestore.indexes` in `backend/firebase.json`. (Index deploy `firebase deploy --only firestore:indexes` is an OPERATOR step before `develop -> main`.)
- **Commit 3 (§7) — DONE `5f94fd7`:** tweak the `excerptOf` fallback regex.
- DEFERRED/NO-ACTION: §5, §6, §8 — no code.

---

# Pass 2 review (re-review)

> Fresh-eyes verification of the Pass 1 fixes + delta-only review. No code changed,
> nothing committed. Delta base = `1b69f2e` (last commit Pass 1 reviewed).

## Scope of the delta

Fix commits in `1b69f2e..HEAD` (code only; doc commits omitted):
- `544a375` fix(frontend): resolve canonical site URL via shared empty-safe helper — **§1 + §3 + §4**
- `0842f7a` chore(backend): add posts published-query composite index — **§2**
- `5f94fd7` fix(frontend): keep intra-word hyphens in derived post excerpts — **§7**

Diff touched 6 source files: `frontend/lib/siteUrl.ts` (new), `frontend/app/layout.tsx`,
`frontend/app/sitemap.ts`, `frontend/app/robots.ts`, `frontend/lib/blog/posts.ts`,
`backend/firestore.indexes.json` (new) + `backend/firebase.json`. No backend TS changed.

**Gates run by the re-reviewer (all green):**
- Frontend `npm run typecheck` (the FE gate — no FE test runner exists): **clean**.
- Backend unit `npx vitest run tests/blog`: **25 passed / 3 files**.
- Backend emulator slice `npm run test:emulator` (Temurin 21 present): **22 passed / 8 files**.

## Status of previous FIX findings

| § | Finding | Fix commit | Verdict | Evidence |
|---|---------|-----------|---------|----------|
| §1 | `NEXT_PUBLIC_SITE_URL` unset → `new URL("")` crash | `544a375` | **verified-fixed** | [siteUrl.ts:13](../../frontend/lib/siteUrl.ts#L13) `(env ?? "").trim() || DEFAULT` — empty string now falls through `||` to the default, so `metadataBase: new URL(getSiteUrl())` never receives `""`. Default updated to `https://bwbayu.space` as the decisions log required. All 3 call sites ([layout.tsx:13](../../frontend/app/layout.tsx#L13), [sitemap.ts:10](../../frontend/app/sitemap.ts#L10), [robots.ts:5](../../frontend/app/robots.ts#L5)) route through it; grep confirms no remaining raw `process.env.NEXT_PUBLIC_SITE_URL` reads. |
| §2 | Published query needs a composite index | `0842f7a` | **verified-fixed (code)** — operator deploy outstanding | [firestore.indexes.json](../../backend/firestore.indexes.json) declares `posts` / COLLECTION / `status ASC, publishedAt DESC` — an exact match for `findByFieldOrdered('status','published','publishedAt','desc')` → `.where('status','==','published').orderBy('publishedAt','desc')` ([post.repository.ts:13](../../backend/src/posts/post.repository.ts#L13) → [firestore.repository.ts:34-38](../../backend/src/shared/firestore.repository.ts#L34)). `backend/firebase.json` wires `firestore.indexes`. The actual `firebase deploy --only firestore:indexes` is a human/operator step (emulator does not enforce indexes, so it cannot be verified headless) — already tracked as OUTSTANDING in the decisions log; not a code defect. |
| §3 | `robots.ts` keeps a trailing slash | `544a375` | **verified-fixed** | robots now consumes `getSiteUrl()`, which strips the trailing slash (`raw.replace(/\/$/, "")`), so `${siteUrl}/sitemap.xml` no longer doubles. |
| §4 | Site-URL default duplicated ×3 | `544a375` | **verified-fixed** | Single source [siteUrl.ts](../../frontend/lib/siteUrl.ts); the inline literals are gone from all three files. |
| §7 | `excerptOf` strips intra-word hyphens | `5f94fd7` | **verified-fixed** | [posts.ts:40-41](../../frontend/lib/blog/posts.ts#L40): `-` dropped from the leftover-punctuation class; line-leading list markers stripped separately (`^\s*[-*+]\s+`). `well-known` is preserved; bullet markers are still removed. |

DEFERRED / NO-ACTION findings (§5, §6, §8) correctly received no code in the delta.

## New findings

Numbering continues after the highest existing § (last was §8).

### §9 — `---` horizontal rules survive in the derived excerpt (REFERENCES §7)
- **Severity:** NICE-TO-HAVE (informational; recommend NO-ACTION)
- **Where:** [posts.ts:40-41](../../frontend/lib/blog/posts.ts#L40)
- **What:** Dropping `-` from the leftover-punctuation class to fix §7 means a literal
  `---` horizontal rule is no longer collapsed to spaces (the list-marker regex
  `^\s*[-*+]\s+` requires whitespace after the marker, so `---` does not match it). The
  other HR forms (`***`, `___`) are still stripped because `*`/`_` remain in the
  punctuation class. This only affects the auto-derived fallback excerpt (no explicit
  excerpt set) and only when an HR lands in the first ~160 chars.
- **Why it matters:** Purely cosmetic, strictly narrower than the §7 problem it replaced,
  and an accepted consequence of §7's intent (keep real hyphens). The inverse case — a
  prose dash like ` - ` now surviving — is actually correct text.
- **Recommended fix:** None. If ever wanted, add `^\s*([-*_])\1{2,}\s*$` HR stripping
  before the list-marker pass. Not FIX-worthy.

### §10 — Code fixes shipped without an automated test (expected, not a defect)
- **Severity:** OBSERVATION (no action)
- **What:** None of the four code fixes added a test: §1/§3/§4/§7 are frontend (and
  `getSiteUrl`/`excerptOf` are pure, testable functions) but the repo has **no FE test
  runner** by design (CLAUDE.md: "Frontend: typecheck only"); §2 is a JSON index artifact
  that the **emulator cannot enforce**, so it is not unit/emulator-testable either.
- **Why it matters:** Per re-review checklist item C I flag "fixed without a test"
  transparently — but here it is a direct consequence of the project's locked testing
  conventions, not a gap introduced by these fixes. Verification rests on `npm run
  typecheck` (green) + the index-vs-query match above. No action.

### §11 — Posts + rebuild endpoints missing from the Swagger spec (user-surfaced; outside the fix delta)
- **Severity:** SHOULD-FIX (API-doc parity) — non-blocking for correctness/deploy
- **Status:** **[FIXED] `c1dd768`** — `Post` schema + `/api/posts` (get + post), `/api/posts/all` (get), `/api/posts/{id}` (patch + delete), `/api/rebuild` (post) added to the static spec. Full posts-domain parity (all 5 routes) per user decision to include `POST /api/posts`.
- **Provenance:** NOT in the fix delta (`1b69f2e..HEAD`). Pre-existing omission from the
  original **BLOG-1** (posts domain) + **BLOG-2** (rebuild) implementation that Pass 1
  (Phase 4) did not catch. Surfaced by the user during re-review.
- **Where:** [swagger.ts](../../backend/src/config/swagger.ts) — the hand-written static
  spec. No `Post` schema in `components.schemas`; no `/api/posts`, `/api/posts/all`,
  `/api/posts/{id}`, or `/api/rebuild` entries in `paths` (grep nihil).
- **What:** Swagger is a static object that documents all 9 existing domains. The new posts
  domain (`GET /`, `GET /all`, `POST /`, `PATCH /:id`, `DELETE /:id` — [post.routes.ts](../../backend/src/posts/post.routes.ts))
  and `POST /api/rebuild` ([rebuild.routes.ts](../../backend/src/rebuild/rebuild.routes.ts))
  are absent, so `/api-docs` (non-prod) is out of parity with the codebase.
- **Why it matters:** Every other domain is documented; an undocumented new domain breaks
  the established "adding a domain documents it" convention. Swagger is **non-prod only**
  (mounted off in prod), so there is **no runtime or security impact** — purely doc
  completeness/parity.
- **Recommended fix:** Add a `Post` schema to `components.schemas` and path entries for
  `/api/posts` (get), `/api/posts/all` (get, `ApiKeyAuth`), `/api/posts/{id}` (patch +
  delete, `ApiKeyAuth`), and `/api/rebuild` (post, `ApiKeyAuth`), mirroring the
  achievements pattern. Small + mechanical; a `docs(backend)` commit on `feat/blog`.
- **Ref:** BLOG-1, BLOG-2 (original implementation) — not the fix delta.

### §12 — `PATCH /api/skills/reorder` + `PATCH /api/categories/reorder` missing from the Swagger spec (full-audit follow-up; unrelated to blog)
- **Severity:** NICE-TO-HAVE (API-doc parity) — non-blocking
- **Status:** **[FIXED] `c1dd768`** — `/api/skills/reorder` + `/api/categories/reorder` (patch, `ApiKeyAuth`, requestBody = reorder array) added to the static spec.
- **Provenance:** Entirely unrelated to blog. Pre-existing omission in the **skills** +
  **categories** domains, found during a full route-vs-swagger audit the user requested
  while triaging §11. Bundled here only so one `docs(backend)` swagger commit closes every
  gap at once.
- **Where:** [swagger.ts](../../backend/src/config/swagger.ts) documents `/api/skills`,
  `/api/skills/{id}`, `/api/categories`, `/api/categories/{id}` — but NOT the literal
  `/reorder` PATCH on each ([skill.routes.ts:21](../../backend/src/skills/skill.routes.ts#L21),
  [category.routes.ts:21](../../backend/src/categories/category.routes.ts#L21)).
- **What:** Both domains expose `PATCH /reorder` (authed; body = reorder array) for
  drag-reorder. Neither path is in the spec.
- **Why it matters:** Same parity rationale as §11; non-prod, no runtime/security impact.
- **Recommended fix:** Add `/api/skills/reorder` and `/api/categories/reorder` (patch,
  `ApiKeyAuth`, requestBody = reorder array). Bundle with §11 in the same `docs(backend)`
  swagger commit.
- **Ref:** skills + categories domains (pre-existing) — not blog, not the fix delta.

#### Swagger audit result (full route-vs-spec sweep)
Every registered route was checked against `swagger.ts`. The ONLY undocumented endpoints
are: the entire **posts** domain (5 routes) + **`POST /api/rebuild`** (§11), and
**`PATCH /api/skills/reorder`** + **`PATCH /api/categories/reorder`** (§12). All other
domains (about, projects, experiences, educations, certifications, achievements,
media-socials, resume, and the base skills/categories CRUD) are fully documented.

## Recommendation

**CLOSE.** All five Pass 1 FIX findings (§1, §2, §3, §4, §7) are verified-fixed against
their stated problems, with file:line evidence. The delta introduced no regression and no
new FIX-worthy finding (§9 is a strictly-narrower cosmetic trade-off that was §7's intent;
§10 is an expected consequence of the locked "FE typecheck only" convention). All three
gates are green (FE typecheck, backend unit, emulator slice).

**One residual non-code item blocks the prod deploy, not the review:** the §2 composite
index must be deployed (`firebase deploy --only firestore:indexes`) **before** the
`develop -> main` deploy — the prod FE static build fetches `/api/posts`, which will return
`FAILED_PRECONDITION` until the index exists. This is a human/operator step already tracked
in the decisions log; it cannot be verified headless and is not a code change.

**Addendum (post-recommendation, user-surfaced): §11 + §12.** A real API-doc parity gap
surfaced during re-review and a follow-up full route-vs-swagger audit: the new posts/rebuild
endpoints (§11) AND the pre-existing `skills/reorder` + `categories/reorder` endpoints (§12)
are absent from the Swagger spec. All are OUTSIDE the fix delta, non-prod, and non-blocking
for correctness or deploy, so the CLOSE of the fix-verification stands. They are genuine
completeness gaps. **Triage decision (user, 2026-06-22): DEFER to `/wf-fix`** — close §11 +
§12 together in one `docs(backend)` swagger commit on `feat/blog` (add `Post` schema +
posts/rebuild paths + the two reorder paths) before S4 is considered fully done. The audit
confirms these four are the ONLY undocumented routes.

**Closed (`/wf-fix`, 2026-06-22): [FIXED] `c1dd768`.** One `docs(backend)` commit edited
`backend/src/config/swagger.ts` only: added the `Post` schema to `components.schemas` and
path entries for `/api/posts` (get + post), `/api/posts/all` (get), `/api/posts/{id}`
(patch + delete), `/api/rebuild` (post), `/api/skills/reorder` (patch), and
`/api/categories/reorder` (patch). The user chose **full posts-domain parity**, so
`POST /api/posts` (create) was included even though the §11 fix list omitted it — closing
the last undocumented posts route. Verified: `npx vitest run tests/blog` 25/25 green; `tsc`
clean (spec is valid TS/JSON). No route/runtime change. The Swagger audit gap is now
fully closed.

---

# Pass 3 review (re-review)

> Fresh-eyes verification of the §11 + §12 Swagger fix + delta-only review. No code
> changed, nothing committed. Delta base = `9bb7ca1` (last commit Pass 2 reviewed before
> the swagger fix).

## Scope of the delta

Commits in `9bb7ca1..HEAD`:
- `c1dd768` docs(backend): document posts, rebuild, and reorder endpoints in swagger — **§11 + §12** (the only source change)
- `c4c7f79` docs: mark blog review findings 11/12 fixed — REVIEW.md bookkeeping only (no source)

Diff touched 1 source file: `backend/src/config/swagger.ts` (+122, additive only — a new
`Post` schema in `components.schemas` and six new path entries). No routes, controllers,
services, schemas, or runtime wiring changed.

**Gates run by the re-reviewer (all green):**
- Backend `npx tsc --noEmit`: **clean** — the static spec is valid TS/JSON and compiles.
- Backend unit `npx vitest run tests/blog`: **25 passed / 3 files**.
- Emulator slice **not re-run**: the delta touches zero Firestore code (no repository,
  domain query, or endpoint changed) — a pure non-prod doc object. Pass 2 already ran it
  green (22/8) over the last Firestore-touching delta; nothing in `9bb7ca1..HEAD` can move
  that result.

## Status of previous FIX findings

| § | Finding | Fix commit | Verdict | Evidence |
|---|---------|-----------|---------|----------|
| §11 | Posts + rebuild endpoints absent from Swagger | `c1dd768` | **verified-fixed** | All five posts routes ([post.routes.ts:19-23](../../backend/src/posts/post.routes.ts#L19)) are now documented: `GET /api/posts` ([swagger.ts:440](../../backend/src/config/swagger.ts#L440), public — no `ApiKeyAuth`, matching the public read), `POST /api/posts` (ApiKeyAuth, `Post` body, 201), `GET /api/posts/all` ([swagger.ts:458](../../backend/src/config/swagger.ts#L458), ApiKeyAuth), `PATCH`+`DELETE /api/posts/{id}` ([swagger.ts:468](../../backend/src/config/swagger.ts#L468), ApiKeyAuth, id path param, 200). `POST /api/rebuild` ([swagger.ts:528](../../backend/src/config/swagger.ts#L528)) is ApiKeyAuth with a **202** response — an exact match for the controller's `sendSuccess(res, null, 202)` ([rebuild.controller.ts:36](../../backend/src/rebuild/rebuild.controller.ts#L36)). New `Post` schema ([swagger.ts:91](../../backend/src/config/swagger.ts#L91)) covers all entity fields incl. `status` enum `['draft','published']`. |
| §12 | `skills/reorder` + `categories/reorder` absent from Swagger | `c1dd768` | **verified-fixed** | `PATCH /api/skills/reorder` ([swagger.ts:565](../../backend/src/config/swagger.ts#L565)) and `PATCH /api/categories/reorder` ([swagger.ts:239](../../backend/src/config/swagger.ts#L239)) both documented: ApiKeyAuth + requestBody = bare array of `{ id, order }` — a faithful match for [reorder.schema.ts:6-18](../../backend/src/shared/reorder.schema.ts#L6) (`z.array({ id: string, order: int })`). Both are placed before their `/{id}` sibling, mirroring the real route order. |

Spec-vs-route sweep re-run: a grep for the six paths returns all six present
([categories/reorder, posts, posts/all, posts/{id}, rebuild, skills/reorder]). No remaining
undocumented route. The §11/§12 addendum's "these four [paths] are the ONLY undocumented
routes" claim holds, and the chosen full posts-domain parity adds `POST /api/posts` on top.

DEFERRED / NO-ACTION findings (§5, §6, §8) correctly received no code in the delta.

## New findings

Numbering continues after the highest existing § (last was §12).

### §13 — `Post` schema reused as create/update requestBody advertises server-managed fields (matches existing convention)
- **Severity:** OBSERVATION (no action)
- **Where:** [swagger.ts:451,474](../../backend/src/config/swagger.ts#L451) (`POST`/`PATCH` requestBody `$ref: Post`)
- **What:** The `Post` schema includes the server-managed `id`, `publishedAt`, and
  `readingTime`, and is referenced verbatim as the requestBody for both create and update —
  so the spec nominally suggests a client may send those, whereas the Zod insert/update
  schemas deliberately omit them ([post.schema.ts:4-22](../../backend/src/posts/post.schema.ts#L4)).
- **Why it matters:** It does not: this is the **exact** established pattern for every
  existing domain — e.g. `POST`/`PATCH /api/projects` also `$ref` the full `Project`
  entity (incl. `id`) as their requestBody ([swagger.ts:501,513](../../backend/src/config/swagger.ts#L501)).
  §11's recommendation was explicitly to mirror that pattern, and it does. Flagging only so
  a reader doesn't mistake the consistency for an oversight. No action — changing it would
  diverge the new entries from the other 9 domains.

### §14 — Swagger doc fix shipped without an automated test (expected, not a defect)
- **Severity:** OBSERVATION (no action)
- **What:** `c1dd768` added no test. The change is a hand-written static OpenAPI object
  mounted at `/api-docs` **non-prod only** (off in prod per [app.ts] wiring); there is no
  contract/spec test harness in the repo, and the spec asserts nothing at runtime.
- **Why it matters:** Per re-review checklist item C I flag "fixed without a test"
  transparently — but verification here rests on `tsc` (valid TS/JSON, green) + the
  manual route-vs-spec sweep above, which is the only available form of verification for a
  static doc object. Consistent with §10's reasoning for the earlier FE/index fixes. No
  action.

## Recommendation

**CLOSE.** Both Pass 2 addendum FIX findings (§11, §12) are verified-fixed against their
stated problems with file:line evidence, the six previously-undocumented paths are all
present, and each entry faithfully matches its route's auth, params, request body, and
status code (notably `/api/rebuild` 202 and the reorder array body). The delta is purely
additive to a non-prod static doc object: no regression, no new FIX-worthy finding (§13 is
a deliberate match to the existing convention; §14 is the expected "no test harness for a
static spec"). Gates green: backend `tsc` clean, blog unit 25/25.

**Unchanged residual operator item (not a code/review blocker):** the §2 composite index
still must be deployed (`firebase deploy --only firestore:indexes`) **before** the
`develop -> main` deploy — the prod FE static build fetches `/api/posts`, which returns
`FAILED_PRECONDITION` until the index exists. Tracked in the decisions log; it is a
human/operator step, unaffected by this delta.

The blog (S4) review loop is now fully closed across Pass 1 → Pass 3.
