# understand-* workflow - DESIGN (cumulative memory)

> Durable memory for the `understand-*` workflow: understanding an EXISTING codebase
> (a legacy project, or an open-source repo you want to learn), especially a large one.
> Owned/edited via `/meta-workflow understand`. Read this before evolving the workflow;
> honor locked decisions, raise conflicts instead of relitigating.

## 1. Objective
Turn a big, unfamiliar codebase into a navigable mental model plus two durable
artifacts: DIAGRAMS of the key flows and DOCUMENTATION (an architecture / onboarding
overview). The shape is breadth-first orientation, then depth-first tracing with
interactive discussion, then reverse-engineered diagrams, then a synthesized doc.
Distinct from `feature-*` (which BUILDS): this workflow only READS code and WRITES
docs - no app feature code, no push. Must be portable to other repos (incl. OSS you do
not own).

## 2. Grounding (verified 2026-07-04)
- Reuses the reverse-engineering discipline already proven in
  [feature-diagram.md](../../../.claude/commands/feature-diagram.md) mode=final
  (trace real call path -> Mermaid -> validate headless with mmdc). See
  feature-diagram.md:106-127 and the validation block at :78-88.
- Follows the naming scheme in [../DESIGN.md](../DESIGN.md) D1 (prefix
  `<workflow>-<phase>`, flat under `.claude/commands/`) and the portability pattern D6
  (per-repo values live as NAMED SLOTS in the CLAUDE.md "Workflow stack contract",
  never hardcoded in command bodies).
- Discussion style borrows from
  [feature-discuss.md](../../../.claude/commands/feature-discuss.md) (design partner,
  cite file:line, AskUserQuestion for load-bearing forks) and the breadth/session-plan
  shape of [feature-roadmap.md](../../../.claude/commands/feature-roadmap.md).

## 3. Decisions

### DU1 - Prefix = `understand` (2026-07-04)
Commands: `/understand-map`, `/understand-dive`, `/understand-diagram`,
`/understand-doc`.
- Rationale: the big picture is codebase understanding, not diagramming; the name must
  read as understanding. Unambiguous, no clash with a built-in.
- Rejected: `reverse-diagram` (too narrow - diagram is only one of four phases);
  `explore` (collides with the built-in `Explore` agent type - confusing); `grok`
  (slang); `onboard` (narrows it to new-joiner onboarding).

### DU2 - Four phases; diagram is its OWN command (2026-07-04)
`understand-map` (breadth, once) -> `understand-dive` (depth, xN, iterative) ->
`understand-diagram` (reverse-engineer flows) -> `understand-doc` (synthesize).
- Rationale: the axes genuinely differ - breadth (whole) vs depth (one part, fanned out
  N times) vs visual artifact (per-flow) vs prose synthesis (overall). Splitting keeps
  each phase single-purpose and each session small, per the workflow principles.
- `understand-diagram` is a DEDICATED command but is NOT a reinvention: it mirrors the
  reverse (code-true) half of feature-diagram - same Mermaid + headless-validate
  discipline, same FLOW template - only decoupled from the feature slug and always
  code-true (no intent mode; we are studying existing code).
- Rejected: 3 phases reusing feature-diagram directly (feature-diagram is coupled to a
  feature slug + planning/<slug>/ + docs/flows/ canonical; forcing understanding
  through it is a worse fit than a thin sibling); 2 phases folding
  dive+diagram+doc into one loop (one phase carries too much - breadth vs depth vs
  synthesis conflated).

### DU3 - Output location = ONE named slot; all study output under it (2026-07-04)
New slot "Understanding docs location" in the CLAUDE.md Workflow stack contract,
default `docs/understanding/`, per-study subfolder `docs/understanding/<slug>/`.
Layout under the slug folder: `MAP.md` (survey), `dives/<area>.md` (per dive),
`flows/<flow>.md` (reverse-engineered diagrams), `OVERVIEW.md` (final synthesis).
- Rationale: for understanding, EVERY artifact is a keeper (the map is durable, not
  ephemeral scratch), so there is no ephemeral/persistent split to make - one root is
  simplest. Making it a slot (not hardcoded) is required because the workflow must run
  on OTHER repos, incl. OSS you do NOT own - point the slot outside their tree so you
  never commit into someone else's repo. Consistent with D6.
- Diagrams live UNDER the understanding slot (`.../flows/`), NOT in the product's
  `docs/flows/` that feature-diagram owns: a study diagram is YOUR learning artifact,
  not a canonical the product team maintains. Different purpose -> different home.
- Rejected: all under `planning/understand/<slug>/` (planning/ is this repo's
  convention and tracked - not portable to a repo you do not own; also conflates study
  notes with the deliverable when here they are the same thing); a separate
  ephemeral/persistent split (no ephemeral half exists in a study).

### DU4 - Docs-only, no app code, commits user-gated (2026-07-04)
The whole workflow READS code and WRITES docs only. No app feature code, no push.
Commits are left to the user (consistent with the planning/ convention); if committing
into your own repo, use a docs branch, never `develop`/`main`. For a repo you do not
own, typically do not commit at all - the slot points outside the tree.

### DU5 - Scales from one flow to a whole codebase; no discipline doc yet (2026-07-04)
The workflow serves BOTH a whole-codebase study and a single-flow study - the knob is
the `<slug>` + scope arg + how many areas you dive. For a whole/large codebase, `map`
is what makes it tractable (breadth, then pick areas). For a SINGLE known flow, `map`
is optional: start directly at `/understand-dive <slug> <flow>` (a scale-down note in
both commands makes this explicit; understand-dive treats a missing MAP.md as fine).
- No `UNDERSTANDING_FLOW.md` (root discipline doc, sibling of FEATURE_FLOW.md) for now.
  Rationale: understand-*'s cross-phase discipline is thin (docs-only; no per-unit
  commit loop, no test discipline, no review/severity taxonomy) - the few shared rules
  ("ground in file:line", "no code / no commit", "human-gated") are 1-2 lines and
  already inline in each command. A parallel FLOW doc would be ~80% empty ceremony to
  keep synced. Follows D7's YAGNI precedent (defer a shared-discipline doc until a
  workflow actually needs it). The "flow at a glance" value already lives in section 4
  below.
- Revisit AFTER the first end-to-end run: if a real cross-phase discipline emerges
  (e.g. a per-dive commit rule, or a "refresh study when code drifts" loop), promote it
  into a lean UNDERSTANDING_FLOW.md then, and repoint the command citations to it.
- Rejected: a full mirror of FEATURE_FLOW.md now (most sections N/A -> ceremony);
  a lean flow-doc now (premature - unproven workflow).

## 4. Handoff chain
- `/understand-map <slug> [scope]` -> emits `/understand-dive <slug> <first-area>`
- `/understand-dive <slug> <area>` -> emits the NEXT `/understand-dive <slug> <area>`
  while areas remain, else `/understand-diagram <slug>`
- `/understand-diagram <slug>` -> emits `/understand-doc <slug>`
- `/understand-doc <slug>` -> terminal (user reviews + commits the deliverable)

## 5. Open items
- Unproven until run end-to-end. Plan: verify on THIS repo (personal-website) as the
  first real study, then use it on an external OSS project.
- If `understand-diagram` and feature-diagram's reverse half drift apart, consider
  extracting a shared "reverse Mermaid from code" snippet both cite (YAGNI until they
  actually diverge).

## 6. Porting to a new repo
The `understand-*` family is the MOST portable workflow here: it is docs-only (reads
code, writes docs), so it needs NONE of the feature-* slots (Scoped test / Static gate /
Pre-commit gate / Branch model). The four command files are self-contained - no
cross-reference to `feature-*` or to any path in this repo. The ONLY per-repo value is
one slot: the Understanding docs location.

Steps:
1. Copy `.claude/commands/understand-*.md` (4 files) into the new repo. (Optionally copy
   this `planning/workflow/understand/DESIGN.md` too if you want the rationale to travel.)
2. Carry your personal conventions (no Co-Authored-By, ASCII-only user strings, commits
   user-gated) - into the new repo's CLAUDE.md or once into a global `~/.claude/CLAUDE.md`.
3. Set the "Understanding docs location" slot (run the reusable prompt below).
4. Start: `/understand-map <slug> <scope>` (or `/understand-dive <slug> <flow>` for a
   single-flow study - see DU5 scale-down).

Reusable setup prompt (paste in the new repo after step 1):
```
Set up the understand-* workflow in THIS repo. Its commands are docs-only and stack-
agnostic except for ONE per-repo value: the "Understanding docs location" - the base dir
where a codebase-understanding study writes MAP.md, dives/, flows/, and OVERVIEW.md.

1. Decide the base dir:
   - If this is a repo I OWN and want the study committed, use docs/understanding/
     (per-study subfolder docs/understanding/<slug>/).
   - If this is a repo I do NOT own (an OSS project I am only studying), point it OUTSIDE
     the repo tree (e.g. ../notes/<repo>/ or an absolute path) so nothing is ever committed
     into someone else's tree. ASK me which case this is if unclear.
2. Add a "Workflow stack contract" section to CLAUDE.md if none exists (create CLAUDE.md
   if missing), and add ONE slot:
   - **Understanding docs location** (used by the understand-* workflow) - <the base dir
     you chose>, per-study subfolder <base>/<slug>/ (MAP.md, dives/<area>.md,
     flows/<flow>.md, OVERVIEW.md).
3. Report the chosen slot value + why. Do not commit.
```
