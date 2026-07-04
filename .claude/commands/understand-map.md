---
description: Phase 1 - breadth-first orientation of an EXISTING codebase; writes MAP.md (purpose, structure, entry points, deps, run/build/test) and a ranked list of areas worth diving into. No code, no commit.
argument-hint: <slug> <optional scope/goal>
---
You are my orientation partner for an EXISTING codebase (a legacy project or an OSS
repo I want to understand). This phase is BREADTH-FIRST: map the territory so the rest
is tractable. Pure reading + discussion - NO code, NO commit.

Arguments: $ARGUMENTS
The FIRST token is the study SLUG (kebab-case, e.g. the repo or subsystem name). The
rest is optional scope. This is WHERE you define a SUBSET: if I only want some features
(e.g. "only checkout, refunds, notifications - ignore the rest"), say so here and the
survey is bounded to them; if I say nothing / "whole codebase", the survey covers
everything.

Output goes under the Understanding docs location (Workflow stack contract in
CLAUDE.md), per-study folder `<understanding>/<slug>/`. Write `MAP.md` there; create
the folder if missing. Update it incrementally as you learn - do not wait until the end.

Scale-down: this phase is for orienting in an UNFAMILIAR or LARGE codebase. If the
study targets a SINGLE known flow, map is optional - skip straight to
`/understand-dive <slug> <flow>`. Run map when you need the territory first.

## Step 1 - SURVEY (breadth, ground every claim in files)
SCOPE FIRST: if my scope names a SUBSET of features/areas, survey and rank ONLY those,
plus the shared / cross-cutting parts they depend on (config, auth, the data layer) -
do NOT map the whole repo. If the scope is whole-codebase or unspecified, sweep
everything. Locate the named features in the tree first (grep/glob), then survey within
that boundary.

Sweep top-down; cite file:line. Do NOT read everything - sample enough to answer:
- Purpose: what the system does, for whom (README / package manifest / docs).
- Top-level structure: the main modules/packages/domains and how they are split.
- Entry points: process starts, HTTP routers, CLI mains, job/cron entries, build
  targets.
- Data + external edges: data stores, queues, third-party APIs, auth boundaries.
- Cross-cutting: config, logging, error handling, the shared/util layer.
- Run/build/test: how to run it, build it, and test it (scripts / Makefile / CI).
- Stack + conventions: languages, frameworks, notable patterns.
Prefer the search/glob tools for the sweep; open files only to confirm.

## Step 2 - MAP doc
Write `<understanding>/<slug>/MAP.md`:
```
# <slug> - codebase map
Surveyed: <date> @ <commit/branch>
Purpose: <one paragraph>

## Structure
<module -> what it does (file:line for the entry of each)>

## Entry points
<name -> file:line -> what it kicks off>

## Data + external edges
<stores / queues / external APIs / auth boundary, each with file:line>

## Run / build / test
<the commands, cited from scripts/CI>

## Stack + conventions
<languages, frameworks, notable patterns>

## Candidate dive areas (ranked)
1. <area/flow> - why it matters, rough complexity, entry file:line
2. ...
```

## Step 3 - PICK dive areas (human-gated)
Rank the candidate areas by understanding value: prefer the flows that are central,
non-obvious, or that unlock the rest (auth, the core request/data path, a state
machine, the money path). Recommend an order, then use AskUserQuestion to let me pick
which area(s) to dive into first and in what order. Record the chosen order in MAP.md.

## Rules
- Ground every claim in code; never invent file/symbol paths. If the repo contradicts
  a premise in my scope, say so.
- Breadth over depth here - resist tracing a single flow line-by-line; that is the dive
  phase. If an area needs it, note it as a candidate instead.
- No app code. No commit. Docs are the deliverable; commits are mine and user-gated
  (follow CLAUDE.md conventions).

## Handoff (run in a NEW session per phase)
Once MAP.md is written and I have picked the areas, offer the ready-to-paste next step -
the phases are a MENU, not a fixed pipeline, so give me the branch:
- I do NOT know an area yet -> trace it:
  ```
  /understand-dive <slug> <first-area>
  ```
- I ALREADY understand an area but want it recorded/verified -> capture mode:
  ```
  /understand-dive <slug> <first-area> capture
  ```
- I already understand the flows and only want the diagrams + doc -> SKIP dive:
  ```
  /understand-diagram <slug> <flow-names>
  ```
