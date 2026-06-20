# Backend Test Harness (S0) — Review (Phase 4)

> Fresh-eyes, read-only audit of `develop..HEAD` on `feat/test-harness`.
> Base used: **`develop`** (slug `test-harness`). No code changed; triage with the
> user fills §7.

## 1. Objective + scope

Reviewed all 8 commits on `feat/test-harness` (the S0 harness + CI wiring), mapped to
PLAN tickets TH-1..TH-7 plus one unplanned follow-up commit:

| Commit | Ticket | Subject |
|---|---|---|
| 0dba49b | TH-1 | vitest unit harness + sample util test |
| b9462b9 | TH-2 | skills DI factories + repo db param |
| 1d29738 | TH-3 | firestore emulator wiring + generic repo emulator test |
| 74e3c01 | TH-4 | skills endpoint smoke (auth + zod + CRUD) |
| b7fd0a4 | TH-5 | PR-gate ci.yml |
| 9176a93 | TH-6 | backend-deploy 3-layer (test->build->deploy) |
| f97f335 | TH-7 | frontend-deploy gated behind typecheck |
| f7319b6 | — (unplanned) | use version tags instead of pinned SHAs for actions |

All seven tickets are built — none pending. The lockfile (`package-lock.json`, +11k
lines) was not line-reviewed (mechanical).

**What I executed:** `npx vitest run tests/test-harness` -> 2 files / 9 tests green;
unit run correctly excludes the 2 `*.emulator.test.ts` files (proves the suffix
split). `npx tsc --noEmit` over the whole backend -> exit 0 (TH-2 cross-domain compile
confirmed: the 8 unconverted domains still build against the new optional `db` param).
**Not executed:** the emulator slice (TH-3/TH-4) — needs a Java runtime + the Firestore
emulator, out of reach in this review env. Those were code-reviewed only.

## 2. Plan-conformance table

| Ticket | Status | Evidence |
|---|---|---|
| TH-1 vitest harness | **MET** | [vitest.config.ts](../../backend/vitest.config.ts) (env node, include `tests/**/*.test.ts`, excludes `*.emulator.test.ts`, setupFiles), [tests/setup.ts](../../backend/tests/setup.ts) (`??=` injects API_KEY + demo-test ids), [slug.util.test.ts](../../backend/tests/test-harness/slug.util.test.ts); `"test": "vitest run"`. Ran green. |
| TH-2 skills DI + db param | **MET** | [firestore.repository.ts:5](../../backend/src/shared/firestore.repository.ts#L5) optional `db: Firestore = defaultDb`; [skill.repository.ts](../../backend/src/skills/skill.repository.ts) / [service](../../backend/src/skills/skill.service.ts) / [controller](../../backend/src/skills/skill.controller.ts) factories; [routes:11-13](../../backend/src/skills/skill.routes.ts#L11-L13) composition root, middleware order unchanged. Behavior byte-identical to develop (diffed). `tsc --noEmit` green. [skill.service.test.ts](../../backend/tests/test-harness/skill.service.test.ts) green. |
| TH-3 emulator wiring + repo test | **MET (code; not executed)** | [firebase.json](../../backend/firebase.json) (port 8088, ui off), [firestore.rules](../../backend/firestore.rules) (permissive, emulator-only), [vitest.emulator.config.ts](../../backend/vitest.emulator.config.ts) (`fileParallelism: false`), [firestore.repository.emulator.test.ts](../../backend/tests/test-harness/firestore.repository.emulator.test.ts) covers save/findAll, ordered asc+default-desc, update missing->null, remove missing->false; [helpers/emulator.ts](../../backend/tests/helpers/emulator.ts) clears via REST in before/after; scripts + .gitignore debris present. |
| TH-4 endpoint smoke | **MET (code; not executed)** | [skill.endpoint.emulator.test.ts](../../backend/tests/test-harness/skill.endpoint.emulator.test.ts): 401/403/500 auth gate, 400 Zod (`message` contains `name`), POST->GET->PATCH->DELETE round-trip; 500 via `config.apiKey = undefined` save/restore in finally. 7 write-method requests (under the 20/15min limit). |
| TH-5 ci.yml PR gate | **MET, deviates** | [ci.yml](../../.github/workflows/ci.yml): `pull_request` to `[develop, main]`, no path filter, both jobs unconditional; `backend-test` (node 22, npm ci, `npm test`, setup-java Temurin 17, `npm run test:emulator`, no `GCP_SA_KEY`); `frontend-check` typecheck-only. **Deviation:** actions referenced by mutable `@v4` tags, not pinned SHAs (see §1 finding). |
| TH-6 backend-deploy 3-layer | **MET, deviates** | [backend-deploy.yml](../../.github/workflows/backend-deploy.yml): `test -> build -> deploy` via `needs:`; build/deploy steps byte-equivalent to develop (same image tag scheme, run flags, health check). Trigger unchanged. **Deviation:** SHA pinning removed (§1). |
| TH-7 frontend-deploy gated | **MET, deviates** | [frontend-deploy.yml](../../.github/workflows/frontend-deploy.yml): `check (typecheck) -> build-deploy` via `needs:`; deploy behavior unchanged (channel live, GCP_SA_KEY, entryPoint). **Deviation:** SHA pinning removed (§1). |

## 3. Decision-conformance table (DISCUSSION §5)

| Decision | Honored? | Evidence |
|---|---|---|
| Mock seam = DI factories (not `vi.mock`) | **Yes** | service/controller/repo factories; route = composition root. |
| DI scope = only `skills/*` + generic repo; `db` optional/defaulted | **Yes** | only skills files changed; [firestore.repository.ts:5](../../backend/src/shared/firestore.repository.ts#L5) default param; 8 domains compile unchanged (tsc green). |
| `*.emulator.test.ts` suffix; `npm test`=unit, `test:emulator`, `test:all` | **Yes** | configs + [package.json:9-11](../../backend/package.json#L9-L11); unit run excludes emulator files (verified). |
| `firebase-tools` pinned backend devDep | **Yes** | [package.json:35](../../backend/package.json#L35) `firebase-tools: 15.22.0` (exact). |
| One example test of each kind under `tests/test-harness/` | **Yes** | service unit + repo emulator + endpoint smoke all present. |
| Test env injected via setup file | **Yes** | [tests/setup.ts](../../backend/tests/setup.ts). |
| Skip coverage tooling | **Yes** | no `@vitest/coverage-*` in deps. |
| CommonJS, no ts-node for tests | **Yes** | vitest/esbuild; no test ts-node wiring. |
| CI: both jobs, no path filter, PR to develop+main | **Yes** | [ci.yml:7-9](../../.github/workflows/ci.yml#L7-L9). |
| Emulator project id `demo-test`, credential-free gate | **Yes** | scripts `--project demo-test`; no `GCP_SA_KEY` in `backend-test`. |
| `frontend-check` typecheck-only | **Yes** | [ci.yml:65-66](../../.github/workflows/ci.yml#L65-L66). |
| firebase-tools in CI via local devDep; Java Temurin 17 | **Yes** | npm-script invocation + setup-java Temurin 17. |
| Branch model: feat off develop | **Yes** | branch `feat/test-harness`, base `develop`. |

All §5 LOCKED decisions honored. (SHA pinning lived in PLAN, not the §5 log — see §1.)

## 4. Edge-case checklist

| Edge case | Verdict | Note |
|---|---|---|
| `update`/`remove` on missing doc -> null/false | OK | asserted in repo emulator test (45-64) + service unit (56-67). |
| `findAllOrdered` default-desc + asc | OK | asserted (31-43). |
| Auth 401 vs 403 vs 500 | OK | three supertest cases; 500 via temp `apiKey=undefined`, restored in finally. |
| Zod 400 joined message | OK | asserts `body.message` contains `name`. |
| Emulator data bleed | OK | `clearFirestore` in before+after of both emulator files. |
| Vitest parallelism vs shared emulator | OK | `fileParallelism: false` in emulator config. |
| Unit run excludes emulator tests | OK (verified) | unit run found 2 files, not 4. |
| DI cascade boots both wirings | OK (code) | smoke imports real `app`; tsc green. Not executed (no emulator). |
| Write rate-limit vs supertest writes | OK for S0 | 7 write-method requests < 20; but budget is process-global (see §3-finding). |
| `findAll` id projection | Pre-existing quirk | `findAll` omits `id`; passes only because `save` persists `id` in the doc (see §2-finding). |

## 5. Findings

### §1 — All workflow actions un-pinned from SHAs to mutable version tags  [SHOULD-FIX]
- **Where:** [ci.yml](../../.github/workflows/ci.yml) (new), [backend-deploy.yml](../../.github/workflows/backend-deploy.yml), [frontend-deploy.yml](../../.github/workflows/frontend-deploy.yml) — every `uses:` now references `@v4`/`@v2`/`@v0`. Introduced by commit **f7319b6** (unplanned).
- **What:** The PLAN requires "**Pin all action SHAs** (match the existing workflows' pinning style)" in TH-5, TH-6, and TH-7, and the Phase-0 drift check recorded "Action SHAs are pinned." The pre-existing `backend-deploy.yml` / `frontend-deploy.yml` pinned full commit SHAs (e.g. `actions/checkout@34e114...876b0b # v4`). f7319b6 reverted **all** of them — including the two pre-existing files — to floating tags, and the new `ci.yml` was authored with tags from the start.
- **Why it matters:** (1) Supply-chain security regression — a mutable tag can be re-pointed by a compromised/squatted action to run arbitrary code in CI, including jobs that hold `GCP_SA_KEY`, `API_KEY`, `ALLOWED_ORIGINS`. SHA pinning is the GitHub-recommended mitigation and was the repo's prior posture. (2) Direct, deliberate deviation from three PLAN ACs with no recorded rationale. (3) It mutated pre-existing, previously-reviewed files beyond the ticket scope.
- **Recommended fix:** Re-pin every `uses:` to a full commit SHA with a `# vX` comment (look up the SHA for `setup-java` and `setup-node`/`checkout`/`auth`/`setup-gcloud`/`action-hosting-deploy`/`FirebaseExtended` at the intended versions). If the un-pinning was an intentional, accepted trade-off, record it as a new LOCKED decision in DISCUSSION §5 and amend the PLAN ACs so the contract and the code agree — don't leave the plan saying "pin" while the code floats.
- **Refs:** PLAN TH-5/TH-6/TH-7 ("Pin all action SHAs"), PLAN Drift-check.

### §2 — `findAll` does not project `id`, unlike `findAllOrdered`  [NICE-TO-HAVE / pre-existing]
- **Where:** [firestore.repository.ts:9](../../backend/src/shared/firestore.repository.ts#L9) (`doc.data() as T`) vs [:14](../../backend/src/shared/firestore.repository.ts#L14) (`{ id: doc.id, ...doc.data() }`).
- **What:** `findAll` returns raw doc data without injecting the document id; `findAllOrdered` injects it. The new emulator test `save then findAll returns the persisted document` passes only because `save` writes the whole object (including `id`) into the doc body, so `data()` happens to carry `id`.
- **Why it matters:** Not introduced by this feature (TH-2 only added the `db` param), so out of strict scope — but the new test now exercises this path and would silently mask a real divergence if any document were ever persisted without an embedded `id`. Worth a forward note since S1/S3 add more domains on this generic repo.
- **Recommended fix:** None required for S0. Consider normalising `findAll` to `{ id: doc.id, ...doc.data() }` in a later session for consistency, or note the "id must be embedded in the doc body" invariant.
- **Refs:** TH-2, TH-3.

### §3 — Write rate-limit budget is process-global, not per-file  [NICE-TO-HAVE / forward note]
- **Where:** [skill.endpoint.emulator.test.ts](../../backend/tests/test-harness/skill.endpoint.emulator.test.ts) + the parked bypass noted in PLAN TH-4.
- **What:** The 20-writes/15-min limiter lives on the imported `app` singleton; the emulator config runs serially in **one** process with no time advance, so write-method requests accumulate across all emulator files for the whole run. TH-4 uses 7 — fine today.
- **Why it matters:** When S3 adds endpoint smokes for the other 8 domains under the same emulator run, the shared budget (not per-file) will be hit well before each file's own count looks large. PLAN already parks a test-env limiter bypass; this just flags that the trigger is global.
- **Recommended fix:** Implement the parked test-env limiter bypass before S3 piles on more write smokes. Out of scope for S0.
- **Refs:** PLAN TH-4 Edge Cases, DISCUSSION §4.

### §4 — `clearFirestore` resolves projectId at module-load  [NICE-TO-HAVE]
- **Where:** [helpers/emulator.ts:4](../../backend/tests/helpers/emulator.ts#L4) `const projectId = process.env.GCLOUD_PROJECT ?? 'demo-test'`.
- **What:** Evaluated once at import. Correct today (setup.ts and `emulators:exec --project demo-test` both set it before the helper imports), but it would silently target the wrong project if the env were set later than import.
- **Why it matters:** Minor fragility; the REST clear is destructive against whatever project resolves. Low risk under the current run model.
- **Recommended fix:** Optionally read `process.env.GCLOUD_PROJECT` inside `clearFirestore` rather than at module scope. Low priority.
- **Refs:** TH-3.

### §5 — `frontend-deploy` job style inconsistency  [NICE-TO-HAVE]
- **Where:** [frontend-deploy.yml](../../.github/workflows/frontend-deploy.yml): `check` uses job-level `defaults.run.working-directory: frontend`; `build-deploy` repeats `working-directory: frontend` per step.
- **What:** Cosmetic inconsistency between the two jobs (the per-step form is inherited from the pre-existing file). Functionally correct.
- **Recommended fix:** Optionally hoist `build-deploy` to job-level `defaults` for symmetry. No action likely needed.
- **Refs:** TH-7.

## 6. Open questions

1. **§1 is the one that matters.** Was the SHA -> tag switch (f7319b6) a deliberate, accepted decision, or incidental (e.g. avoiding a SHA lookup for `setup-java`)? If deliberate, do we re-pin anyway (security) or formally record the deviation in DISCUSSION §5 + amend the PLAN ACs? If incidental, re-pin all `uses:` to SHAs.
2. Should the emulator slice (TH-3/TH-4) be executed once locally (Java + emulator) before the PR, given this review could only static-check it? The unit + typecheck layers are green here.
3. Any appetite to fix §2 (`findAll` id projection) now while it's fresh, or leave it for the session that touches the generic repo next?

## 7. Decisions log (triaged 2026-06-19)

- §1 — SHA pinning: **FIX**. **[FIXED]** (commit `335d5f3`). Re-pin every `uses:` across all
  three workflows (incl. the new `ci.yml`) back to a full commit SHA + `# vX` comment.
  Restores the repo's prior security posture and matches the PLAN ACs. All 19 `uses:`
  re-pinned to the repo's prior SHAs (recovered from `f7319b6^`).
- §2 — `findAll` id projection: **FIX**. **[FIXED]** (commit `824b654`). Normalise `findAll`
  to `{ id: doc.id, ...doc.data() }` for parity with `findAllOrdered`. Added an emulator test
  that writes a doc body WITHOUT an embedded `id` and asserts `findAll` still surfaces
  `doc.id` (would have failed under the old projection). Emulator slice ran green (5/5).
- §3 — rate-limit budget bypass: **DEFERRED**. Forward-note for S3.
- §4 — `clearFirestore` projectId timing: **DEFERRED**.
- §5 — frontend-deploy job style: **DEFERRED**.

**Process note:** user will run the emulator slice (`npm run test:emulator`, needs Java)
locally after the fixes, before opening the PR — this review env could not execute it.

---

# Pass 1 review

> Fresh-eyes verification of the two FIX commits only. Delta base = `f7319b6`
> (last commit the Phase-4 pass reviewed). Range `f7319b6..HEAD` = 2 commits:
> `335d5f3` (§1 SHA re-pin) + `824b654` (§2 findAll id projection). REVIEW ONLY —
> no code changed.
>
> **Executed:** `npx vitest run tests/test-harness` -> 2 files / 9 tests green
> (unit slice; correctly excludes the 2 `*.emulator.test.ts` files). **Not executed:**
> the emulator slice (TH-3/TH-4) — no Java runtime here; the §2 regression test was
> code-reviewed only (decisions log records it ran 5/5 locally).

## Status of previous FIX findings

| § | Fix commit | Verdict | Evidence |
|---|---|---|---|
| §1 SHA pinning | `335d5f3` | **verified-fixed** | All 19 `uses:` across the 3 workflows now reference a full commit SHA + `# vX`. The two pre-existing files (`backend-deploy.yml`, `frontend-deploy.yml`) match `f7319b6^` byte-for-byte (same SHAs for checkout `34e1148…`, setup-node `49933ea…`, setup-java `c1e3236…`, auth `c200f36…`, setup-gcloud `e427ad8…`, hosting-deploy `092436d…`). New `ci.yml` (5 `uses:`) pins the same SHAs at the same versions (checkout/setup-node/setup-java) — internally consistent. Grep confirms **zero** floating `@vN` tags remain. Restores the PLAN-mandated posture (TH-5/6/7 "Pin all action SHAs"). |
| §2 findAll id projection | `824b654` | **verified-fixed** | [firestore.repository.ts:9](../../backend/src/shared/firestore.repository.ts#L9) now `{ id: doc.id, ...doc.data() } as T`, parity with `:14` `findAllOrdered`. Shipped with a scoped regression test [firestore.repository.emulator.test.ts:32-38](../../backend/tests/test-harness/firestore.repository.emulator.test.ts#L32-L38) that writes a doc body with NO embedded `id` and asserts `findAll` surfaces `{ id: 'zeta', … }` — would fail under the old `doc.data() as T` projection (returns no `id`), so it genuinely proves closure. `makeRepo()` and the test's `db` import both resolve to the shared `defaultDb`, so the write and the read hit the same emulator instance. Existing `save then findAll` test still green (body embeds `id`, so spread is identity). |

## New findings

None. The delta is tightly scoped and introduces no regressions:
- The §2 change is byte-identical in shape to the long-standing `findAllOrdered`
  projection; for any doc persisted via `save` (which embeds `id` in the body) the
  result is unchanged, so the other 8 domains consuming `findAll` are unaffected. The
  only behavioral delta is the strict improvement of surfacing `doc.id` for bodies
  that lack an embedded `id`.
- The §1 change touches only `uses:` refs (no logic/trigger/permission change) and
  re-pins to the repo's prior SHAs.
- Both fixes carry their proof: §2 a dedicated regression test; §1 is config-only
  (no unit test applicable — verification is the SHA grep + diff against `f7319b6^`).

Deferred §3 (rate-limit budget), §4 (`clearFirestore` projectId timing), §5
(frontend-deploy job style) are untouched by this delta and remain forward notes.

## Recommendation

**CLOSE.** Both triaged FIX findings are verified-fixed with evidence; no new
FIX-worthy findings; no regressions. Nothing blocks close. One process gate remains
(unchanged from Phase 4): the user runs the emulator slice locally (`npm run
test:emulator`, needs Java) once before opening the PR — this env can only static-check
+ run the unit slice (green).

---

# Pass 2 — post-close finding (surfaced running the emulator slice on the PR)

## New findings

### §6 — CI Java version (17) incompatible with pinned firebase-tools 15.22  [MUST-FIX]
- **Where:** [ci.yml:41](../../.github/workflows/ci.yml#L41) and
  [backend-deploy.yml:36](../../.github/workflows/backend-deploy.yml#L36) — `setup-java`
  with `java-version: '17'`.
- **What:** `firebase-tools@15.22.0` (the pinned backend devDep, decision 11) dropped
  support for Java < 21: `emulators:exec` aborts with *"firebase-tools no longer supports
  Java version before 21. Please install a JDK at version 21 or above."* Both CI workflows
  provisioned Temurin 17, so the `Run emulator tests` step failed on every PR (ci.yml) and
  in the backend-deploy `test` layer (which `build` -> `deploy` gate on). This supersedes
  DISCUSSION decision 11 / PLAN TH-5/TH-6 ("Temurin 17"), which predated the firebase-tools
  bump. The Phase-4/Pass-1 reviews could not catch it — the emulator slice was never
  executed in CI-equivalent conditions there (this env happened to have Temurin 21 on PATH).
- **Fix:** **[FIXED]** (commit `cb31b1a`). Bumped `java-version` to `'21'` (temurin) in
  both `ci.yml` and `backend-deploy.yml`. Emulator slice re-run locally under Temurin 21 ->
  2 files / 10 tests green. Docs corrected: CLAUDE.md + EXECUTION_FLOW.md now say
  Java/Temurin 21 (decision 11's "Temurin 17" is superseded by this note).
- **Refs:** DISCUSSION §11, PLAN TH-5/TH-6, package.json `firebase-tools: 15.22.0`.

## Recommendation

**CLOSE (re-confirmed).** §6 was a real CI-blocking bug not observable in the review env;
it is fixed and pushed on `feat/test-harness` (`cb31b1a`). No code-logic change — CI runner
config only. PR can proceed once opened.
