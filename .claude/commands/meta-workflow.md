---
description: Meta command - design a NEW `/`-command workflow (a family of phase commands + its discipline) or evolve an EXISTING one. Grounds in the command files, not app code. Maintains planning/workflow/ design docs. No app feature code, no push.
argument-hint: "<workflow-name> <goal: a new workflow, or a change to an existing one>"
---
You are my workflow architect. Your PRODUCT here is workflows themselves - families of
`/`-commands under `.claude/commands/` plus their discipline docs (FEATURE_FLOW.md,
CLAUDE.md conventions) - NOT app feature code. This one command both DISCUSSES the
change and, once a decision is locked, APPLIES it to the command files. NO app feature
code, NO push.

Workflow name: $1   (the workflow's prefix, kebab-case, e.g. `feature`, `bug`, `research`)
Goal: the rest of the arguments.

CLAUDE.md auto-loads. Read `planning/workflow/DESIGN.md` FIRST - it holds the naming
scheme and the running decisions log; honor it, do not relitigate locked items (raise
conflicts instead).

## Naming scheme (locked - see DESIGN.md D1/D2)
- Every phase command is `<workflow>-<phase>.md` -> `/<workflow>-<phase>`, flat under
  `.claude/commands/`. Subfolders do NOT namespace command names, so NEVER rely on a
  subfolder to disambiguate - the prefix is the namespace.
- This meta command is the one exception (cross-workflow, not a phase).

## Step 0 - NEW or EVOLVE
State which, confirm if unclear:
- EVOLVE: commands `$1-*` already exist, or `planning/workflow/$1/` does. Read that
  workflow's design notes + its command files before proposing a delta.
- NEW: authoring a workflow from scratch under prefix `$1`.

## Step 1 - GROUND (cite file:line; never invent paths)
- EVOLVE: open the target `$1-*` command files + FEATURE_FLOW.md + the relevant
  CLAUDE.md conventions; confirm current wording before changing it (files drift).
- NEW: read the existing `feature-*` (formerly `wf-*`) family as the REFERENCE for what
  a good workflow looks like here, then understand the task the new workflow serves.

## Step 2 - DESIGN (honor these principles - they are why the feature workflow works)
- Each phase runs in a NEW session; the handoff is a ready-to-paste next-command with
  concrete args, not chat memory. Every command ends by emitting the next prompt.
- Boundaries are HUMAN-GATED. Use AskUserQuestion for load-bearing forks; give concrete
  options with tradeoffs and rejected alternatives.
- Discuss phases write NO code and NO commits; execution phases commit per unit.
- Ground every claim in a real file; a decisions log is the contract downstream phases
  execute against.
- Prefer simplicity: cut any phase or command that earns its keep only as ceremony.
- Split axes that differ (work-unit vs behavior-unit, ephemeral vs persistent, intent
  vs actual) rather than conflating them onto one artifact.

For a NEW workflow decide: the phase list + one `$1-<phase>` command each, the handoff
chain, where its working docs live and their lifetime, the human-gates, and the
commit/branch discipline. For an EVOLVE decide the minimal delta and which files it
touches (including references - a missed handoff string breaks the chain).

## Step 3 - RECORD (the cumulative memory)
Update `planning/workflow/DESIGN.md` (cross-cutting decisions) and, for a specific
workflow, `planning/workflow/$1/DESIGN.md` (create if missing). Update incrementally.
Each decision: what + rationale + REJECTED ALTERNATIVES + date. This is the whole
point - it stores WHY so a future `/meta-workflow $1` session can pick up and
pressure-test instead of re-deriving.

## Step 4 - APPLY (only after the decision is locked, human-gated)
Edit/create the actual `.claude/commands/$1-*.md` (and FEATURE_FLOW.md / CLAUDE.md if
a convention changed) to match. Keep new commands in house style: terse imperative
steps, ASCII only, explicit args, a Handoff section emitting the next command. If the
workflow generates diagrams, route them through the diagram command; do not reinvent
it. For a rename/refactor, update EVERY reference in the same pass and grep afterwards
to prove none were missed.

## Discipline
- No app feature code. No push.
- These docs are tracked - commit `planning/workflow/**` in its OWN commit, separate
  from the command-file changes. Leave the commit to me unless I ask.
- Guard against navel-gazing: a workflow change is worth it only if it makes real
  feature work faster or safer. If it does not, say so and recommend dropping it.

## Handoff (continue in a NEW session)
Single-phase command - no forced next phase. End by summarizing what changed and emit a
ready-to-paste prompt to continue later:
```
/meta-workflow $1 <the next thing to design or refine>
```
