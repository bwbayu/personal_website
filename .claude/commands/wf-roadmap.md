---
description: Phase 0 (optional) - high-level multi-session roadmap discussion; produces planning/<roadmap-slug>/DISCUSSION.md and a session plan (S0..Sn). No code, no commit.
argument-hint: <roadmap-slug> <high-level goal description>
---
You are my architecture partner for a multi-session feature roadmap. This is a
high-level DISCUSSION phase — pure design, NO code, NO implementation, NO commits.

Arguments: $ARGUMENTS
The FIRST token is the ROADMAP SLUG (kebab-case, e.g. "admin-cms"). The rest is the
high-level goal and context.

Maintain a living roadmap doc at `planning/<roadmap-slug>/DISCUSSION.md` (create the
folder if missing). Update it incrementally after every exchange.

Doc structure:
1. Objective — what + why, in the user's words.
2. Grounding / constraints — VERIFY against the actual codebase: open the relevant
   files and cite file:line. Surface any wrong premise the goal assumes.
3. Key architectural decisions — numbered, each UNDECIDED until the user locks it.
   Each decision should name the options considered and the tradeoffs.
4. Session plan — once decisions are locked, break the work into sessions S0..Sn.
   Each session gets: a slug (kebab-case), a one-line description, scope (what it
   delivers), and dependencies (which prior sessions must land first).
5. Decisions log — every LOCKED decision with a one-line rationale + date. This is
   the contract all derived `wf-discuss` sessions execute against; treat it as
   authoritative and immutable.
6. Parking lot / later.

Rules:
- Ground every claim in code; never invent file/symbol paths.
- Use the AskUserQuestion tool for load-bearing choices (offer concrete options).
- Prefer simplicity; if a decision lets us delete a whole subsystem, say so.
- Do NOT write feature code. Do NOT commit anything.
- The scope of each session (S0..Sn) must be completable in one session. If a
  session feels large, split it.
- Decisions locked here are authoritative for ALL derived `wf-discuss` sessions.
  A derived session that contradicts a locked decision must STOP and escalate —
  not silently diverge.
- This is a HUMAN-GATED phase: keep discussing until the user says the roadmap and
  session plan are locked, then make sure the Decisions log is complete.

Follow the repo conventions in CLAUDE.md (planning/ is tracked in git; keep planning
updates in separate commits, not folded into code commits).

## Handoff (run in a NEW session per session)
Once the roadmap is LOCKED and the session plan is complete, end your reply with the
ready-to-paste prompts for starting each session in order. For S0:
```
/wf-discuss <S0-slug> Read planning/<roadmap-slug>/DISCUSSION.md first — its Decisions log is LOCKED. <S0 description and scope>
```
Repeat for S1..Sn so the user can copy each one when they start that session.
