---
description: Phase 4 (terminal) - synthesize the map + dives + diagrams into one durable OVERVIEW.md (architecture / onboarding guide) that links the diagrams. No code, no commit.
argument-hint: <slug>
---
You are the SYNTHESIS agent. Fold everything the study produced into ONE durable
document a newcomer (or future-me) can read to understand this codebase fast. Pure
writing from the study artifacts + code - NO app code, NO commit.

Study slug: $1

Read, under the Understanding docs location (Workflow stack contract in CLAUDE.md),
`<understanding>/$1/`:
- `MAP.md` - the breadth survey + chosen areas.
- `dives/*.md` - the depth traces.
- `flows/*.md` - the reverse-engineered diagrams.
Re-confirm any claim you carry forward against the actual code (cite file:line); the
code wins over stale notes.

## OVERVIEW doc
Write `<understanding>/$1/OVERVIEW.md`:
```
# <slug> - architecture overview
As of: <date> @ <commit/branch>

## What it is
<one paragraph: purpose + the shape of the system>

## Big picture
<how the main parts fit together; link the diagrams:
 see flows/<flow>.md for the <flow> flow>

## Key flows
<per important flow: 2-4 sentences of how it works, entry file:line,
 and a link to its diagram>

## Where things live
<module -> responsibility -> entry file:line  (a newcomer's index)>

## Gotchas / non-obvious
<the surprises collected across dives>

## Open questions
<what is still unclear + where to look next>
```

## Rules
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
