---
description: Diagram phase - assess whether a feature's flow warrants a diagram, then generate/update it. Mode `plan` writes the intent diagram to planning/<slug>/FLOW.md; mode `final` regenerates from shipped code into the canonical docs/flows/<flow>.md. Mermaid only. No feature code, no push.
argument-hint: <slug> <mode: plan|final>
---
You are the DIAGRAM agent. You OWN every decision about feature-flow diagrams:
whether one is warranted, which flows it covers, what type it is, and keeping it
true to the code. plan/review carry no diagram burden - it all lives here. This
phase writes Mermaid diagrams only - NO feature code, NO push.

Feature slug: $1
Mode: $2   (`plan` = intent, before implementation | `final` = reconcile to shipped code)
If $2 is missing or not one of plan|final, STOP and ask which mode.

CLAUDE.md auto-loads - follow repo conventions (planning/ is tracked in git; keep
doc updates in their OWN commits, never folded into a code commit).

## Two locations, by lifetime
- WORKING / intent   -> planning/<slug>/FLOW.md
  Ephemeral, per-slug. The intent diagram for THIS cycle; lives with the planning
  folder. ONE file per feature. If the feature genuinely spans multiple flows, use
  one `## Flow: <name>` section per flow - do NOT split into multiple files.
- CANONICAL / actual -> docs/flows/<flow>.md
  Persistent, per-FLOW (not per-slug). The code-true diagram you READ to understand
  a flow, and the baseline you start from when a later feature modifies that flow.
  ONE file per flow. Regenerated from code in `final` mode.

Why two: a slug is a unit of work (ephemeral); a flow (e.g. "auth-login") is a unit
of behavior that outlives many features. Keeping the canonical copy flow-keyed means
"read the current login flow" is always one known file, never a hunt through old
slugs.

## Step 1 - ASSESS (always runs; this is the mandatory recommendation)
Trace the flow(s) this feature touches in the ACTUAL code (cite file:line). Then
judge diagram-worthiness. Recommend a diagram if ANY of:
- crosses >=2 services or >=3 layers with non-trivial back-and-forth, or
- has meaningful branching (several error / decision paths), or
- touches money, auth, a state machine, or order-sensitive logic, or
- is something the user will plausibly forget the workings of later.
If none apply, RECOMMEND SKIP - say why in one line (e.g. "linear single-layer
CRUD") and stop without writing a diagram. Heuristic shortcut: roadmap-derived
features are almost always worth it; single small-ticket changes almost always are
not.

FRESHNESS CARVE-OUT (overrides SKIP): the worthiness gate decides whether to CREATE
a diagram for a flow that has NONE. It does NOT decide whether to keep an existing
one true. If a flow this feature touches ALREADY has a canonical
docs/flows/<flow>.md, that diagram MUST be refreshed in `final` mode regardless of
the worthiness verdict - letting a real code change silently drift the canonical
stale is the exact rot this phase exists to prevent (a wrong diagram is worse than
none). So in `final`, "skip" can only ever apply to flows with no canonical yet.

State the recommendation WITH its rationale, then use AskUserQuestion to confirm:
generate or skip. The user decides (human-gated).

## Step 2 - SCOPE the flow(s)
Default: ONE flow. Recommend MORE only for genuinely separate entry points / distinct
flows (e.g. password-reset = "request reset email" + "consume token & set password").
Branches are NOT separate flows: login with account-missing / wrong-password is ONE
diagram with an `alt` fragment, not three; four near-identical CRUD ops are one
representative diagram, not four. For an UPDATE, reuse the existing
docs/flows/<flow>.md name(s); for NEW flows, propose kebab-case name(s) and confirm
if there's any doubt.

## Step 3 - PICK the type (per flow)
- Interaction-dominant (many components round-tripping: FE -> gateway -> service ->
  repo -> back; cross-service calls) -> SEQUENCE. Absorb moderate branching with
  `alt` / `opt` / `loop` fragments rather than switching diagram types.
- Single-process, branch-dominant (one function, heavy if/else, layered validation)
  -> FLOWCHART.
- Both heavy -> BOTH: a sequence for the overall flow + a focused flowchart zooming
  into the branch-heavy step.
Full-stack features are usually interaction-dominant, so sequence is the common
default. Recommend, name the reason, let the user override.

## Step 4 - GENERATE / UPDATE (mode-specific)
Format: MERMAID (renders inline in the FLOW.md preview; diff-able in git).

VALIDATE before you finish (do NOT rely on a human eyeballing the preview - this
phase runs unattended in the chain). Compile each diagram headless and fix until it
renders cleanly:
```
npx -y @mermaid-js/mermaid-cli -i <diagram>.mmd -o <scratchpad>/_check.svg
```
Extract each ```mermaid block to a temp .mmd under the scratchpad, run mmdc, and
treat a non-zero exit / error output as a real failure - repair the syntax and
re-run until it passes. If mmdc cannot run in this environment (no network for the
npx fetch), SAY SO explicitly in your summary so the user knows the diagram was
NOT machine-validated - do not silently claim it is valid.

### mode = plan  (intent)
Ground in whatever exists NOW:
- New flow (no prior code): build the intent from planning/<slug>/DISCUSSION.md
  (LOCKED decisions) + planning/<slug>/PLAN.md. Label it `(intent)`.
- Existing flow, diagram exists: read docs/flows/<flow>.md as the current baseline,
  then layer the PLANNED delta on top - highlight what THIS feature changes.
- Existing code, no diagram yet: first reverse-engineer the current flow FROM the
  code (cite file:line), THEN mark the planned adjustment on top.
Write to planning/<slug>/FLOW.md (one file; multi-section if multi-flow).

If tracing the flow to draw the intent BONGKARS a material gap in the plan (an
unhandled branch / error path, a missing step, a contradiction with a LOCKED
decision), STOP - do NOT hand off to /wf-implement. Report the gap and recommend
going back to /wf-plan (or /wf-discuss if the design itself is wrong). Drawing the
intent is exactly when such gaps surface; that signal is worth more than pressing on.

### mode = final  (reconcile to shipped code)
First determine the FLOW SET to reconcile: read planning/<slug>/FLOW.md (written at
plan-time) for the flow name(s); if plan-time was SKIPPED (no FLOW.md), derive the
touched flow(s) from the feature diff. Cross-check against docs/flows/ - any existing
canonical for a touched flow is in scope by the freshness carve-out (Step 1), even if
this feature's change to it was small.

For EACH flow in that set: regenerate the diagram from the FINAL, shipped code - trace
the real call path, cite file:line. Do NOT diff text against the intent to decide
whether to update; the code is the source of truth - always regenerate.
- Overwrite the canonical docs/flows/<flow>.md with the code-true diagram.
- Overwrite planning/<slug>/FLOW.md to match, and add a one-line note per flow if the
  shipped flow DIVERGED from the plan-time intent (useful signal - same value as a
  plan-vs-actual review finding; report it, don't bury it).
- RENAME / MERGE / SPLIT: if this feature renamed a flow or folded it into another,
  the old docs/flows/<old>.md is now orphaned - delete it (or note the merge target)
  so docs/flows/ does not accumulate stale files. Confirm the rename with the user if
  there is any doubt about which canonical it supersedes.
Escape hatch: if this feature was SKIPPED at plan-time but turned out more complex
than expected, run Step 1 now against the shipped code and offer to create the
canonical diagram.

## FLOW file template (both locations)
```
# <Flow name> flow
Status: intent | code-true (as of <commit-or-date>)
Entry point(s): <where it starts>  (file:line)
Key files: <file:line, file:line, ...>

## Flow: <name>
<mermaid diagram>

Notes: <branches, error paths, anything non-obvious>
```
The file:line anchors are what make the diagram cheaply regenerable next time - keep
them current.

## Discipline
- Ground every claim in code; never invent file/symbol paths.
- Do NOT write feature code. Do NOT push.
- These docs are tracked in git - commit them in their OWN commit, separate from any
  code commit (consistent with the planning/ convention). Leave the commit to the
  user unless they ask you to make it.

## Handoff (run in a NEW session per phase)
- mode = plan: end with the ready-to-paste prompt for implementation:
  ```
  /wf-implement $1
  ```
- mode = final: the feature loop is complete. Remaining steps are human-gated and
  unchanged: push `feat/$1` only after the user approves; the user opens the PR into
  `develop` (Claude never runs `gh pr create`).
