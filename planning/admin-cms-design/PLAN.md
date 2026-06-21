# Admin CMS - Visual / UX Pass (S3.1) - Implementation Plan

> Execution contract for the S3.1 design in [DISCUSSION.md](DISCUSSION.md)
> (Decisions DD1-DD6 LOCKED). Branch: `feat/admin-cms-design` cut from `develop`. One
> commit per ticket, one PR into `develop`.
>
> This is a **visual/UX-only** pass over the ALREADY-BUILT, ALREADY-MERGED admin area
> (S3 / `admin-cms`: shell, config-driven list + create/edit forms, custom widgets,
> reorder controls, not-allowlisted guard). It adds **no functional features** and
> **no backend changes**. The functional contract
> [planning/admin-cms/DISCUSSION.md](../admin-cms/DISCUSSION.md) (D1-D11) must stay
> satisfied - do not regress it.

## 0. Scope recap

- **Frontend only.** No backend code, no new endpoints, no Vitest, no emulator slice.
  The per-ticket gate is `npm run typecheck` + `npm run lint` + (for structural tickets)
  `npm run build`, plus a documented manual e2e/visual checklist (FE behavior is not
  headless-testable here). The `backend/tests/<slug>/` convention does NOT apply.
- **Six tickets, one per locked decision** (DD1->ADMIN-CMS-DESIGN-1, ... DD6->-6) for a
  clean traceability mapping.
- **Reuse Flowbite React + Tailwind only** (D7) - no second UI framework.

## 1. Verified grounding (drift check done against code)

Opened and confirmed every file the design cites; current shapes:

- **Chrome lives in the ROOT layout.** [app/layout.tsx](../../frontend/app/layout.tsx)
  renders `<html><head>(ThemeModeScript, favicon)</head><body class="${inter} flex
  min-h-screen flex-col">CustomNavbar + {children} + CustomFooter</body></html>` and
  exports `metadata`. So `/admin` currently inherits the public navbar/footer - the
  [admin/layout.tsx:11](../../frontend/app/admin/layout.tsx#L11) comment even says "The
  public Navbar/Footer from the root layout still render." This is the DD1 target.
- **Only three public page routes** exist at root: [app/page.tsx](../../frontend/app/page.tsx)
  (Home), [app/project/page.tsx](../../frontend/app/project/page.tsx),
  [app/resume/page.tsx](../../frontend/app/resume/page.tsx). Each is a thin wrapper around a
  `*Client` component. No route group exists yet.
- **`app/api/*.ts` and `app/types/*` are plain modules, NOT routes** (they are named
  `about.ts`, `skills.ts`, ... not `route.ts`; route handlers are disallowed under
  `output: 'export'` anyway). They are imported via the `@/*` alias and must NOT move.
- **Special files stay at root** (per locked answer): [app/not-found.tsx](../../frontend/app/not-found.tsx),
  [app/loading.tsx](../../frontend/app/loading.tsx), [app/error.tsx](../../frontend/app/error.tsx),
  [app/globals.css](../../frontend/app/globals.css). They are full-screen self-contained
  `gray-900` states; after DD1 they render chrome-less (accepted). Keeping `not-found.tsx`
  at root preserves the static-export `404.html`.
- **Admin surfaces are currently light-themed.** None of the admin components use `dark:`
  variants; they use `text-gray-700 / text-gray-600 / bg-gray-100 / border-gray-200 /
  border-gray-300` on an unstyled (white) background. DD5 is therefore a genuine restyle,
  not a tweak. Surfaces to restyle:
  [AdminShell.tsx](../../frontend/components/admin/AdminShell.tsx),
  [AdminGuard.tsx](../../frontend/components/admin/AdminGuard.tsx),
  [admin/page.tsx](../../frontend/app/admin/page.tsx) (dashboard),
  [DomainListClient.tsx](../../frontend/components/admin/DomainListClient.tsx),
  [DomainForm.tsx](../../frontend/components/admin/DomainForm.tsx),
  [DomainFormPage.tsx](../../frontend/components/admin/DomainFormPage.tsx) (its Loading /
  NotFound helpers), [inputs/index.tsx](../../frontend/components/admin/inputs/index.tsx)
  + [StringArrayInput](../../frontend/components/admin/inputs/StringArrayInput.tsx) /
  [CategorySelect](../../frontend/components/admin/inputs/CategorySelect.tsx) /
  [TechPicker](../../frontend/components/admin/inputs/TechPicker.tsx), and
  [admin/login/page.tsx](../../frontend/app/admin/login/page.tsx).
- **Sidebar is a flat list** today: [AdminShell.tsx:23-36](../../frontend/components/admin/AdminShell.tsx#L23-L36)
  renders "Dashboard" + every `registry` entry in order. DD2 regroups it.
- **Dashboard is a bare link grid** today: [admin/page.tsx:15-26](../../frontend/app/admin/page.tsx#L15-L26)
  - one `<Link>` per domain showing only the label, no counts. DD3 rebuilds it.
- **Delete uses native `window.confirm`**:
  [DomainListClient.tsx:126](../../frontend/components/admin/DomainListClient.tsx#L126).
  DD4 replaces it with a Flowbite `Modal`.
- **Save feedback today**: create/edit `router.push(backHref)` to the list with NO toast
  ([DomainFormPage.tsx:106,166](../../frontend/components/admin/DomainFormPage.tsx#L106));
  the singleton (about) shows an inline green "Saved." notice
  ([DomainFormPage.tsx:240](../../frontend/components/admin/DomainFormPage.tsx#L240)). DD4
  adds a Flowbite `Toast`. **Inline BE-400 banners already exist** (red banners in
  [DomainForm.tsx:68-72](../../frontend/components/admin/DomainForm.tsx#L68-L72) and the
  list) - DD4 only folds in what is missing / makes them consistent.
- **Responsive today**: AdminShell is `flex-col md:flex-row`
  ([AdminShell.tsx:21](../../frontend/components/admin/AdminShell.tsx#L21)) - on mobile the
  sidebar STACKS above the content (full-width list), it is not a drawer. Tables already
  have `overflow-x-auto` ([DomainListClient.tsx:176](../../frontend/components/admin/DomainListClient.tsx#L176)).
  DD6 makes the sidebar a mobile off-canvas drawer; the table scroll is already done (verify).
- **Toolchain**: Next 14.1.3, App Router, `output: 'export'`, `trailingSlash: false`
  ([next.config.mjs](../../frontend/next.config.mjs)); `darkMode: 'media'`, Inter, custom
  `animate-fade-in*` keyframes ([tailwind.config.ts](../../frontend/tailwind.config.ts)).
  Scripts: `typecheck` = bare `tsc --noEmit` (single config, no `-b`), `lint` = `next lint`,
  `build` = `next build` (static export).
- **Flowbite React 0.8.0 (installed) ships `Toast`, `Modal`, `Card`, `Table` but NOT
  `Drawer`** (verified in `node_modules/flowbite-react/dist`). => DD4 uses Flowbite
  Toast/Modal as written; DD6's mobile drawer is **hand-rolled in Tailwind** (locked
  answer; honors D7's "build simple widgets manually") with NO flowbite-react upgrade.

### Locked clarifications (this session)
- **System states (not-found/loading/error) stay at root, chrome-less.** Accepted visual
  change; public ROUTES keep their chrome via the new `(public)` layout.
- **Mobile drawer is hand-rolled Tailwind**, no dependency bump.

## 2. Cross-cutting design (consumed by the tickets)

### 2.1 DD5 palette tokens (the layered-dark system)
Apply as **hardcoded** classes (NOT `dark:` variants) - the public site is effectively
dark-always (e.g. HomeClient uses `bg-gray-900` directly), and `darkMode: 'media'` means
`dark:` would only paint on a dark OS. Hardcoding keeps the admin consistent in both OS
modes, as the design intends (dark is primary).

| Token | Class | Used for |
|---|---|---|
| App background | `bg-gray-900` | admin content area / body backdrop |
| Surface | `bg-gray-800` | sidebar, topbar, cards, table container, form card, inputs |
| Border | `border-gray-700` | surface borders, dividers, input borders |
| Primary button | `bg-blue-600 hover:bg-blue-700 text-white` | Save, New, primary CTAs |
| Link / accent | `text-blue-500 hover:text-blue-400` | links, Edit action, active nav |
| Heading text | `text-white` (or `text-gray-100`) | page titles, card titles |
| Body text | `text-gray-300` | normal text, table cells |
| Muted text | `text-gray-400` | secondary/help text, placeholders |
| Danger | keep `text-red-*` / red banner; inputs `text-red-400` | delete, errors |
| Success | green banner / toast (`green-*`) | save confirmation |
| Animation | `animate-fade-in` (existing) | sparingly: page/section mount |

Inputs in the dark palette: `bg-gray-800 border border-gray-700 text-gray-100
placeholder-gray-500 focus:border-blue-500`. Keep all existing component STRUCTURE and
props; change only classNames (and, where noted, swap a raw element for a Flowbite one).

### 2.2 DD2 nav grouping (data)
Add a presentation-only grouping in
[lib/admin/config.ts](../../frontend/lib/admin/config.ts) - keep `registry` as the data
source of truth; do not reorder/rename domains:
```ts
export const navGroups: { label: string; slugs: string[] }[] = [
  { label: 'Profile',   slugs: ['about', 'media-socials'] },
  { label: 'Portfolio', slugs: ['projects', 'skills', 'categories'] },
  { label: 'Resume',    slugs: ['experiences', 'educations', 'certifications', 'achievements'] },
];
```
The shell renders a top "Dashboard" link, then each group label + its domains (resolved
via `bySlug`). Every registry slug must appear in exactly one group (assert/cover all 9).

### 2.3 DD4 toast mechanism (survives the post-save redirect)
Create/edit redirect to the list on success, so an in-place toast would be unmounted. Use
a tiny **admin-scoped toast context** mounted in
[app/admin/layout.tsx](../../frontend/app/admin/layout.tsx) (inside `AuthProvider`, around
`AdminShell`): `useAdminToast().show(message)` sets state; the provider renders the
Flowbite `Toast` (auto-dismiss). Because the admin layout subtree is preserved across
client-side navigation, calling `show(...)` right before `router.push(list)` makes the
toast appear on the list. No query param, no Suspense, static-export safe. The singleton
(about) does not redirect - it also calls `show("Saved")` and drops its inline notice.

## 3. Tickets

Stable ids `ADMIN-CMS-DESIGN-N`. Record the commit SHA next to each as it lands (do NOT
commit this file with the code commits - planning updates are separate).

---

### ADMIN-CMS-DESIGN-1 - DD1: route-group chrome (public vs admin)
- **Status**: DONE (9834055)
- **Goal**: the admin must not render the public marketing navbar/footer; public pages
  must look identical to today.
- **Scope**:
  1. Create `app/(public)/layout.tsx` (server component) that renders
     `<><CustomNavbar />{children}<CustomFooter /></>` (a fragment, so navbar/page/footer
     stay direct flex children of `<body>` - byte-identical DOM to today). It may carry the
     public `metadata` if useful; not required.
  2. Move the three public page files into the group (move, do not copy):
     - `app/page.tsx` -> `app/(public)/page.tsx`
     - `app/project/page.tsx` -> `app/(public)/project/page.tsx`
     - `app/resume/page.tsx` -> `app/(public)/resume/page.tsx`
  3. Strip [app/layout.tsx](../../frontend/app/layout.tsx) to bare: keep `<html lang>`,
     `<head>` (ThemeModeScript + favicon), `<body className="${inter.className} flex
     min-h-screen flex-col">{children}</body>`, the `metadata` export, the Inter font, and
     the `./globals.css` import. **Remove** the `CustomNavbar` / `CustomFooter` imports +
     renders.
  4. Update the stale comment in [admin/layout.tsx:9-11](../../frontend/app/admin/layout.tsx#L9-L11)
     (public chrome no longer renders around admin).
- **Do NOT**: move `app/api/`, `app/types/`, `globals.css`, or the special files
  (not-found/loading/error stay at root, chrome-less per the locked answer); do not move or
  group `app/admin/` (its URL stays `/admin`, it already owns its layout).
- **Files**: new `app/(public)/layout.tsx`; moved `app/(public)/{page,project/page,resume/page}.tsx`;
  edited `app/layout.tsx`, `app/admin/layout.tsx` (comment only).
- **ACs**:
  - `/`, `/project`, `/resume` render with the navbar + footer exactly as before.
  - `/admin/*` (login, dashboard, any domain list/form) render with NO public navbar/footer
    - only the admin shell.
  - The not-found/loading/error full-screen states still render (now chrome-less) and the
    export still emits `404.html`.
  - `npm run typecheck`, `npm run lint`, and **`npm run build`** all clean; the build emits
    the same set of public pages + the admin pages (route groups add no URL segment).
- **Tests/gates**: typecheck + lint + **build** (build is the real static-export proof) +
  manual e2e: load each public route and each admin route, confirm chrome presence/absence.
- **Commit**: `refactor(frontend): split public and admin chrome via route groups`.

---

### ADMIN-CMS-DESIGN-2 - DD5: layered-dark palette + shared surface styling
- **Status**: TODO
- **Goal**: restyle every admin surface to the §2.1 layered-dark system so the admin
  matches the public site's dark look; establish the visual baseline the remaining tickets
  build on.
- **Scope**: change classNames only (no behavior/structure change) across:
  - `AdminShell` - content area `bg-gray-900`; sidebar + topbar `bg-gray-800` with
    `border-gray-700`; nav links muted with the active state on `bg-blue-600`; topbar email
    `text-gray-400`, Sign out as a `text-blue-500` link.
  - `AdminGuard` - the "checking", "denied", and "error" centered screens to the dark
    palette; buttons `bg-blue-600`.
  - `admin/page.tsx` (dashboard) - bring to palette now (it is rebuilt into cards in
    ADMIN-CMS-DESIGN-4; keep this change minimal - container/heading/text colors only).
  - `DomainListClient` - page title `text-white`; "New" button `bg-blue-600`; table inside
    a `bg-gray-800 border-gray-700` rounded container, header row `text-gray-400`, body
    rows `border-gray-700` with `hover:bg-gray-700/50`, cells `text-gray-300`; reorder
    Up/Down + Edit/Delete actions recolored (Edit `text-blue-500`, Delete `text-red-400`);
    notice/error banners kept but dark-tuned.
  - `DomainForm` + `DomainFormPage` helpers - form inside a `bg-gray-800 border-gray-700`
    card; labels `text-gray-300`; Save `bg-blue-600`, Cancel as a `border-gray-700` ghost
    button; the Loading / NotFound / "Section not found" helpers to palette.
  - `inputs/*` - the shared `baseInput`/`baseSelect`/`rowInput` constants and the
    TechPicker chips / PlaceholderInput to the dark input style (§2.1).
  - `admin/login/page.tsx` - dark card, heading `text-white`, Google button `bg-blue-600`.
  - Add `animate-fade-in` sparingly (e.g. the shell content wrapper and/or login card).
- **Constraint**: do NOT touch any public component or `globals.css`; admin only. Reuse
  Flowbite/Tailwind only (D7). Adopting Flowbite `Table`/`Card` here is allowed but
  optional - restyling the existing raw elements satisfies DD5 with less risk.
- **Files**: the eight admin surfaces listed in §1 (grounding).
- **ACs**:
  - Every admin screen (login, denied/error guard states, dashboard, each domain list,
    create/edit form, singleton form, every input widget) renders in the layered-dark
    palette with readable contrast; no light/white panels remain.
  - Primary buttons are `blue-600`, links/active-nav are `blue-500`, borders `gray-700`,
    surfaces `gray-800`, app bg `gray-900`.
  - No functional change: reorder, delete, create/edit, the probe guard, and widgets behave
    exactly as before.
  - `npm run typecheck` + `npm run lint` clean.
- **Tests/gates**: typecheck + lint + manual visual pass of every admin screen in both OS
  light/dark (must look correct in both, since palette is hardcoded).
- **Commit**: `style(frontend): apply layered-dark palette to the admin area`.

---

### ADMIN-CMS-DESIGN-3 - DD2: grouped sidebar sections
- **Status**: TODO
- **Goal**: replace the flat sidebar list with grouped sections + a Dashboard link.
- **Scope**:
  - Add `navGroups` to [lib/admin/config.ts](../../frontend/lib/admin/config.ts) (§2.2).
  - Rewrite the `AdminShell` sidebar nav to render: a top "Dashboard" link, then for each
    group a small uppercase `text-gray-400` section label followed by its domain links
    (resolved via `bySlug`, keeping the existing active-state logic and palette from
    ADMIN-CMS-DESIGN-2). Singleton (about) appears under Profile like any other link.
- **Files**: `lib/admin/config.ts`, `components/admin/AdminShell.tsx`.
- **ACs**:
  - Sidebar shows Dashboard, then Profile (About, Media Socials), Portfolio (Projects,
    Skills, Categories), Resume (Experiences, Educations, Certifications, Achievements).
  - All 9 registry slugs appear exactly once across the groups; active highlight still
    tracks the current route; every link still navigates correctly.
  - `npm run typecheck` + `npm run lint` clean.
- **Tests/gates**: typecheck + lint + manual e2e: click through every sidebar link, confirm
  grouping/labels/active state.
- **Commit**: `feat(frontend): group the admin sidebar into sections`.

---

### ADMIN-CMS-DESIGN-4 - DD3: dashboard cards with counts + quick links
- **Status**: TODO
- **Goal**: turn `/admin` into a real landing dashboard - one card per domain showing the
  item count and quick "Manage" / "Add new" links.
- **Scope**:
  - Rewrite [admin/page.tsx](../../frontend/app/admin/page.tsx) (or extract a
    `DashboardClient` component) to render a responsive grid of cards (Flowbite `Card` or a
    palette `bg-gray-800` div), one per `registry` domain.
  - Each card: domain label (card title), the item count, and links: "Manage"
    (`/admin/<slug>`) + "Add new" (`/admin/<slug>/new`).
  - Counts: fetch each domain via `listDomain(apiPath)` (public GET, reuse
    [lib/admin/api.ts](../../frontend/lib/admin/api.ts)) and use `.length`; show a small
    per-card loading state and a graceful dash/"-" on fetch error (do not crash the grid).
  - **Singleton (about)**: no list/count and no "Add new" - render an "Edit profile" link
    (to `/admin/about`) and omit the count (or show a static label). Honors D6c/D11.
- **Files**: `app/admin/page.tsx` (+ optional `components/admin/DashboardClient.tsx`).
- **ACs**:
  - `/admin` shows a card per domain with a live count and working Manage/Add-new links;
    about shows an Edit link with no Add-new.
  - A failing count fetch shows a fallback, not a broken page; counts reflect current data
    after creating/deleting an item and returning to the dashboard.
  - Cards use the dark palette; grid is responsive (1/2/3 columns).
  - `npm run typecheck` + `npm run lint` clean.
- **Tests/gates**: typecheck + lint + manual e2e: load dashboard, verify counts vs each
  list, follow Manage/Add-new, verify about has no Add-new.
- **Commit**: `feat(frontend): add admin dashboard cards with item counts`.

---

### ADMIN-CMS-DESIGN-5 - DD4: toast on save + confirm modal on delete + 400 banner
- **Status**: TODO
- **Goal**: replace the native delete confirm with a Flowbite `Modal`, add a Flowbite
  `Toast` on save success, and ensure the inline BE-400 banner is consistent (fold in only
  what is missing - the red banners already exist).
- **Scope**:
  - **Toast context** (§2.3): add an admin-scoped toast provider in
    [app/admin/layout.tsx](../../frontend/app/admin/layout.tsx) rendering a Flowbite `Toast`
    (auto-dismiss + manual close). Expose `useAdminToast().show(msg)`.
  - **Save success**: call `show("Created"/"Updated")` in `CreateForm`/`EditForm` just
    before `router.push(backHref)`; in `SingletonForm` call `show("Saved")` and remove the
    inline green `notice` path (and the now-unused `notice` prop on `DomainForm` if nothing
    else uses it - verify before removing).
  - **Delete confirm**: replace `window.confirm`
    ([DomainListClient.tsx:126](../../frontend/components/admin/DomainListClient.tsx#L126))
    with a Flowbite `Modal` (state: which row is pending). Confirm -> existing
    `deleteItem` + refetch flow (keep the 404 "already removed" notice + the
    in-flight disabled state). On successful delete, optionally `show("Deleted")`.
  - **Inline 400 banner**: keep the existing red form-level banner (the BE Zod message is
    the source of truth, D10); just verify create/edit/singleton/list all render it
    consistently in the palette. No new validation logic.
- **Files**: `app/admin/layout.tsx`, new `components/admin/ToastProvider.tsx` (or inline),
  `components/admin/DomainListClient.tsx`, `components/admin/DomainFormPage.tsx`,
  `components/admin/DomainForm.tsx` (only if removing the unused `notice` prop).
- **ACs**:
  - Creating/editing any domain shows a success toast after returning to the list; editing
    about shows a success toast in place.
  - Deleting shows a Flowbite confirm modal (Cancel aborts, Confirm deletes); no native
    `window.confirm` remains anywhere in admin.
  - A BE 400 still shows the backend's message as an inline banner on the form; 404 on
    delete still shows "already removed" + refresh.
  - Toast/Modal use Flowbite 0.8.0 components and the dark palette; `npm run typecheck` +
    `npm run lint` clean.
- **Tests/gates**: typecheck + lint + manual e2e: create (toast), edit (toast), about save
  (toast), delete via modal (cancel + confirm), force a 400 (submit an invalid URL) and
  confirm the inline banner.
- **Commit**: `feat(frontend): add save toasts and a delete confirm modal to the admin`.

---

### ADMIN-CMS-DESIGN-6 - DD6: responsive (mobile drawer + table scroll)
- **Status**: TODO
- **Goal**: desktop-first layout where the (now grouped) sidebar collapses to a mobile
  off-canvas drawer behind a topbar toggle; tables scroll horizontally on small screens.
- **Scope**:
  - In `AdminShell`, replace the current `flex-col md:flex-row` stacking with a
    desktop-fixed sidebar (`md:` and up) + a **hand-rolled Tailwind off-canvas drawer** on
    mobile (locked answer; no flowbite-react upgrade): a hamburger toggle in the topbar
    (`md:hidden`), a slide-in panel (`fixed inset-y-0 left-0 w-64 bg-gray-800` with a
    `transition-transform` / `-translate-x-full` <-> `translate-x-0` toggle), and a
    dimmed backdrop that closes it. Close the drawer on navigation (route change) and on
    backdrop/Escape.
  - Keep the grouped nav from ADMIN-CMS-DESIGN-3 as the single source for both the desktop
    sidebar and the mobile drawer (render the same nav list in both).
  - Tables: confirm the existing `overflow-x-auto` wrapper
    ([DomainListClient.tsx:176](../../frontend/components/admin/DomainListClient.tsx#L176))
    works in the dark palette and a wide table scrolls rather than reflowing (add a
    `min-w-*` if needed so columns do not crush on mobile).
- **Files**: `components/admin/AdminShell.tsx` (drawer state + toggle + backdrop);
  `components/admin/DomainListClient.tsx` only if the table needs a `min-w-*`.
- **ACs**:
  - Desktop (>= md): sidebar is visible and fixed; no hamburger.
  - Mobile (< md): sidebar is hidden; a topbar hamburger opens a slide-in drawer with the
    full grouped nav; backdrop/Escape/selecting a link closes it.
  - Wide list tables scroll horizontally on mobile (no layout break); full create/edit/
    delete still works on mobile.
  - `npm run typecheck` + `npm run lint` + **`npm run build`** clean.
- **Tests/gates**: typecheck + lint + build + manual e2e at desktop and mobile widths
  (dev tools responsive): open/close drawer, navigate, scroll a wide table, edit on mobile.
- **Commit**: `feat(frontend): make the admin shell responsive with a mobile drawer`.

## 4. Sequencing & dependencies

1. **ADMIN-CMS-DESIGN-1 (DD1 chrome)** - foundational/structural; everything else renders
   inside the new layout split.
2. **ADMIN-CMS-DESIGN-2 (DD5 palette)** - one sweep over the existing surfaces; establishes
   the §2.1 tokens + dark input/card/table styling that the next tickets reuse, so the
   net-new UI (cards, toast, modal, drawer) is built dark-correct from the start.
3. **ADMIN-CMS-DESIGN-3 (DD2 sidebar groups)** - regroup the (now dark) sidebar nav.
4. **ADMIN-CMS-DESIGN-4 (DD3 dashboard cards)** - rebuild the dashboard using the palette.
5. **ADMIN-CMS-DESIGN-5 (DD4 toast/modal)** - feedback layer over list + forms.
6. **ADMIN-CMS-DESIGN-6 (DD6 responsive)** - last, because the mobile drawer renders the
   FINAL grouped sidebar from -3.

Rationale: DD1 first is forced (it changes layout structure). DD5 second minimizes
restyle churn (later tickets add already-dark components rather than forcing a giant final
color diff). DD3 before DD6 so the drawer wraps the finished grouped sidebar.

## 5. Locked-decision conformance map (do not regress)

- **DD1** -> ADMIN-CMS-DESIGN-1 (route groups; bare root; admin chrome).
- **DD2** -> ADMIN-CMS-DESIGN-3 (grouped sidebar).
- **DD3** -> ADMIN-CMS-DESIGN-4 (dashboard cards + counts).
- **DD4** -> ADMIN-CMS-DESIGN-5 (Flowbite Toast + Modal + inline 400 banner).
- **DD5** -> ADMIN-CMS-DESIGN-2 (layered-dark palette, Inter, sparing fade-in).
- **DD6** -> ADMIN-CMS-DESIGN-6 (desktop-first; mobile drawer; table overflow-x).
- **D7 (functional)** -> all tickets: Flowbite React + Tailwind only; the mobile drawer is
  hand-rolled Tailwind (allowed by D7), no second UI framework, no flowbite-react bump.
- **D1-D11 (functional contract)** -> unchanged: no endpoint, auth, probe-guard, config,
  widget, reorder, or validation behavior is altered - styling/markup only.

## 6. Per-ticket gates (recap)

- Frontend only: `npm run typecheck` (bare `tsc --noEmit`, no `-b`) + `npm run lint` on
  EVERY ticket; **`npm run build`** additionally on the structural tickets
  (ADMIN-CMS-DESIGN-1 and -6) and a final `npm run build` before the PR (static export is
  what catches route/Suspense breakage that typecheck cannot).
- No backend tests, no Vitest, no emulator slice (no backend code changes).
- FE behavior that cannot run headless (auth popup, probe guard, widgets, drawer, toast,
  modal, responsive) is verified by the documented manual e2e checklist in each ticket.

---

### Next phase
```
/wf-implement admin-cms-design
```
