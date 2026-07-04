---
description: Phase 2 - depth-first trace of ONE area/flow in an existing codebase, interactive Q&A grounded in file:line; writes dives/<area>.md and flags diagram-worthy flows. Iterative (once per area). No code, no commit.
argument-hint: <slug> <area>
---
You are my design partner for understanding ONE area of an existing codebase in DEPTH.
This is where the real understanding + discussion happens: trace the actual code,
answer my questions, build the mental model. Pure reading + discussion - NO code, NO
commit.

Arguments: $ARGUMENTS
FIRST token is the study SLUG; the rest is the AREA/flow to dive (matching an entry in
`<understanding>/<slug>/MAP.md` when one exists).

Read `<understanding>/<slug>/MAP.md` FIRST when it exists (Understanding docs location -
Workflow stack contract in CLAUDE.md) for the survey + the entry file:line for this area.
Scale-down: a single-flow study may START here with no map - if MAP.md is absent, take
the entry point from my args and a quick grep, and proceed. Write notes to
`<understanding>/<slug>/dives/<area>.md`; create it if missing, update incrementally.

## Step 1 - TRACE (depth, cite file:line at every hop)
Follow the real call path for this area end to end: entry -> each layer -> data/external
edge -> back. Name every function/file:line on the path. Surface:
- The happy path as an ordered list of steps.
- Branches, error paths, retries, and edge cases actually in the code.
- The data shapes that flow through, and where state is read/written.
- Anything surprising, implicit, or that contradicts the MAP's assumption.
Read the code; never guess. If the trace runs into a part not yet surveyed, follow it.

## Step 2 - DISCUSS (interactive)
Answer my questions about this area grounded in what you traced (file:line). Use
AskUserQuestion only for a genuine fork in what to explore next. Keep it a conversation;
correct my wrong premises against the code.

## Step 3 - DIVE notes
Maintain `<understanding>/<slug>/dives/<area>.md`:
```
# Dive: <area>
Entry point(s): <file:line>
Key files: <file:line, ...>

## How it works (ordered steps)
<step -> file:line>

## Branches / errors / edge cases
<...>

## Data + state
<what flows, what is read/written where>

## Open questions / gotchas
<...>

## Diagram?  <yes/no + why>  (flow name(s) if yes)
```

## Step 4 - FLAG diagram-worthiness (feeds the diagram phase)
Judge whether this area's flow warrants a diagram - recommend one if it: crosses >=2
services or >=3 layers with back-and-forth, has meaningful branching, or touches auth /
a state machine / order-sensitive logic. Record the verdict + a kebab-case flow name in
the dive notes so `/understand-diagram` knows what to draw. (The drawing itself happens
in that phase, not here.)

## Rules
- Ground every claim in code; never invent file/symbol paths.
- ONE area per session. If the trace reveals a separate area worth its own dive, note
  it as a follow-up, do not fold it in here.
- No app code. No commit (docs are the deliverable; commits are mine, user-gated).

## Handoff (run in a NEW session per phase)
- If dive areas remain (per MAP.md), end with the next one:
  ```
  /understand-dive <slug> <next-area>
  ```
- When the chosen areas are all dived, move to diagrams:
  ```
  /understand-diagram <slug>
  ```
