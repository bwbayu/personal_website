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
| §2 composite index | SHOULD-FIX | **FIX** | Option A: commit `backend/firestore.indexes.json` with `(status ASC, publishedAt DESC)` + wire `firestore.indexes` into `backend/firebase.json`. Deploy `firebase deploy --only firestore:indexes` is an operator step before `develop -> main` (cannot be verified headless — emulator does not enforce indexes). |
| §3 robots trailing slash | NICE-TO-HAVE | **[FIXED] `544a375`** | Folded into the §4 helper (normalized origin). |
| §4 siteUrl dedup | NICE-TO-HAVE | **[FIXED] `544a375`** | New `lib/siteUrl.ts` exporting a normalized, empty-safe origin; layout/sitemap/robots consume it. This single change resolves §1 + §3 + §4 (one commit). |
| §5 clear optional fields | OUT-OF-SCOPE | **DEFERRED** | Pre-existing scaffold behavior across all domains; separate follow-up against the scaffold if ever wanted. |
| §6 slug race | NICE-TO-HAVE | **NO-ACTION** | Accepted by D2 + DISCUSSION §4 (single-author scale). |
| §7 excerpt hyphen strip | NICE-TO-HAVE | **FIX** | Small regex tweak in `excerptOf` (stop turning `well-known` into `well known`). |
| §8 canonical URL | NICE-TO-HAVE | **DEFERRED** | Not in any AC; optional SEO nicety for later. |

### Fix-phase commit map (for /wf-fix)
- **Commit 1 (§4 + §1 + §3) — DONE `544a375`:** add `frontend/lib/siteUrl.ts` (normalized, empty-safe origin via trim + `||`, default `https://bwbayu.space`); rewire `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts` to use it.
- **Commit 2 (§2):** add `backend/firestore.indexes.json` + wire `firestore.indexes` in `backend/firebase.json`. (Index deploy + DEPLOYMENT.md note is an operator step.)
- **Commit 3 (§7):** tweak the `excerptOf` fallback regex.
- DEFERRED/NO-ACTION: §5, §6, §8 — no code.
