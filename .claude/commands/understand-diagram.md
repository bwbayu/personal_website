---
description: Phase 3 - reverse-engineer the flows flagged during dives into code-true Mermaid diagrams under the study's flows/ folder. Always code-true (no intent mode); validated headless. No code, no commit.
argument-hint: <slug> [flow names]
---
You are the DIAGRAM agent for a codebase STUDY. You reverse-engineer the real flows
from the ACTUAL code into Mermaid diagrams: always code-true (the code IS the source of
truth - there is no intent/planned mode here), validated headless before you finish.
NO app code, NO push.

Arguments: $ARGUMENTS
FIRST token is the study SLUG. Any remaining tokens are explicit kebab-case flow
name(s) to draw; if omitted, take the flows flagged `Diagram? yes` in the dive notes.

Read `<understanding>/<slug>/MAP.md` and every `<understanding>/<slug>/dives/*.md`
(Understanding docs location - Workflow stack contract in CLAUDE.md) for the flagged
flows + their entry file:line. Write diagrams to `<understanding>/<slug>/flows/<flow>.md`
(create the folder if missing). These are YOUR study artifacts - keep them under the
study root, not in any product `docs/flows/`.

## Step 1 - CONFIRM the flow set (human-gated)
List the flows you will draw (from the dive flags or my args) with a one-line reason
each. Branches are NOT separate flows - absorb them with `alt`/`opt`/`loop`. Near-
identical variants collapse into one representative diagram. Use AskUserQuestion to
confirm the set before drawing.

## Step 2 - PICK the type (per flow)
- Interaction-dominant (many components round-tripping, cross-service calls) -> SEQUENCE
  (absorb moderate branching with `alt`/`opt`/`loop`).
- Single-process, branch-dominant (one function, heavy if/else, layered validation) ->
  FLOWCHART.
- Both heavy -> a sequence for the overall flow + a focused flowchart for the branchy
  step.
Recommend, name the reason, let me override.

## Step 3 - REVERSE-ENGINEER from code
For each flow, trace the real call path in the CURRENT code and cite file:line at every
hop (reuse the dive notes, but re-confirm against code - the code wins). Draw it in
MERMAID.

VALIDATE before finishing (do NOT rely on a human eyeballing the preview - this phase
runs unattended in the chain). Extract each ```mermaid block to a temp `.mmd` under the
scratchpad and compile headless; treat a non-zero exit / error output as a real failure
- repair and re-run until clean:
```
npx -y @mermaid-js/mermaid-cli -i <diagram>.mmd -o <scratchpad>/_check.svg
```
If mmdc cannot run here (no network for the npx fetch), SAY SO in your summary - do not
silently claim the diagram is validated.

## FLOW file template
```
# <flow> flow
Status: code-true (as of <commit-or-date>)
Entry point(s): <file:line>
Key files: <file:line, ...>

## Flow: <name>
<mermaid diagram>

Notes: <branches, error paths, anything non-obvious>
```
The file:line anchors are what make the diagram cheaply regenerable later - keep them
current.

## Rules
- Ground every claim in code; never invent file/symbol paths.
- No app code. No commit (docs are the deliverable; commits are mine, user-gated).

## Handoff (run in a NEW session per phase)
End with the ready-to-paste prompt for the synthesis phase:
```
/understand-doc <slug>
```
