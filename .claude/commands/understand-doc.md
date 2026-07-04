---
description: Phase 4 (terminal) - synthesize whatever the study produced (map / dives / diagrams / code) into ONE durable OVERVIEW.md written for a junior/mid engineer new to the codebase - plain language, a reading order, and a concrete example per key flow. No code, no commit.
argument-hint: <slug>
---
You are the SYNTHESIS agent. Fold everything the study produced into ONE durable
document. WRITE IT FOR A JUNIOR/MID ENGINEER who is new to this codebase and has none of
your context: plain language, short sentences, expand jargon the first time it appears,
and lead with concrete examples over abstraction. Pure writing from the study artifacts +
code - NO app code, NO commit.

Study slug: $1

Read whatever EXISTS under the Understanding docs location (Workflow stack contract in
CLAUDE.md), `<understanding>/$1/` - none are strictly required:
- `MAP.md` - the breadth survey + chosen areas (may be absent for a single-flow study).
- `dives/*.md` - the depth traces (may be absent if dive was skipped).
- `flows/*.md` - the reverse-engineered diagrams.
If an artifact is missing, fill the gap by reading the code directly. Re-confirm any
claim you carry forward against the actual code (cite file:line); the code wins over
stale notes.

## OVERVIEW doc
Write `<understanding>/$1/OVERVIEW.md`:
```
# <slug> - architecture overview
As of: <date> @ <commit/branch>
Who this is for: an engineer new to this codebase.

## What it is
<2-3 plain sentences: what the system does and for whom, no jargon>

## Start here (reading order)
<a numbered path for a newcomer: read X first, then Y, then Z - so they are
 not dropped in cold. Point at the key files + the diagrams below.>

## Big picture
<how the main parts fit together, in plain language; link the diagrams:
 see flows/<flow>.md for the <flow> flow>

## Key flows
<per important flow:
 - 2-4 sentences of how it works, entry file:line, link to its diagram
 - a CONCRETE walked example (e.g. "a GET /users/42 request: router (file:line)
   -> service (file:line) -> repo (file:line) -> returns the user JSON")>

## Where things live
<module -> responsibility -> entry file:line  (a newcomer's index)>

## Glossary
<domain / project-specific terms a newcomer will hit, one line each. Omit if none.>

## Gotchas / non-obvious
<the surprises; say WHY each matters, not just what>

## Open questions
<what is still unclear + where to look next>
```

## Rules
- WRITE FOR A NEWCOMER (see the intro): plain language, short sentences, expand a term
  the first time it appears, at least one concrete example per key flow. If a sentence
  assumes context this codebase's newcomer would not have, rewrite it.
- Synthesize, do not dump - this is the readable overview, not a concatenation of the
  dive notes. Prefer the essential over the exhaustive.
- Every structural claim links to a file:line or a flow diagram; never invent paths.
- No app code. No commit - the deliverable is mine to review and commit (docs branch,
  never develop/main; for a repo I do not own, the slot points outside its tree).

## Handoff (terminal phase)
The study is complete. Summarize what the study produced (MAP + dives + diagrams +
OVERVIEW under `<understanding>/$1/`) and note that reviewing and committing the docs
is the remaining human-gated step. To study another codebase or subsystem, start fresh:
```
/understand-map <new-slug> <scope>
```
