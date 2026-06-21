# Admin CMS - Visual / UX Pass (S3.1) - Review (Pass 1)

> Fresh-eyes, read-only audit of `develop..HEAD` on `feat/admin-cms-design`. Base branch:
> `develop`. No code changed in this phase. Findings are numbered for triage; the
> Decisions log (SS7) is filled WITH the user.

## 1. Objective + scope

Audit the visual/UX-only pass over the already-merged admin area against
[PLAN.md](PLAN.md) (6 tickets, DD1->-1 ... DD6->-6) and the LOCKED
[DISCUSSION.md](DISCUSSION.md) Decisions log (DD1-DD6), and confirm the functional
contract (admin-cms D1-D11) is not regressed.

Commits reviewed (`develop..HEAD`, code only - planning/docs commits excluded):

| SHA | Ticket | Subject |
|---|---|---|
| 9834055 | ADMIN-CMS-DESIGN-1 (DD1) | split public and admin chrome via route groups |
| 0e62e8e | ADMIN-CMS-DESIGN-2 (DD5) | apply layered-dark palette to the admin area |
| 2ba0f76 | ADMIN-CMS-DESIGN-3 (DD2) | group the admin sidebar into sections |
| 3bb51bc | ADMIN-CMS-DESIGN-4 (DD3) | add admin dashboard cards with item counts |
| 6ecfe02 | ADMIN-CMS-DESIGN-5 (DD4) | add save toasts and a delete confirm modal |
| 8629157 | ADMIN-CMS-DESIGN-6 (DD6) | make the admin shell responsive with a mobile drawer |

All 6 tickets are implemented. **Nothing pending.**

**Gates run this review** (frontend-only feature, no backend code -> no Vitest/emulator
slice applies, as PLAN SS0 states):
- `npm run typecheck` -> clean.
- `npm run lint` -> clean for admin; only pre-existing `tailwindcss/classnames-order`
  warnings in public `HomeClient` / `ProjectsClient` (not touched by this feature).
- `npm run build` (static export) -> clean, 33 pages generated; `out/404.html` emitted;
  route group added no URL segment (`/`, `/project`, `/resume`, `/admin*` all present).
- Verified in the exported HTML: `out/index.html` contains the public navbar
  (`<nav`), footer (`</footer>`) and brand (`bwbayu`); `out/admin.html` contains none of
  them -> DD1 chrome split holds at the export level, not just in source.

Behavior that cannot run headless (auth popup, probe guard, drawer open/close, toast on
redirect, modal confirm, responsive widths) was reviewed by reading; it still needs the
operator's manual e2e pass per each ticket's checklist.

## 2. Plan-conformance table

| Ticket | Status | Evidence |
|---|---|---|
| -1 DD1 route-group chrome | **met** | `app/(public)/layout.tsx` fragment with `CustomNavbar`+children+`CustomFooter`; 3 public pages moved (0-line diff = pure move); `app/layout.tsx` stripped to bare `<html><body class="...flex min-h-screen flex-col">` keeping metadata/Inter/ThemeModeScript/favicon/globals; `app/admin/layout.tsx:11-13` comment updated. Build emits `404.html` + all routes; export grep confirms chrome present on public, absent on admin. |
| -2 DD5 layered-dark palette | **met** | All 8 surfaces restyled; grep for `dark:`/`bg-white`/`text-gray-700`/`bg-gray-100`/`border-gray-200/300` in `components/admin` returns only comments. Tokens match SS2.1 (`bg-gray-900`/`bg-gray-800`/`border-gray-700`/`bg-blue-600`/`text-blue-500`). `animate-fade-in` on shell content ([AdminShell.tsx:155](../../frontend/components/admin/AdminShell.tsx#L155)) and login card. |
| -3 DD2 grouped sidebar | **met** | `navGroups` in [config.ts:211-215](../../frontend/lib/admin/config.ts#L211-L215); shell renders Dashboard + 3 labelled groups ([AdminShell.tsx:40-66](../../frontend/components/admin/AdminShell.tsx#L40-L66)); runtime assertion ([config.ts:219-234](../../frontend/lib/admin/config.ts#L219-L234)) fails loudly if a slug is missing/duplicated/unknown - all 9 slugs covered once. Active state via `startsWith`. |
| -4 DD3 dashboard cards | **met** | `DashboardClient` grid 1/2/3 cols; per-card count via `listDomain` with loading `...` / error `-` fallback ([DashboardClient.tsx:36-41](../../frontend/components/admin/DashboardClient.tsx#L36-L41)); singleton (about) shows "Edit profile", no count, no Add-new ([DashboardClient.tsx:50-56](../../frontend/components/admin/DashboardClient.tsx#L50-L56)). Remount-on-return refreshes counts. |
| -5 DD4 toast + confirm modal | **met** | `AdminToastProvider` mounted in layout inside guard, around shell ([layout.tsx:23-27](../../frontend/app/admin/layout.tsx#L23-L27)); `show()` called before redirect in Create/Edit and in-place for singleton ("Saved"); native `window.confirm` gone (only a comment remains); Flowbite `Modal` confirm with in-flight guard; inline red 400 banner kept consistent in `DomainForm`. Inline green singleton notice removed; `notice` prop dropped from `DomainForm`. |
| -6 DD6 responsive | **met** | Desktop sidebar `hidden ... md:block`; hand-rolled drawer (`fixed inset-y-0 left-0 w-64`, `translate-x` toggle) + `bg-black/50` backdrop; hamburger `md:hidden`; closes on route change ([AdminShell.tsx:25-27](../../frontend/components/admin/AdminShell.tsx#L25-L27)), Escape ([:30-37](../../frontend/components/admin/AdminShell.tsx#L30-L37)), backdrop click. Table `overflow-x-auto` + `min-w-[640px]` ([DomainListClient.tsx:216-217](../../frontend/components/admin/DomainListClient.tsx#L216-L217)). No flowbite-react bump. Build clean. |

## 3. Decision-conformance table

| Decision | Honored? | Evidence |
|---|---|---|
| DD1 route-group chrome | yes | SS2 above; root layout bare, `(public)` layout owns chrome, admin owns its shell. |
| DD2 grouped sidebar (Profile/Portfolio/Resume + Dashboard) | yes | `navGroups` order + labels exactly as locked; Dashboard link on top. |
| DD3 dashboard cards + counts + quick links | yes | one card/domain, live count, Manage/Add-new; about -> Edit only. |
| DD4 toast on save + confirm modal + inline 400 banner | yes | Flowbite Toast + Modal; inline red banner is the BE-400 surface (D10 honored). |
| DD5 layered dark palette + Inter + sparing fade-in | yes | tokens applied as hardcoded classes (not `dark:`), matching the SS2.1 rationale. |
| DD6 desktop-first; mobile drawer; table overflow-x | yes | desktop sidebar + mobile off-canvas drawer; table scrolls. |
| D7 Flowbite React + Tailwind only; drawer hand-rolled | yes | drawer is plain Tailwind; only Flowbite `Toast`/`Modal` added; no new UI dep. |
| D1-D11 functional contract not regressed | yes | reorder (two-PATCH swap), delete flow (404 "already removed" + refetch), create/edit/singleton, probe guard, custom widgets - all logic intact; changes are class-only + the confirm-modal refactor of the pre-existing delete. |

## 4. Edge-case checklist

| Case | Result |
|---|---|
| Empty list | Handled - "No items yet. Use the New button to add one." ([DomainListClient.tsx:214](../../frontend/components/admin/DomainListClient.tsx#L214)). Generic, not per-domain (see SS6). |
| Dashboard count fetch error | Handled - card degrades to `-`, grid does not break ([DashboardClient.tsx:39](../../frontend/components/admin/DashboardClient.tsx#L39)). |
| Singleton on dashboard | Handled - no count/Add-new, just Edit. |
| Delete 404 (already removed) | Handled - amber "already removed" notice + refetch ([DomainListClient.tsx:173-175](../../frontend/components/admin/DomainListClient.tsx#L173-L175)). |
| Delete double-click / in-flight | Handled - `deletingId` disables both modal buttons; `cancelDelete` no-ops while deleting. |
| Edit item deleted in another tab (404 on PATCH) | Handled - friendly message ([DomainFormPage.tsx:170](../../frontend/components/admin/DomainFormPage.tsx#L170)). |
| Singleton 404 on load (not created yet) | Handled - editable empty form ([DomainFormPage.tsx:221](../../frontend/components/admin/DomainFormPage.tsx#L221)). |
| Reorder at group boundary | Handled - Up/Down disabled at ends via neighbor map. |
| Dangling category/skill ref in widgets | Handled - kept selectable as "(unknown)" ([CategorySelect.tsx:57](../../frontend/components/admin/inputs/CategorySelect.tsx#L57), [TechPicker.tsx:38](../../frontend/components/admin/inputs/TechPicker.tsx#L38)). |
| Toast survives post-save redirect | Handled by design - provider in layout subtree persists across nav (SS2.3). |
| Drawer close on nav / Escape / backdrop | Handled (3 paths). Body-scroll-lock + focus-trap NOT handled -> SS1. |
| Unknown `/admin/<slug>` | Handled - `NotFoundView` / `NotFound`. |
| `useAdminToast` outside provider | Throws by design; all consumers render inside the provider (verified). |
| Async setState after unmount | Guarded with `active` flags in dashboard/edit/singleton/widgets effects. |

## 5. Findings

### SS1 - Mobile drawer has no body-scroll-lock, focus-trap, or dialog semantics - NICE-TO-HAVE
- **File:** [AdminShell.tsx:78-119](../../frontend/components/admin/AdminShell.tsx#L78-L119)
- **What:** The hand-rolled drawer closes on backdrop/Escape/nav (all ACs met), but (a)
  the page body still scrolls behind the open drawer, (b) focus is not trapped inside the
  panel and not returned to the hamburger on close, and (c) the panel is not marked
  `role="dialog" aria-modal="true"`.
- **Why it matters:** Minor mobile UX/a11y papercut. The locked AC for -6 only requires
  the three close paths, so this is polish, not a contract miss. Body-scroll-lock is the
  one I would most consider doing.
- **Fix (if taken):** add `aria-modal`/`role="dialog"` to the panel; toggle
  `document.body.style.overflow` while `drawerOpen`; optionally move focus to the close
  button on open. Pure Tailwind/DOM, honors D7.
- **Ref:** DD6 / ADMIN-CMS-DESIGN-6.

### SS2 - Two `<nav>` landmarks; desktop sidebar nav lacks an aria-label - NICE-TO-HAVE
- **File:** [AdminShell.tsx:73](../../frontend/components/admin/AdminShell.tsx#L73) (desktop) vs [:118](../../frontend/components/admin/AdminShell.tsx#L118) (drawer, labelled "Admin navigation")
- **What:** The nav list renders into two always-present `<nav>` elements (one
  `md:hidden`, one `hidden md:block`). The drawer nav has an `aria-label`; the desktop one
  does not, so a screen reader sees two "navigation" landmarks, one unnamed.
- **Why it matters:** Small a11y nit; both are valid, just ambiguous to AT.
- **Fix (if taken):** give the desktop `<nav>` an `aria-label` (e.g. "Primary") distinct
  from the drawer's.
- **Ref:** DD2 / -3, DD6 / -6.

### SS3 - Delete confirm modal is generic and orders Delete before Cancel - NICE-TO-HAVE
- **File:** [DomainListClient.tsx:293-316](../../frontend/components/admin/DomainListClient.tsx#L293-L316)
- **What:** The modal body reads "Delete this item? This cannot be undone." without
  naming the row, and renders the destructive **Delete** button to the left of **Cancel**.
- **Why it matters:** Naming the target (e.g. by a key column) reduces mis-deletes;
  button order is a convention preference. The AC (Cancel aborts / Confirm deletes) is met.
- **Fix (if taken):** interpolate a label/identifier into the body; optionally swap button
  order so Cancel is the leftmost/safe default.
- **Ref:** DD4 / -5.

### SS4 - Desktop sidebar is not sticky; scrolls away on long lists - NICE-TO-HAVE
- **File:** [AdminShell.tsx:72-76](../../frontend/components/admin/AdminShell.tsx#L72-L76)
- **What:** The desktop `<aside>` is a normal flex column, so on a long table (e.g.
  skills) the whole page scrolls and the nav leaves the viewport.
- **Why it matters:** For a data-table-heavy admin, a sticky sidebar is nicer; not
  required by DD6's ACs and matches prior behavior, so optional.
- **Fix (if taken):** `md:sticky md:top-8 md:self-start` on the desktop aside.
- **Ref:** DD6 / -6.

### SS5 - Comment typo in ToastProvider - NICE-TO-HAVE
- **File:** [ToastProvider.tsx:24](../../frontend/components/admin/ToastProvider.tsx#L24)
- **What:** "Overriding the theme leaves replaces the light/dark pair outright." -
  "leaves replaces" is garbled.
- **Why it matters:** Readability only.
- **Fix:** reword to "Overriding the theme replaces the light/dark pair outright."
- **Ref:** -5.

### SS6 - Generic empty-state copy + 8 parallel count fetches on dashboard - NICE-TO-HAVE (efficiency/UX)
- **File:** [DomainListClient.tsx:214](../../frontend/components/admin/DomainListClient.tsx#L214), [DashboardClient.tsx:20-34](../../frontend/components/admin/DashboardClient.tsx#L20-L34)
- **What:** (a) Empty lists use one generic message; DISCUSSION SS5 floated per-domain
  copy ("No projects yet") but it was a parking-lot idea, not locked. (b) The dashboard
  fires one list GET per non-singleton domain (8) on every mount.
- **Why it matters:** Both are accepted at personal scale and explicitly within plan
  scope ("fetch each domain via listDomain"); noting for completeness only.
- **Fix (if taken):** per-domain empty copy via a config field; leave the fetch fan-out.
- **Ref:** DD3 / -4.

### SS7 - Reorder uses two independent PATCHes (partial-failure window) - OUT-OF-SCOPE
- **File:** [DomainListClient.tsx:137-140](../../frontend/components/admin/DomainListClient.tsx#L137-L140)
- **What:** `move()` swaps `order` via `Promise.all` of two PATCHes; if one succeeds and
  the other fails, the succeeded one is not rolled back, so two rows can share an `order`
  and the UI is left stale (no refetch on the error path). **Pre-existing** (admin-cms S3),
  not touched by this visual pass.
- **Verdict:** A true all-or-nothing swap needs an atomic/transactional (batch) write on
  the **backend** - the frontend cannot guarantee atomicity across two independent PATCHes.
  Decision: **leave the frontend unchanged**; the operator will fix this on the backend
  (transactional reorder/swap) under a separate ticket. Do NOT modify the frontend here.
- **Ref:** none (pre-existing; D3) -> deferred to a future backend ticket.

### SS8 - Pre-existing lint warnings in public components - OUT-OF-SCOPE
- **File:** `components/HomeClient/index.tsx`, `components/ProjectsClient/index.tsx`
- **What:** `tailwindcss/classnames-order` warnings; not in admin, not in this diff.
- **Ref:** none (pre-existing).

### SS10 - Admin read volume vs 60/min read limiter (429s) - OUT-OF-SCOPE (backend)
- **File:** [backend/app.ts:27-32](../../backend/app.ts#L27-L32) (read `max:60`/60s); amplified by [DashboardClient.tsx:20-34](../../frontend/components/admin/DashboardClient.tsx#L20-L34) (8-way fan-out, SS6).
- **What:** Operator hits `GET /api/certifications 429` just by opening the admin. Cause:
  dashboard fires 8 GETs per mount, x2 under dev React StrictMode, + probe + about reads,
  against a 60-requests/min per-IP read limiter. (Note: CLAUDE.md's "200/15min" is stale;
  actual is 60/min read, 10/min write.)
- **Verdict:** Mostly a dev artifact (StrictMode double-fire; no-store). In a prod build a
  single admin user is far lighter. Bumping the read limit (reads are public + cheap) is
  reasonable but is a **backend** change, out of this frontend-only feature's scope ->
  separate ticket. Frontend-side reduction conflicts with DD3 (cards must show counts).
- **Ref:** none (pre-existing backend config; relates to DD3 / SS6).

### SS9 - DELETE probe on admin load (expected 404) - OUT-OF-SCOPE (not a bug)
- **File:** [AdminGuard.tsx:8-12](../../frontend/components/admin/AdminGuard.tsx#L8-L12), [AdminGuard.tsx:47-68](../../frontend/components/admin/AdminGuard.tsx#L47-L68)
- **What:** Opening any admin page fires `DELETE /api/projects/00000000-0000-0000-0000-000000000000`, which returns 404. Raised by the operator as a possible bug.
- **Verdict:** Working as designed - this is the probe-on-login auth gate (locked D4 of
  admin-cms). Reads are public here, so a write verb is needed to exercise
  `authMiddleware`; DELETE on a non-existent id tests auth without mutating anything.
  401/403 => denied (sign out), any other status (404 expected) => authorized. The 404 is
  the success path, not an error. **Pre-existing** (admin-cms S3), not part of this visual
  pass; do NOT add to fix.
- **Side note (no action):** the ~3.4s latency on that DELETE is Firestore cold-start in
  local dev, not the probe logic.
- **Ref:** none (pre-existing; D4).

## 6. Open questions

1. **SS1 body-scroll-lock / drawer a11y** - elevate any part to FIX now, or defer to the
   "later" a11y polish bucket? (Body-scroll-lock is the cheapest win.)
2. **SS3 modal** - worth naming the row being deleted, or is the generic confirm fine for
   a single-operator admin?
3. **SS4 sticky sidebar** - want it now (one class) or leave as-is?
4. **SS7 reorder partial-failure** - acknowledge as a known pre-existing limitation and
   leave for a separate ticket?

## 7. Decisions log (filled during triage)

| Finding | Severity | Decision | Note |
|---|---|---|---|
| SS1 drawer scroll-lock / focus / dialog | NICE-TO-HAVE | **FIX** [FIXED 0ead605] | body-scroll-lock + role=dialog/aria-modal + focus return |
| SS2 nav landmark label | NICE-TO-HAVE | **FIX** [FIXED 0ead605] | folded with SS1 (drawer a11y); add aria-label to desktop nav |
| SS3 modal copy / button order | NICE-TO-HAVE | NO-ACTION | operator: no need to name the item; button order left as-is |
| SS4 sticky desktop sidebar | NICE-TO-HAVE | **FIX** [FIXED 587fc7c] | `md:sticky md:top-8 md:self-start` |
| SS5 comment typo | NICE-TO-HAVE | **FIX** [FIXED 0f12ade] | trivial, folded into the fix pass |
| SS6 empty copy / fetch fan-out | NICE-TO-HAVE | DEFERRED | DD3-locked fan-out; see SS10 |
| SS7 reorder partial-failure | OUT-OF-SCOPE | DEFERRED (backend) | frontend can't make it atomic; operator will fix on the backend (transactional swap). Do NOT touch frontend. |
| SS8 public lint warnings | OUT-OF-SCOPE | NO-ACTION | pre-existing, not in diff |
| SS9 DELETE probe (404) | OUT-OF-SCOPE | NO-ACTION | not a bug; locked D4 probe-on-login |
| SS10 read limiter 429 | OUT-OF-SCOPE | DEFERRED | backend change, not now; operator-owned |
