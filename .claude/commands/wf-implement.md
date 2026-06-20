---
description: Phase 3 - execute the plan ticket-by-ticket on branch feat/<slug>. Per-ticket commits. Scoped tests only.
argument-hint: <slug>
---
You are a disciplined implementing agent. Execute the plan END-TO-END, one ticket
at a time, with full git discipline.

Feature slug: $1

Source of truth:
1. planning/$1/PLAN.md - the execution contract (tickets, ACs, files, scoped
   tests). Execute the tickets in order.
2. planning/$1/DISCUSSION.md - the "why"; its Decisions log is LOCKED and must
   not be violated.
3. EXECUTION_FLOW.md - Stage A/B/C/D per ticket, commit conventions, hard rules.
CLAUDE.md auto-loads - follow repo conventions (frontend typecheck = bare
`tsc --noEmit` via `npm run typecheck`, NOT `-b`; no emojis / non-ASCII in
user-facing strings; backend auth/router carve-outs; no Co-Authored-By trailer; etc.).

Git:
- Work on branch feat/$1, cut from `develop` (the integration branch). If feat/$1
  does not exist, create it from develop and say so; if you are not on develop, check
  it out first. Do NOT push until the user explicitly approves. No pushes between
  tickets. Never commit to develop/main directly.

OVERRIDE on EXECUTION_FLOW testing (REQUIRED): the full regression suite is SLOW -
do NOT run it. Skip the pre-flight baseline; after each ticket run ONLY that
ticket's scoped tests:
- backend unit (the bulk): npx vitest run tests/<slug>
- frontend: npm run typecheck
- emulator slice (LOCAL gate, before commit): when the ticket touches Firestore-backed
  code (repositories, domain queries, endpoints), run `cd backend; npm run test:emulator`
  (needs Java/Temurin 17) BEFORE committing. Your sandbox may lack Java; if so, STOP and
  have the operator run it locally - do not commit until it is green. CI re-runs this
  slice on the PR as a backstop, but catch failures here, not by bouncing off CI.
"Never advance while tests fail" applies, scoped to the ticket.

Working-doc note: planning/$1/* is GITIGNORED. Update PLAN.md to mark tickets done
for tracking, but NEVER git add anything under planning/. Each commit is code +
tests only.

Per-ticket loop (Stage A/B/C/D):
A understand - re-read the ticket; open every file it touches; confirm current
  code matches the plan. If drifted, STOP and ask.
B ask if needed - if ambiguous, ask (one batched AskUserQuestion); else say
  "no questions, proceeding".
C implement + scoped test - make the edits; test EVERY acceptance criterion; run
  the ticket's scoped tests (incl. the local emulator gate above when the ticket
  touches Firestore-backed code); fix until green.
D commit - ONE commit. Subject `<type>(<scope>): <subject>` (NO ticket-id / doc
  suffix). Body = a few SHORT self-contained bullets of WHAT changed; do NOT reference
  DISCUSSION/PLAN/tickets/decisions (planning/ is gitignored, external readers lack
  them); no long prose; no Co-Authored-By. Record the commit SHA next to the ticket in
  PLAN.md (NO git add of planning/). Verify with git log --oneline -3.
Do NOT advance until the current ticket is green + committed.

Final: run the union of the feature's scoped tests; report a table
| commit | ticket | summary |. Do NOT push (that is a later human-gated step).

## Handoff (run in a NEW session per phase)
End your reply with a ready-to-paste prompt for the review phase. The base branch is
`develop` (what feat/$1 was cut from), so review can scope the diff:
```
/wf-review $1 develop
```
