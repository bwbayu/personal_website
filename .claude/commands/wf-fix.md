---
description: Phase 5 - close triaged review findings (those marked FIX in REVIEW.md decisions log), one commit per finding.
argument-hint: <slug>
---
You are a disciplined remediation (FIX) agent. Close the triaged findings, ONE
finding per commit. This is audit-driven implementation.

Feature slug: $1

Source of truth: planning/$1/REVIEW.md - THE BACKLOG.
- Implement ONLY findings marked FIX in its Decisions log.
- Where the Decisions log and a finding's §N text differ, the Decisions log is
  AUTHORITATIVE (it records the agreed fix after discussion).
- Do NOT touch findings marked DEFERRED / NO ACTION / OUT OF SCOPE. If you believe
  a deferred one should be done, raise it - don't just do it.
Context: planning/$1/PLAN.md (ACs) + planning/$1/DISCUSSION.md (LOCKED decisions -
a fix must NOT violate one; if it would, STOP and ask). EXECUTION_FLOW.md Phase 4.3
conventions. CLAUDE.md auto-loads.

Git: on branch feat/$1. Do NOT push until the user approves. No pushes between
commits.

Per-finding loop (Stage A/B/C/D):
A understand - open the cited files; confirm the finding still matches (line refs
  drift). If already stale/resolved, note it and ask.
B ask if needed - if ambiguous, or the agreed fix would violate a locked decision
  or the plan, STOP and ask. CRITICAL: if while implementing you find the AGREED
  FIX does NOT fully resolve the finding's stated problem (another field/read-path
  defeats it), STOP and report - do NOT silently expand scope or substitute a
  different fix.
C implement + scoped test - add/extend a scoped test under tests/<slug>/ that
  proves the finding is closed. Run the scoped tests:
  - backend unit: npx vitest run tests/<slug>
  - frontend: npm run typecheck
  - emulator slice (LOCAL gate, before commit): if the fix touches Firestore-backed
    code (repositories, domain queries, endpoints), run `cd backend; npm run test:emulator`
    (needs Java/Temurin 17) BEFORE committing. Your sandbox may lack Java; if so, STOP
    and have the operator run it locally - do not commit until green. CI re-runs it on
    the PR as a backstop, but catch failures here.
  For FE behavior you can't run in a browser, say so. Fix until green. Do NOT run the
  full suite (slow).
D commit - mark the finding [FIXED] in planning/$1/REVIEW.md and record the commit
  SHA there (NO git add of planning/), then ONE commit. Subject
  `<type>(<scope>): <subject>` (NO `review §N` / doc suffix). Body = a few SHORT
  self-contained bullets of WHAT changed; do NOT reference REVIEW/findings/planning
  docs; no long prose; no Co-Authored-By. Verify with git log --oneline -3.
Do NOT advance until the current finding is green + committed.

Final: run the union of touched scoped tests; report a table
| commit | finding | summary | plus what remains OPEN (the un-locked findings) so
the user can decide whether a re-review or another fix pass is warranted. Do NOT
push.

## Handoff (run in a NEW session per phase)
End your reply with a ready-to-paste prompt for the re-review phase. Fill
<delta-base-sha> = the commit that was HEAD BEFORE your first fix commit (i.e. what
the prior review pass covered up to) - report that SHA explicitly so it can be pasted:
```
/wf-rereview $1 <delta-base-sha>
```
