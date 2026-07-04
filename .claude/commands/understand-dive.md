---
description: Phase 2 - understand ONE area/flow of an existing codebase. Mode `trace` (default) - Claude discovers the flow from the code (cite file:line). Mode `capture` - Claude interviews you to record what you already know, then light-checks it against the code. Writes dives/<area>.md and flags diagram-worthy flows. Iterative. No code, no commit.
argument-hint: "<slug> <area> [trace|capture]"
---
You are my design partner for understanding ONE area of an existing codebase. This is
where the real understanding happens - either by tracing the code, or by capturing what
I already know. Pure reading + discussion - NO code, NO commit.

Arguments: $ARGUMENTS
FIRST token is the study SLUG. Then the AREA/flow to dive (matching an entry in
`<understanding>/<slug>/MAP.md` when one exists). An OPTIONAL last token is the MODE:
- `trace` (default) - I do NOT know this area yet; YOU discover the flow from the code.
- `capture` - I ALREADY understand this area; YOU interview me to record my mental model,
  then light-check it against the code.
If the last token is not `trace`/`capture`, treat it as part of the area name and default
to `trace`.

Read `<understanding>/<slug>/MAP.md` FIRST when it exists (Understanding docs location -
Workflow stack contract in CLAUDE.md) for the survey + the entry file:line for this area.
Scale-down: a single-flow study may START here with no map - if MAP.md is absent, take
the entry point from my args and a quick grep, and proceed. Write notes to
`<understanding>/<slug>/dives/<area>.md`; create it if missing, update incrementally.

## Step 1 - BUILD the understanding (mode-specific)

### mode = trace (default)
Follow the real call path for this area end to end: entry -> each layer -> data/external
edge -> back. Name every function/file:line on the path. Surface:
- The happy path as an ordered list of steps.
- Branches, error paths, retries, and edge cases actually in the code.
- The data shapes that flow through, and where state is read/written.
- Anything surprising, implicit, or that contradicts the MAP's assumption.
Read the code; never guess. If the trace runs into a part not yet surveyed, follow it.

### mode = capture
I already understand this area - your job is to EXTRACT and VERIFY my model, not
re-derive it from scratch.
1. Interview me: ask focused questions (batched AskUserQuestion) to pull out the flow -
   entry point, the ordered steps, branches / error paths, data + state, and the gotchas
   I know. Probe what I leave vague; do NOT lecture me on what I just explained.
2. Light cross-check: verify my account against the code with targeted reads/greps (cite
   file:line) - enough to confirm the entry point and the main hops, NOT a full trace.
3. Flag divergence: wherever the code contradicts or does not support what I said, SAY SO
   and reconcile with me. This catch is the whole point of not skipping - a
   confident-but-wrong model is exactly what turns into a wrong diagram.
Then write the same dive notes (Step 3) from the reconciled understanding.

## Step 2 - DISCUSS / RECONCILE (interactive)
trace: answer my questions about the area grounded in what you traced (file:line);
correct my wrong premises against the code. capture: walk me through any divergence you
found and settle it. Either way, use AskUserQuestion only for a genuine fork.

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
- If dive areas remain (per MAP.md), end with the next one (add `capture` if I already
  know that area):
  ```
  /understand-dive <slug> <next-area> [trace|capture]
  ```
- When the chosen areas are all dived, move to diagrams:
  ```
  /understand-diagram <slug>
  ```
