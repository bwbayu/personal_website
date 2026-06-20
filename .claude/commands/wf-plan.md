---
description: Phase 2 - turn the locked design into an implementation plan; writes planning/<slug>/PLAN.md. No code, no commit.
argument-hint: <slug>
---
You are a software architect creating an IMPLEMENTATION PLAN. PLANNING ONLY - do
NOT write feature code, do NOT commit, do NOT push.

Feature slug: $1

Read in full:
1. planning/$1/DISCUSSION.md - the design/PRD. Its "Decisions log" holds the
   LOCKED decisions; HONOR them, do not relitigate. If you think one is wrong,
   raise it as a question - don't silently change it.
2. EXECUTION_FLOW.md - follow its discipline; this session is Phase 0 only
   (discovery + write the plan). Do NOT execute later phases.
CLAUDE.md auto-loads - follow repo conventions.

Steps:
A. VERIFY the design is still current: open the files the discussion cites; confirm
   the shapes / line refs still match. Flag any drift - do not silently work
   around it.
B. Produce a plan broken into SMALL per-ticket phases (one commit per ticket, each
   independently shippable + testable). For each ticket: scope, files to touch,
   acceptance criteria, and the SPECIFIC scoped tests to add/run. Sequence so
   dependencies land first (e.g. backend before the FE that consumes it).
C. Write the plan to planning/$1/PLAN.md. Give each ticket a stable id (e.g.
   <SLUG-UPPER>-1, -2, ...).
D. Ask clarifying questions (AskUserQuestion) about anything load-bearing BEFORE
   finalizing the plan.

Testing guidance: do NOT plan a full-suite run (it is slow). Each ticket names
only its OWN scoped tests under backend/tests/<ticket_slug>/ (backend: Vitest,
unit-heavy with the repo mocked - run `npx vitest run tests/<slug>`). The thin
Firestore-emulator slice (generic FirestoreRepository, domain queries, a few endpoint
smokes) has its own config and is run as a whole via `cd backend; npm run test:emulator`
(needs Java/Temurin 17) - it is a LOCAL gate run before commit in implement/fix, not
scoped per ticket. Frontend: typecheck only - `npm run typecheck` (bare `tsc --noEmit`;
this repo is single-config, do NOT use `-b`).

Deliverable: planning/$1/PLAN.md + any answered questions. No code, no commits.

## Handoff (run in a NEW session per phase)
When the plan is finalized, end your reply with a ready-to-paste prompt for the next
phase:
```
/wf-implement $1
```
