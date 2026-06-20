# EXECUTION_FLOW.md — Per-Ticket Workflow Discipline

The durable process the `.claude/commands/wf-*` commands cite. It codifies how a
feature moves from design to shipped code with full git discipline, for THIS repo
(Express + TypeScript backend, Next.js static-export frontend, Cloud Firestore).
Read alongside [CLAUDE.md](CLAUDE.md) (stack facts, conventions).

## The flow at a glance

Each feature gets a kebab-case `<slug>` and a working folder `planning/<slug>/`
(tracked in git, shared so the workflow is portable). The six phases map 1:1 to the
wf-* commands:

| Phase | Command | Output | Code? Commit? |
|-------|---------|--------|---------------|
| 1. Discuss | `/wf-discuss` | `planning/<slug>/DISCUSSION.md` (Decisions log = the contract) | No / No |
| 2. Plan | `/wf-plan` | `planning/<slug>/PLAN.md` (tickets `<SLUG-UPPER>-N`) | No / No |
| 3. Implement | `/wf-implement` | code on `feat/<slug>`, one commit per ticket | Yes / Yes |
| 4. Review | `/wf-review` | `planning/<slug>/REVIEW.md` (findings §N) | No / No |
| 5. Fix | `/wf-fix` | code, one commit per FIX finding | Yes / Yes |
| 6. Re-review | `/wf-rereview` | appends "Pass N" to REVIEW.md | No / No |

Loop 5<->6 until a pass returns CLOSE (no new FIX-worthy findings). Every phase
boundary is **human-gated**. Pushing is a separate, explicit, human-approved step
that happens only after the loop closes.

**Each phase runs in a NEW session** (fresh context); the `planning/<slug>/` docs are
the handoff, not chat history. Review/re-review especially MUST be fresh-eyes — never
the same session that wrote the code. So every wf-* command ends by emitting a
ready-to-paste prompt for the next phase, with concrete args filled in (slug, base
branch, delta SHA) so the next session starts with the right context.

## Honor the contract

- `DISCUSSION.md` "Decisions log" holds LOCKED decisions. Plan, implement, review,
  and fix all HONOR them. If you think a locked decision is wrong, STOP and raise it
  as a question — never silently change it.
- `PLAN.md` tickets are the execution contract: each has scope, files, acceptance
  criteria (ACs), and its own scoped tests. Execute in order; dependencies first
  (backend before the frontend that consumes it).

## Per-ticket loop (Stage A/B/C/D)

Used by `/wf-implement` (per ticket) and `/wf-fix` (per finding). Do NOT advance
until the current item is green + committed.

- **A — Understand.** Re-read the ticket/finding. Open every file it touches; confirm
  the current code still matches the plan (line refs drift). Read adjacent
  callers/imports enough to know your change won't break out-of-scope behavior.
  Verify referenced symbols exist (grep / open the file) — never invent paths. If
  drifted or stale, STOP and ask.
- **B — Ask if needed.** If anything is ambiguous, contradicts the codebase, or a fix
  would violate a locked decision, ask ONE batched `AskUserQuestion`. Otherwise say
  "no questions, proceeding." Surface plan deviations here, not silently.
- **C — Implement + scoped test.** Make the edits. Test EVERY acceptance criterion.
  Add/extend the scoped test under `backend/tests/<slug>/` that proves the
  ticket/finding. Run only that scope (see Testing). Fix until green. For FE behavior
  you can't exercise headless, say so explicitly.
- **D — Commit.** ONE commit (see Commit conventions). For fixes, mark the finding
  `[FIXED]` in `REVIEW.md` first (but never `git add` anything under `planning/`).
  Verify with `git log --oneline -3`.

## Testing

Run ONLY the current ticket's scoped tests — never the full suite (slow). Skip any
pre-flight full-suite baseline.

- **Backend unit (the bulk, repo mocked):**
  ```
  npx vitest run tests/<slug>            # from backend/
  npx vitest run tests/<slug> -t "name"
  ```
- **Backend emulator slice (LOCAL gate — needs Java/Temurin 21):**
  ```
  cd backend; npm run test:emulator     # whole slice (own vitest.emulator.config.ts)
  ```
  Covers only the layers that truly touch Firestore: the generic
  `FirestoreRepository<T>`, domain queries (ordering/filtering), and a few endpoint
  smokes. It is NOT scoped per slug — it runs as one set. Run it locally BEFORE
  committing any change that touches Firestore-backed code (repositories, domain
  queries, endpoints). The agent sandbox may lack Java; if so, STOP and have the
  operator run it. CI re-runs this slice on every PR as a backstop, but catch failures
  locally before commit rather than bouncing off CI.
- **Frontend (typecheck only):** `npm run typecheck` (= `tsc --noEmit`). This repo's
  `frontend/tsconfig.json` is a single config, so bare `tsc --noEmit` is correct —
  do NOT use `-b`.

"Never advance while tests fail" applies, scoped to the current ticket/finding.

## Commit conventions

- **Subject:** `<type>(<scope>): <subject>` — NO ticket/issue/finding/doc suffix
  (no `(slug TH-2)`, no `(review §N)`). `<type>`: feat/fix/refactor/perf/chore/docs/
  test. `<scope>`: `backend` or `frontend`.
- **Body:** a few SHORT bullet points of WHAT changed — self-contained and readable by
  anyone cloning the public repo. Do NOT reference DISCUSSION/PLAN/REVIEW, ticket IDs,
  finding numbers, or "decisions N" — `planning/` is gitignored, so external readers
  don't have those files. State deviations as plain bullets, not doc references. Keep
  it simple; no long prose.
- **Traceability lives in the docs, not the message:** when a ticket/finding is done,
  record its commit SHA next to it in PLAN.md / REVIEW.md (local working state).
- **No `Co-Authored-By` / Claude / Anthropic attribution trailer.**
- One commit per ticket/finding — never collapse multiple (enables per-item revert).

Example (good):
```
test(backend): add repository mock seam for unit tests

- FirestoreRepository takes an optional db param (defaults to shared client)
- convert skills module to factory functions wired in skill.routes.ts
- add a skills service unit test backed by a fake repository
```

## Git rules

- **Branch model.** `main` = prod (CI deploys on push). `develop` = pure integration
  (no deploy). Work on `feat/<slug>` cut from `develop`; create it from develop if
  missing and say so. When a feature's review loop CLOSES, open a PR into `develop`
  (human-gated). One PR `develop` -> `main` ships a whole batch to prod at the end -
  never per-feature, so the live site never gets a half-finished feature.
- **Never push until the user approves that specific push.** A prior "yes" does not
  carry forward. Never push between tickets. Never commit to `develop` or `main`
  directly.
- Never use `--force` / `--force-with-lease` / `--no-verify` / `--amend` /
  `--no-gpg-sign` without an explicit instruction for that exact command.
- Never `git reset --hard` / `git checkout --` / `git clean -f` / `git branch -D`
  unless explicitly asked.
- Never `git add` secrets (`.env`, `keys/`, `*.pem`) or anything under `planning/`.
  Name files explicitly instead of `git add -A`.

## Review phase (Phase 4)

`/wf-review` is a fresh-eyes, read-only audit of `<base>..HEAD`, scoped to the feature
diff. It checks three axes with file:line evidence: (A) conformance to PLAN ACs per
ticket, (B) conformance to each LOCKED decision, (C) an edge-case checklist
(empty/edge inputs, error paths, idempotency, missing docs, partial payloads), plus a
lower bucket for reuse/simplification/efficiency.

Each finding is numbered §N with a severity: **BLOCKER / SHOULD-FIX / NICE-TO-HAVE /
OUT-OF-SCOPE**, a file:line, what + why it matters, a recommended fix, and the
referenced ticket/decision. The review does NOT fix — it stops for triage with the
user, who marks each finding FIX / DEFERRED / NO-ACTION in the REVIEW Decisions log
(authoritative over the §N text).

`/wf-rereview` (Pass N) verifies only the fix delta (`<delta-base>..HEAD`): each
`[FIXED]` finding is verified-fixed / partial / not-fixed / regressed, plus any NEW
issues the fixes introduced (numbered after the highest existing §). Anti-pattern:
never silently re-open a closed finding — write a new §N that references the old one.
Recommend CLOSE or another pass.

## When to STOP and ask

- A file the plan references moved/renamed/changed shape.
- An acceptance criterion is ambiguous.
- A fix would violate a locked decision, or the agreed fix does not fully resolve the
  finding's stated problem (another field/read-path defeats it) — report, don't expand
  scope silently.
- You spot a real bug in adjacent code outside the ticket scope (note it, ask
  separately — don't sneak it into the commit).
- Anything destructive, or a push you weren't explicitly cleared for.

Guessing on git or load-bearing specs costs more than the time it takes to ask.
