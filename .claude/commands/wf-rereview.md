---
description: Phase 6 - verify the fixes + review only the fix delta; appends a "Pass N" section to planning/<slug>/REVIEW.md.
argument-hint: <slug> <delta-base-sha>
---
You are a fresh-eyes RE-REVIEW agent (PASS N). VERIFY the just-closed fixes and
review ONLY the delta they introduced - NOT a full re-audit. REVIEW ONLY: no code
changes, no commits, no push.

Feature slug: $1
Delta base = the last commit the PREVIOUS pass reviewed: $2

Read: planning/$1/REVIEW.md (prior findings + Decisions log: which were FIX vs
DEFERRED / NO ACTION / OUT OF SCOPE), planning/$1/DISCUSSION.md (LOCKED decisions),
EXECUTION_FLOW.md (Phase 4.5 re-audit conventions). CLAUDE.md auto-loads.

Scope the delta (fix commits only):
  git log --oneline $2..HEAD
  git diff $2..HEAD
Do NOT use a bare `git log --grep='review'` - older audit cycles can share that
suffix; scope strictly by the $2..HEAD range.

Do:
A. VERIFY each [FIXED] finding actually holds AND fully resolves its stated problem
   (file:line evidence): verified-fixed / partial / not-fixed / regressed. If an
   agreed fix is insufficient, that is a NEW finding.
B. Review the delta for regressions or NEW issues the fixes introduced (violated
   locked decision, broken adjacent behavior, missing/weak test, type error).
C. Confirm each fix shipped with a scoped test that proves closure; flag any
   "fixed without a test".
You MAY run the feature's scoped tests (backend unit `npx vitest run tests/<slug>`,
frontend `npm run typecheck`); do NOT run the full suite (slow). Re-review is the gate
before the PR - if you have Java, run the emulator slice
(`cd backend; npm run test:emulator`, Temurin 17) and confirm it is green before
recommending CLOSE; flag it if you could not run it locally.

Output - APPEND to planning/$1/REVIEW.md (do NOT overwrite prior passes):
  # Pass N review
  ## Status of previous FIX findings   (table: §N -> verified-fixed / partial /
     not-fixed / regressed -> evidence)
  ## New findings   (continue numbering AFTER the highest existing §; same format)
  ## Recommendation   (CLOSE - no new FIX-worthy findings - or another fix pass;
     name what blocks close)
Anti-pattern: do NOT silently re-open a closed finding by editing its prior
verdict; write a NEW finding that REFERENCES the old §N.

After writing: summarize verified / partial / regressed, new findings by severity,
and your CLOSE / another-pass recommendation. Do NOT start fixing.

## Handoff (run in a NEW session per phase)
End your reply with the appropriate next step:
- If you recommend ANOTHER pass: a ready-to-paste prompt to fix the new findings
  (after I triage them) - `/wf-fix $1`.
- If CLOSE: state the review loop is done. Remaining steps are human-gated:
  (1) push `feat/$1` to origin and open a PR into `develop`
  (`gh pr create --base develop`); (2) the final PR `develop` -> `main` (which
  triggers the prod deploy) happens only AFTER all roadmap sessions are merged into
  develop - NOT per session. Ask me for approval before pushing or opening any PR;
  do NOT push yourself.
