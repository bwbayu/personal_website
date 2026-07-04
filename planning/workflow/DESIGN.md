# Workflow system - DESIGN (cumulative memory)

> This file is the durable memory for how THIS repo's `/`-command workflows are
> named, organized, and authored. It exists so the reasoning survives across
> sessions: open it, read the decisions log, then continue. Owned/edited via the
> `/meta-workflow` command.

## 1. Objective
Bayu likes designing multi-phase `/`-command workflows (discuss -> plan -> implement
-> review -> ...). Today there is effectively ONE such workflow (feature development,
the `wf-*` family). The goal is to support MULTIPLE distinct workflows for different
kinds of task (feature dev, bug triage, research, data migration, ...) without their
commands colliding or becoming ambiguous, and to keep the *why* behind each workflow's
shape from evaporating each session.

## 2. Grounding (verified against Claude Code docs, 2026-07-04)
Source: https://code.claude.com/docs/en/slash-commands ("How a skill gets its command
name" table). Key facts that shaped the scheme:
- `.claude/commands/deploy.md` -> `/deploy`. Command name = FILE NAME without
  extension. A subfolder under `.claude/commands/` does NOT namespace the command, so
  `.claude/commands/feature/discuss.md` and `.claude/commands/bug/discuss.md` would
  BOTH be `/discuss` -> collision.
- Real colon-namespaces (`/feature:discuss`) come ONLY from plugins
  (`my-plugin/skills/review/SKILL.md` -> `/my-plugin:review`) or from nested
  `.claude/skills/` dirs on a name clash (`/apps/web:deploy`, monorepo-oriented).
- "Custom commands have been merged into skills." `.claude/commands/*.md` files keep
  working and support the same frontmatter; skills (a dir + `SKILL.md`) are the modern
  form and add supporting-file support.

## 3. Decisions

### D1 - Namespace scheme = prefix `<workflow>-<phase>` (flat)
Each workflow owns a prefix; every phase command is `<workflow>-<phase>`, e.g.
`feature-discuss`, `feature-plan`, `bug-triage`, `research-explore`. Files stay flat
under `.claude/commands/` (no subfolders for naming).
- Rationale: guaranteed to work (pure filenames), zero extra machinery, everything
  stays a committed file in the repo, and the prefix makes the owning workflow obvious.
- Rejected: (A) subfolder `.claude/commands/<workflow>/<phase>.md` -> does NOT
  namespace per the docs above; same-named phases collide. (B) plugin per workflow ->
  gives real `/feature:discuss` but costs a plugin manifest, a `skills/<phase>/SKILL.md`
  dir per phase, and an enable step; overkill for a single personal repo. (C) flat +
  ad-hoc names -> namespace rots as workflows multiply.

### D2 - The meta tool is a single, standalone command: `/meta-workflow`
One command owns designing AND applying workflow changes (discuss + edit the command
files in the same session). It is exempt from the `<workflow>-<phase>` scheme because
it operates ACROSS workflows rather than being a phase of one.
- Rationale: authoring a workflow has no test/execute loop, so a discuss/apply split
  buys little; keep it one command. Cross-cutting -> its own name.
- Rejected: a two-command `meta-discuss` / `meta-apply` split (unneeded ceremony); a
  single global `DECISIONS.md` for all workflows (does not fit authoring NEW workflows).

### D3 - Per-workflow design docs live under `planning/workflow/`
This file holds the cross-cutting scheme. Each individual workflow gets its own design
notes (its phase list, handoff chain, rationale) so a future session can extend it.
- Rationale: mirrors how `wf-discuss` gives each feature its own `planning/<slug>/`.

### D4 - Author new workflows as `.claude/commands/*.md` files (for now)
Keep the existing commands-file form to match the repo; note skills (dir + `SKILL.md`)
as the modern alternative if supporting files are ever needed.

### D5 - Rename the existing `wf-*` family to `feature-*` for consistency (DONE 2026-07-04)
The current feature workflow becomes the first named workflow under D1. All 8 command
files were renamed (`git mv`, history preserved) and every in-scope reference updated
in the same pass - see the migration plan below. Applied in the working tree.

### D6 - Stack layer parameterized; the workflow is portable (DONE 2026-07-04)
The `feature-*` commands + FEATURE_FLOW.md were made stack-agnostic. All hardcoded
test commands, test dir, and branch/deploy names (~40 tokens across 6 command files +
FEATURE_FLOW) were replaced by references to NAMED SLOTS in a new "Workflow stack
contract" section of CLAUDE.md: Scoped test, Static gate, Pre-commit gate, Test
location, Branch model, Stack. Command bodies now say e.g. "run the Scoped test command
(see the contract)" instead of `npx vitest ...`.
- Rationale: the stack tokens made the workflow non-portable; concentrating them in one
  auto-loaded contract makes CLAUDE.md the SINGLE per-repo file to swap.
- Location: contract lives in CLAUDE.md (auto-loaded, always in context). Rejected: a
  separate `planning/workflow/STACK.md` (needs an explicit read per command; not
  auto-loaded).
- Trade-off accepted: command bodies no longer name the exact tool, slightly less
  literal, but fully portable.
- Port recipe: copy `.claude/commands/` + `FEATURE_FLOW.md`, then rewrite ONLY the
  CLAUDE.md "Workflow stack contract" section for the new repo.

### D7 - Rename EXECUTION_FLOW.md -> FEATURE_FLOW.md (2026-07-04)
The feature workflow's discipline doc was renamed from the generic `EXECUTION_FLOW.md`
to `FEATURE_FLOW.md` so it reads as feature-scoped, consistent with the `feature-*`
command family. Its H1 + every live reference (CLAUDE.md, the 5 phase commands that
cite it, meta-workflow.md, this doc's port recipe) were updated in the same pass;
historical `planning/<slug>/` records keep the old name (dated, not live).
- Deferred: parts of the doc are cross-workflow discipline (commit conventions, git
  rules, human-gates). Splitting those into a shared doc is premature (YAGNI) - do it
  only when a second workflow (e.g. `bug-*`) needs them.

## 4. Migration plan - wf-* -> feature-* (D5)
Applied in the working tree (renames staged via `git mv`, references updated); commit
still pending - the log has no rename commit yet, so the earlier "executed as two
commits" note was inaccurate and is removed. Historical `planning/<slug>/` docs
(discussion/plan/review of past features) intentionally keep their `wf-*` mentions -
they are dated records, not live references. Original plan below.
Rename each command file and fix every internal reference. Files:
`wf-roadmap -> feature-roadmap`, `wf-discuss -> feature-discuss`,
`wf-plan -> feature-plan`, `wf-implement -> feature-implement`,
`wf-review -> feature-review`, `wf-fix -> feature-fix`,
`wf-rereview -> feature-rereview`, `wf-diagram -> feature-diagram`.
References to update in the SAME pass (a missed one breaks the handoff chain):
- The handoff prompt at the end of every command (`/wf-plan $1` -> `/feature-plan $1`,
  etc.).
- `CLAUDE.md` mentions of `.claude/commands/wf-*`.
- `EXECUTION_FLOW.md` phase table + prose ("the `wf-*` commands").
- Any `/wf-*` string inside command bodies (e.g. cross-references, examples).
Do it as ONE focused pass (ideally driven by `/meta-workflow feature ...`), verify with
a repo-wide grep for `wf-` afterwards, commit as a single docs change.

## 5. Open items
- Whether later workflows should be authored as skills (dir + SKILL.md) instead of
  flat command files - revisit if one needs bundled supporting files.
- No second workflow exists yet; D1 is validated only against the feature family until
  a real second workflow (e.g. `bug-*`) is built.
- D6 portability is unproven until the workflow is actually copied to a second repo and
  run with only the CLAUDE.md contract rewritten - do that dry-run before relying on it.
