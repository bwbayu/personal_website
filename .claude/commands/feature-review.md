---
description: Phase 4 - read-only review of the implementation vs plan + decisions + edge cases; writes planning/<slug>/REVIEW.md.
argument-hint: <slug> [base-branch]
---
You are a fresh-eyes REVIEW agent. REVIEW ONLY: no code changes, no commits, no
push. Produce review notes, then stop for triage with the user.

Feature slug: $1
Base branch (the branch feat/$1 was cut from): $2  (default the integration branch from the Workflow stack contract if blank; say which you used)

Read in full: planning/$1/PLAN.md (the contract), planning/$1/DISCUSSION.md (the
LOCKED Decisions log), FEATURE_FLOW.md (Phase 4 audit conventions: number every
finding §N, severity buckets, recommendation, never fix without referencing).
CLAUDE.md auto-loads - use its conventions to judge correctness.

Scope the diff to THIS feature only:
  git log --oneline <base>..HEAD
  git diff <base>...HEAD
If implementation is partial, map commits to plan tickets and mark un-built
tickets "pending - not reviewed" rather than flagging them as bugs.

Review on three axes, citing file:line evidence:
A. CONFORMANCE TO PLAN - per ticket: met / partial / missing / deviates, against
   its acceptance criteria.
B. CONFORMANCE TO LOCKED DECISIONS - each Decisions-log item: honored? evidence?
C. EDGE CASES - build a checklist (empty/edge inputs, error paths, idempotency,
   concurrency, missing files, partial payloads, etc.) and verify each.
Plus a lower-priority bucket for reuse / simplification / efficiency smells.

You MAY run the feature's scoped tests to validate, per the Workflow stack contract
(CLAUDE.md): the Scoped test command + the Static gate; do NOT run the full suite
(slow). The Pre-commit gate is the operator's pre-PR local gate - if you can run it, run
it and confirm it is green before recommending a PR; note it if you could not.

Output: planning/$1/REVIEW.md (discussion-notes style):
  1. Objective + scope (commits/tickets reviewed; what's pending)
  2. Plan-conformance table
  3. Decision-conformance table
  4. Edge-case checklist
  5. Findings - numbered §N, each: severity (BLOCKER / SHOULD-FIX / NICE-TO-HAVE /
     OUT-OF-SCOPE), file:line, what, why it matters, recommended fix, referenced
     ticket/decision
  6. Open questions for discussion
  7. Decisions log (empty - filled WITH the user during triage)

After writing: summarize counts by severity, the top items, and the questions you
most want answered. Do NOT start fixing - triage first.

## Handoff (run in a NEW session per phase)
Triage happens WITH me here (mark each finding FIX / DEFERRED / NO-ACTION in the
REVIEW Decisions log). Once findings are triaged, end your reply with the appropriate
next step:
- If anything is marked FIX: a ready-to-paste prompt for the fix phase:
  ```
  /feature-fix $1
  ```
- If nothing is marked FIX: say so — the review loop CLOSES here (no fix, no
  re-review). Next, run the diagram finisher to reconcile this feature's flow
  diagram(s) against the shipped code (it self-assesses; if the flow was never
  diagram-worthy it will say so and skip):
  ```
  /feature-diagram $1 final
  ```
  After that, the remaining steps are human-gated per the Branch model (Workflow stack
  contract): (1) push the feature branch to origin only after the user approves; the
  user then opens the PR into the integration branch — Claude never runs `gh pr create`
  or opens PRs; (2) the batch PR to the prod branch (which triggers the deploy) happens
  only AFTER all roadmap sessions are merged into the integration branch - NOT per
  session.
