# Admin CMS Scaffold (S3) — Design Discussion

> Session S3 of the feature roadmap. Implements T5 (admin = /admin route group),
> T7 (config-driven CRUD scaffold + custom widgets), and the additive slice of T8
> (GET /:id, reorder, categories CRUD, auth swap on write routes). Builds directly on
> the S2 auth foundation. The roadmap Decisions log
> ([planning/feature-roadmap/DISCUSSION.md](../feature-roadmap/DISCUSSION.md)) and the
> auth Decisions log ([planning/auth/DISCUSSION.md](../auth/DISCUSSION.md)) are LOCKED
> and must not be contradicted.

## 1. Objective

Build a working admin CMS for the personal website so Bayu can manage all content from
a UI instead of Postman/seed scripts. Concretely:
- `/admin` route group in the existing Next.js app (T5), behind the S2 Google sign-in.
- A config-driven CRUD scaffold (shared list + form driven by per-domain field config)
  plus custom widgets for complex domains (T7).
- Wire ALL existing content domains into the admin UI: about, skills, projects,
  experiences, educations, certifications, achievements, mediaSocials (+ categories).
- Additive backend endpoints where the admin needs them (T8): GET /:id (maybe),
  reorder, categories CRUD (already shipped in S1).
- Auth on write routes (x-api-key -> Firebase ID token), reusing the S2 Admin SDK.
- Robust FE handling for a signed-in-but-not-allowlisted user (BE returns 401/403):
  sign the user out and show a clear error, never a blank/broken screen.

## 2. Grounding / data flow (verified against code)

### What S2 already delivered (reused as-is by S3)
- FE: `/admin` route group exists — [layout.tsx](../../frontend/app/admin/layout.tsx)
  wraps children in `AuthProvider`; [admin/page.tsx](../../frontend/app/admin/page.tsx)
  is a throwaway "auth proof" page (skill PATCH); [admin/login/page.tsx] is the Google
  popup sign-in. `AuthContext` exposes `{ user, loading, signIn, signOut }`
  ([AuthContext.tsx](../../frontend/lib/AuthContext.tsx)). `authedFetch`
  ([authedFetch.ts](../../frontend/lib/authedFetch.ts)) attaches a fresh
  `Authorization: Bearer <idToken>`, defaults `cache: 'no-store'`, retries once on 401
  with a force-refreshed token.
- BE: combined `authMiddleware` already in place
  ([auth.middleware.ts](../../backend/src/middlewares/auth.middleware.ts)): Bearer token
  -> `verifyIdToken` + `email_verified` + `ADMIN_EMAILS` allowlist; else x-api-key
  fallback. Returns 401 (bad/expired token, missing key), 403 (not verified / not
  allowlisted / bad key), 500 (misconfigured). Sets `req.adminEmail`.
- Config: `adminEmails`, `firebaseProjectId` already parsed
  ([env.ts](../../backend/src/config/env.ts)).

### Backend domain landscape (the scaffold target)
- 9 content domains registered in [routes/index.ts](../../backend/src/routes/index.ts):
  projects, experiences, skills, categories, about, achievements, certifications,
  educations, media-socials (+ resume = read-only aggregation, NOT an admin domain).
- Per-domain CRUD shape today: `GET /` (list), `POST /` (create), `PATCH /:id`,
  `DELETE /:id`. **No `GET /:id` anywhere.** about is a singleton: `GET /` + `PATCH /:id`
  only (no create/delete).
- **DI status is mixed.** Factory-function DI (createXxxRepository/Service/Controller):
  skills, categories, projects. Still namespace imports (`* as XxxController`): about,
  experiences, educations, certifications, achievements, mediaSocials. Roadmap S3 note
  requires converting the remaining 6 to DI (for service/endpoint tests).
- ID generation differs: skills = `toSlug(name)` (slug id, `validateSlugId`); categories
  = slug; projects + experiences/educations/certifications/achievements/mediaSocials =
  `randomUUID()` (uuid id, `validateId`). The admin create form never supplies an id —
  the BE generates it.
- `order` field exists ONLY on skills (per-category) and categories (T2). Other domains
  have no `order` and are ordered by date / natural order.
- Generic [FirestoreRepository<T>](../../backend/src/shared/firestore.repository.ts) has
  `findAll`, `findAllOrdered`, `save`, `update`, `remove` — **no `findById`** yet.

### Field-type landscape across domains (drives the config scaffold)
- text: name, email, company, position, location, title, institution, etc.
- long text / textarea: description (education, project, skill single-string)
- number: order
- boolean: isShow (skills)
- date (safeDate): date, startDate, endDate, issued, expires
- url (safeUrl): url, githubUrl, youtubeUrl, iconImage
- string[]: role, category, experience.description[], achievement.descriptions[],
  achievement.githubUrl[]/resultUrl[]
- icon class string: iconClass (skills, mediaSocials)
- reference (single): skill.categoryId -> categories
- reference (multi): project.technologies -> skill IDs (T3) — needs a tech-picker widget

### Frontend read landscape (reused)
- Public read fetchers in [app/api/](../../frontend/app/api/): about, skills, projects,
  categories, mediaSocials, resume (no experiences/educations/certifications/achievements
  fetchers yet — those render via resume aggregation). Read components under
  [components/](../../frontend/components/). Admin needs its own list/edit fetchers
  (via `authedFetch` for writes; reads can stay public GET).

## 3. Key decisions (all RESOLVED — see Decisions log §5)

All eleven decisions (D1–D11) are LOCKED. Summary: D1 no auth code change; D2 no GET/:id
(reuse list); D3 per-item PATCH reorder; D4 probe-on-login for not-allowlisted; D5 URL/text
assets only; D6 four custom widgets; D7 reuse Flowbite/Tailwind; D8 DI-convert 6 domains;
D9 per-domain DomainConfig + registry; D10 BE Zod is the validation source of truth; D11
real admin shell.

### Notable scope simplification
With D1 (no auth change), D2 (no GET/:id), D3 (no bulk endpoint), and categories CRUD
already shipped in S1, the S3 **backend** work reduces to: convert the 6 namespace domains
to DI (D8) + add per-domain service/endpoint tests. There are **no new backend endpoints**
in S3 — the existing per-domain CRUD + the S2 combined auth already cover the admin needs.
The bulk of S3 is **frontend**: the config-driven scaffold, custom widgets, admin shell,
and the not-allowlisted handling.

## 4. Edge cases (collecting)
- Signed in but not allowlisted -> BE 403 on every write; FE must sign out + show a clear
  message (explicit task requirement).
- Token expired mid-session -> authedFetch already retries once on 401 with refresh.
- 404 on PATCH/DELETE (item deleted in another tab) -> surface "not found", refresh list.
- BE 400 validation error -> map message(s) back onto the form.
- about singleton: no create/delete; the id is fixed (single doc) — edit-only.
- Slug-id domains (skills/categories): renaming changes the slug? id is set at create from
  name; PATCH name does NOT move the doc id. Confirm acceptable.
- Reorder concurrency / gaps in order values (personal-scale, single writer — low risk).
- project.technologies references skill IDs; deleting a skill leaves dangling refs in
  projects (no FK in Firestore) — picker should show current skills; dangling refs render
  gracefully.

## 5. Decisions log (the contract)
- 2026-06-21 — D1 LOCKED: x-api-key "swap" = NO code change. Combined middleware stays;
  admin FE authenticates with Firebase tokens (already true since S2). x-api-key remains
  break-glass. Honors auth D2.
- 2026-06-21 — D2 LOCKED: NO `GET /:id`. Edit forms reuse the already-fetched list data;
  if an edit page is opened/refreshed directly with no list in memory, the FE fetches the
  list first then selects the item. No `findById` on the repo, no new endpoint.
- 2026-06-21 — D3 LOCKED: reorder = per-item `PATCH /:id` with an `order` number (reuse
  existing endpoint). UI = up/down or order-number field. Applies to skills (within
  category) + categories only. No bulk endpoint (parked).
- 2026-06-21 — D4 LOCKED: not-allowlisted handling = probe on login. After sign-in the
  guard makes one lightweight authed call; on 401/403 it signs the user out and shows a
  clear "not authorized" message before rendering the dashboard.
- 2026-06-21 — D5 LOCKED: assets = URL/text only. Form uses text inputs for image URLs and
  icon classes; no Firebase Storage / file upload in S3 (parked).
- 2026-06-21 — D6 LOCKED: custom widgets in scope = (a) project tech-picker (multi-select
  of skill IDs, T3); (b) skill category picker (single-select dropdown of categories);
  (c) about modeled as a singleton domain (edit-only, no list/create/delete); (d) array-of-
  strings editor (add/remove rows) for role/category/description[]/descriptions[]/url[].
- 2026-06-21 — D7 LOCKED: UI stack = reuse the existing Flowbite React + Tailwind already
  in the FE; build simple widgets manually where that is easier. Do NOT introduce a second
  UI framework (no shadcn) just for admin — keep one design system.
- 2026-06-21 — D8 LOCKED: DI conversion — convert the 6 namespace-import domains (about,
  experiences, educations, certifications, achievements, mediaSocials) to factory-function
  DI (createXxxRepository/Service/Controller) so each gets service/endpoint tests
  (roadmap S3 requirement). skills/categories/projects already DI.
- 2026-06-21 — D9 LOCKED: config-scaffold shape — per-domain `DomainConfig` (FE) declaring
  label, API path, id kind, list columns, form fields (key/type/label/required/widget),
  reorderable flag, and a `singleton` flag (about). A field-type -> input-component
  registry renders generic forms; complex fields point at a custom widget (D6). One shared
  list view + one shared form view consume the config; each domain is just a config entry
  plus any custom widget.
- 2026-06-21 — D10 LOCKED: validation — BE Zod schemas stay the single source of truth.
  FE does light required-field checks and surfaces BE 400/404/403 messages onto the form.
  No schema duplication/sharing across the FE/BE packages.
- 2026-06-21 — D11 LOCKED: admin shell — replace the throwaway S2 admin/page.tsx with a
  real shell: a sidebar/nav listing all domains, an index/dashboard, and per-domain
  list + create + edit views under `/admin/<domain>`. Reuse AuthContext guard + authedFetch
  from S2 for all admin fetches.
- 2026-06-21 — DESIGN LOCKED by Bayu. Decisions log complete (D1–D11). Ready for /wf-plan.

## 6. Parking lot / later
- Firebase Storage uploads for icons/covers (if not chosen in D5).
- Bulk reorder endpoint (if per-item PATCH chosen in D3).
- Shared FE/BE validation types (monorepo shared package) — out of scope.
- Audit log of admin writes (req.adminEmail is available) — later.
