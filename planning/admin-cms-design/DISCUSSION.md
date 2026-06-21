# Admin CMS — Visual / UX Design (S3.1) — Design Discussion

> Sub-session of S3. Scope = the **visual + UX design** of the admin area only. The
> functional/architecture design is already LOCKED in
> [planning/admin-cms/DISCUSSION.md](../admin-cms/DISCUSSION.md) (D1–D11) and is the
> contract this design dresses up — do NOT re-open it. In particular D7 (reuse Flowbite
> React + Tailwind, no second UI framework), D11 (real admin shell: sidebar nav +
> list/create/edit per domain), D6 (custom widgets), D4 (probe-on-login not-allowlisted
> screen) constrain this design.

## 1. Objective

Define how the admin area looks and feels so /wf-plan + /wf-implement have a concrete UI
target. Decided up front: discuss here (not an external design tool) and **match the
existing public site** — dark theme, Flowbite, Tailwind. This doc covers shell/layout,
navigation, list views, form views, the dashboard, feedback patterns, and the error/empty
states — all grounded in the components already in the repo.

## 2. Grounding (verified against code)

### Existing visual language (reuse this)
- Dark theme: `bg-gray-900` page background, `text-white` / `text-gray-100` headings,
  `text-gray-400` muted; navbar is `bg-gray-800`
  ([NavbarClient.tsx:22](../../frontend/components/CustomNavbar/NavbarClient.tsx#L22)).
- Accent: `blue-500` (links/hover), `blue-600` buttons (see admin proof page).
- Components: Flowbite React (`Navbar`, `Accordion`, `Tooltip`, ...) +
  [tailwind.config.ts](../../frontend/tailwind.config.ts) with custom fade-in animations;
  `darkMode: 'media'` (follows OS); font = Inter ([layout.tsx](../../frontend/app/layout.tsx)).
- Icons: `react-icons` + `devicon` (skill/social icon classes).
- Shared states already exist: [Loading.tsx](../../frontend/components/Loading.tsx),
  [ErrorMessage.tsx](../../frontend/components/ErrorMessage.tsx) — reuse/adapt for admin.

### The chrome problem (load-bearing)
- The root layout ALWAYS renders the public `CustomNavbar` (brand "bwbayu", Resume/Project
  + social links) and `CustomFooter` around every page, including `/admin`
  ([layout.tsx:28-32](../../frontend/app/layout.tsx#L28-L32)). The admin must NOT show the
  public marketing nav/footer. Needs its own chrome — see Decision 1.

### What the shell wraps (from the locked functional design)
- Domains to surface in nav (D11): about (singleton), skills, categories, projects,
  experiences, educations, certifications, achievements, mediaSocials. (resume = read-only
  aggregation, NOT in admin.)
- Reorderable in list view (D3): skills (within a category) + categories.
- Custom widgets in forms (D6): project tech-picker, skill category dropdown, about
  singleton form, array-of-strings editor.
- Auth chrome: signed-in email + sign-out (from `AuthContext`); probe-on-login gate (D4).

## 3. Key decisions (all RESOLVED — see Decisions log §6)

All six design decisions are LOCKED: DD1 route-group chrome; DD2 grouped sidebar; DD3
dashboard cards + counts; DD4 toast + confirm-modal feedback; DD5 layered dark palette;
DD6 desktop-first responsive.

## 4. Proposed layout (concrete, for reference while deciding)

```
+----------------------------------------------------------+
| Topbar:  Bayu Admin            signed in as <email> [out] |  gray-800
+--------------+-------------------------------------------+
| Sidebar      |  Content area (gray-900)                   |
| (gray-800)   |                                            |
|  Dashboard   |  <Page title>            [ + New ]         |
|  About       |  +--------------------------------------+  |
|  Skills      |  | Table / Form (gray-800 card)         |  |
|  Categories  |  |  ...                                   |  |
|  Projects    |  +--------------------------------------+  |
|  Experiences |                                            |
|  Educations  |                                            |
|  Certs       |                                            |
|  Achievements|                                            |
|  Socials     |                                            |
+--------------+-------------------------------------------+
```
- **List view**: page title + "New" button; Flowbite `Table` (zebra/hover rows) with a few
  key columns per domain (from `DomainConfig.listColumns`) + an actions cell (Edit /
  Delete); reorder up/down controls for skills/categories; empty + loading + error states.
- **Form view (create/edit)**: single-column card, labeled fields rendered by the
  field-type registry, custom widgets inline, Save (blue-600) + Cancel; inline validation
  errors mapped from BE 400.
- **Not-allowlisted screen (D4)**: full-area centered message "This account is not
  authorized" + a sign-out/back-to-site link; shown after the login probe fails.

## 5. Edge cases (collecting)
- Long lists (skills) — simple scroll; pagination parked (personal scale).
- Reorder at list boundaries (first can't move up / last can't move down) — disable arrows.
- Mobile: tables overflow-x scroll rather than reflow.
- Dark-mode is `media` (OS-driven) — admin styles must look right in both, but design
  targets the dark variant as primary (matches site).
- Empty states per domain ("No projects yet — add one").

## 6. Decisions log (the contract)
- 2026-06-21 — Scope LOCKED: S3.1 = admin visual/UX design only; functional design
  (admin-cms D1–D11) is the locked contract and is not reopened.
- 2026-06-21 — LOCKED: discuss here (no external design tool); admin **matches the public
  site** look — dark theme, Flowbite React + Tailwind (honors D7).
- 2026-06-21 — DD1 LOCKED: admin chrome via Next.js **route groups** — public pages +
  CustomNavbar/CustomFooter move into a `(public)` layout; root layout becomes bare
  `<html><body>`; `/admin` gets its own layout (sidebar + topbar, no public nav/footer).
- 2026-06-21 — DD2 LOCKED: sidebar = **grouped sections** — Profile (about, mediaSocials)
  | Portfolio (projects, skills, categories) | Resume (experiences, educations,
  certifications, achievements). Dashboard link at top.
- 2026-06-21 — DD3 LOCKED: `/admin` landing = **dashboard cards** per domain showing item
  count + quick "manage"/"add new" links.
- 2026-06-21 — DD4 LOCKED: feedback = **toast on save success** (Flowbite `Toast`) +
  **confirm modal before delete** (Flowbite `Modal`) + inline banner for form-level
  (BE 400) errors.
- 2026-06-21 — DD5 LOCKED: surface palette = layered dark — `gray-900` app bg, `gray-800`
  sidebar/topbar/cards/table surfaces, `gray-700` borders, `blue-600` primary buttons,
  `blue-500` links/hover; reuse Inter + existing fade-in animations sparingly.
- 2026-06-21 — DD6 LOCKED: **desktop-first** (data-table heavy); sidebar collapses to a
  drawer/top toggle on mobile, full editing still supported; tables overflow-x scroll on
  small screens. Pagination/search parked.
- 2026-06-21 — DESIGN LOCKED by Bayu. Decisions log complete (DD1–DD6). Visual/UX is the
  contract alongside admin-cms D1–D11. Ready for /wf-plan admin-cms.

## 7. Parking lot / later
- List pagination / search/filter in admin tables.
- A dedicated admin (non-`media`) theme toggle.
- Bulk actions (multi-select delete) in list views.
