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
3. FEATURE_FLOW.md - Stage A/B/C/D per ticket, commit conventions, hard rules.
CLAUDE.md auto-loads - follow repo conventions (the Static gate in the Workflow stack
contract; no emojis / non-ASCII in user-facing strings; no Co-Authored-By trailer; etc.).

Git (Branch model in the Workflow stack contract):
- Work on branch feat/$1, cut from the integration branch. If feat/$1 does not exist,
  create it from the integration branch and say so; if you are not on that branch,
  check it out first. Do NOT push until the user explicitly approves. No pushes between
  tickets. Never commit to the integration/prod branches directly.

OVERRIDE on FEATURE_FLOW testing (REQUIRED): the full regression suite is SLOW -
do NOT run it. Skip the pre-flight baseline; after each ticket run ONLY that ticket's
scoped tests, per the Workflow stack contract (CLAUDE.md):
- the Scoped test command for the area(s) this ticket touches, plus the Static gate;
- the Pre-commit gate, when the ticket touches the area it covers: run it BEFORE
  committing. The sandbox may lack its tooling; if so, STOP and have the operator run it
  locally - do not commit until it is green. CI re-runs it on the PR as a backstop, but
  catch failures here, not by bouncing off CI.
"Never advance while tests fail" applies, scoped to the ticket.

Working-doc note: planning/$1/* is tracked in git, but keep planning updates in
separate commits — never fold them into a code commit. Update PLAN.md to mark tickets
done, then commit it separately. Each code commit is code + tests only.

Per-ticket loop (Stage A/B/C/D):
A understand - re-read the ticket; open every file it touches; confirm current
  code matches the plan. If drifted, STOP and ask.
B ask if needed - if ambiguous, ask (one batched AskUserQuestion); else say
  "no questions, proceeding".
C implement + scoped test - make the edits; test EVERY acceptance criterion; run
  the ticket's scoped tests (incl. the Pre-commit gate above when the ticket touches
  the area it covers); fix until green.
D commit - ONE commit. Subject `<type>(<scope>): <subject>` (NO ticket-id / doc
  suffix). Body = a few SHORT self-contained bullets of WHAT changed; do NOT reference
  DISCUSSION/PLAN/tickets/decisions (keep each message self-contained); no long prose;
  no Co-Authored-By. Record the commit SHA next to the ticket in PLAN.md; commit that
  planning/ update separately. Verify with git log --oneline -3.
Do NOT advance until the current ticket is green + committed.

Final: run the union of the feature's scoped tests; report a table
| commit | ticket | summary |. Do NOT push (that is a later human-gated step).

## Handoff (run in a NEW session per phase)
End your reply with a ready-to-paste prompt for the review phase. The base branch is
the integration branch feat/$1 was cut from (Branch model in the contract); fill it in
from the contract so the prompt is ready to paste and review can scope the diff:
```
/feature-review $1 <integration-branch>
```
