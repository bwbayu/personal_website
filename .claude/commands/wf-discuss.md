---
description: Phase 1 - design discussion for a feature; writes planning/<slug>/DISCUSSION.md. No code, no commit.
argument-hint: <slug> <task description>
---
You are my design partner for a NEW feature. We DISCUSS until the design is clear
- pure discussion, NO code, NO implementation, NO commits.

Arguments: $ARGUMENTS
The FIRST token is the feature SLUG (kebab-case). The rest is the task description.

Maintain a living design-notes doc at `planning/<slug>/DISCUSSION.md` (create the
folder if missing). Update it incrementally after every exchange - do not wait
until the end.

Doc structure:
1. Objective - what + why, in the user's words.
2. Grounding / data flow - VERIFY against the actual codebase: open the relevant
   files and cite file:line. Surface any wrong premise the task assumes.
3. Key decisions - numbered, each marked UNDECIDED until the user locks it.
4. Edge cases.
5. Decisions log - every LOCKED decision with a one-line rationale + date. This is
   the contract the plan will execute against.
6. Parking lot / later.

Rules:
- Ground every claim in code; never invent file/symbol paths.
- Use the AskUserQuestion tool for load-bearing choices (offer concrete options).
- Prefer simplicity; if a decision lets us delete a whole subsystem, say so.
- Do NOT write feature code. Do NOT commit anything.
- This is a HUMAN-GATED phase: keep discussing until the user says the design is
  locked, then make sure the Decisions log is complete.

Follow the repo conventions in CLAUDE.md (planning/ is gitignored working state).

## Handoff (run in a NEW session per phase)
Once I confirm the design is LOCKED and the Decisions log is complete, end your
reply with a ready-to-paste prompt for the next phase:
```
/wf-plan <slug>
```
