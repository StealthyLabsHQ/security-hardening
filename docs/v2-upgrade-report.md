# v2 Upgrade Report

## Scope

This report summarizes the phased refactor from the pre-refactor portable skill snapshot tagged `v1.0.0` to the current v2 work on `main`.

Reference anchors:

- Stable pre-refactor snapshot: `v1.0.0` -> `8feff18`
- Refactor release candidate: `v2.0.0-rc.1` -> `6dd535e`

## Files Created

Created during the phased refactor:

- `docs/reference-inventory.md`
- `docs/overlap-matrix.md`
- `docs/stale.md`
- `docs/v2-upgrade-report.md`
- `references/_core-invariants.md`
- `references/_index.md` (generated index introduced in Phase 3)
- `references/ai/_index.md`
- `references/ai/agent-evals-red-teaming.md`
- `references/ai/browser-computer-use-security.md`
- `references/ai/rag-retrieval-security.md`
- `scripts/build-index.py`
- `scripts/lint-skill.py`
- `evals/README.md`
- `evals/run.py`
- `evals/results/.gitignore`
- `evals/cases/*.yaml` (`31` positive fixtures)
- `evals/negative/*.yaml` (`12` negative fixtures)
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `INDEX.md`
- `archive/README.md`
- `archive/references/ai/ai-bundle-presets.md`

Created and continuously updated as decision control points:

- `docs/DECISIONS.md`

## Files Moved

The flat `references/` layout was replaced by a domain layout.

Moved from flat paths like:

- `references/<name>.md`

To categorized paths:

- `references/appsec/` (`17` files)
- `references/infra/` (`10` files)
- `references/iam/` (`12` files)
- `references/platform/` (`11` files)
- `references/ai/` (`18` files)
- `references/privacy/` (`12` files)
- `references/ops/` (`13` files)
- `references/compliance/` (`10` files)

Compatibility support:

- old-to-new path map recorded in [docs/redirects.md](D:/Users/stealthy/Documents/GitHub/security-hardening/docs/redirects.md:1)
- generated metadata index recorded in [references/_index.md](D:/Users/stealthy/Documents/GitHub/security-hardening/references/_index.md:1)

## Files Archived

- `archive/references/ai/ai-bundle-presets.md`

Archived during the AI-domain cleanup:

- `references/ai/ai-bundle-presets.md` was merged into `references/ai/ai-tool-profiles.md` because it duplicated the same reader outcome as a packaging layer on top of tool profiles.

## Key Structural Changes

- `SKILL.md` is now a compact router instead of a mixed router/reference dump.
- `references/_core-invariants.md` holds the always-applied baseline once per task.
- `README.md` is now explicitly human-facing.
- `INDEX.md` is now explicitly machine-facing.
- `references/ai/_index.md` now acts as a narrow router inside the AI domain.
- `references/ai/ai-tool-profiles.md` now owns both base profiles and bundle-selection guidance.
- `references/ai/agent-evals-red-teaming.md` adds a dedicated adversarial-evaluation and regression-gate reference for agentic systems.
- `references/ai/browser-computer-use-security.md` adds a dedicated hardening guide for GUI-driving agents and authenticated browser workflows.
- `references/ai/rag-retrieval-security.md` adds a dedicated retrieval-layer guide for vector stores, corpus trust, and cross-tenant leakage control.
- `references/compliance/compliance-mapping.md` was downgraded to a pedagogical crosswalk and no longer reads like an audit artifact.
- `security.yml` now includes a `skill-integrity` job that runs `scripts/lint-skill.py`.

## Metrics

- Total references before refactor: `51`
- Total references after current corpus expansion: `104`
- New shared core file added: `1` (`references/_core-invariants.md`)
- Reference categories after refactor: `8`
- `SKILL.md` current size: `85` lines
- `INDEX.md` current size: `144` lines

Eval coverage:

- Positive fixtures: `31`
- Negative fixtures: `12`
- Total fixtures: `43`
- Preflight result: `43/43 PASS`
- Fixtures with manual semantic checkpoints: `31`

Positive fixture domain coverage from [evals/results/2026-04-19.md](D:/Users/stealthy/Documents/GitHub/security-hardening/evals/results/2026-04-19.md:1):

- `ai`: `31`
- `appsec`: `17`
- `iam`: `9`
- `infra`: `6`
- `ops`: `15`
- `privacy`: `2`

## Validation Added

New validation surfaces:

- `python scripts/build-index.py`
- `python scripts/lint-skill.py`
- `python evals/run.py`

Current status at report time:

- skill lint: passing
- eval preflight: passing
- generated reference index: current

## Breaking Changes

Expected breakage is limited if consumers follow the redirect map or pin the stable tag.

Potential breaking changes:

- Flat reference paths under `references/*.md` no longer exist; consumers must use categorized paths or consult [docs/redirects.md](D:/Users/stealthy/Documents/GitHub/security-hardening/docs/redirects.md:1).
- Agent navigation should now prefer [INDEX.md](D:/Users/stealthy/Documents/GitHub/security-hardening/INDEX.md:1) instead of using `README.md` as a corpus index.
- `SKILL.md` now expects `references/_core-invariants.md` to be loaded once before domain references.
- `references/_index.md` is generated metadata, not the primary navigation surface.
- `references/ai/ai-bundle-presets.md` no longer exists as an active reference; consumers should use [references/ai/ai-tool-profiles.md](D:/Users/stealthy/Documents/GitHub/security-hardening/references/ai/ai-tool-profiles.md:1) and consult [archive/README.md](D:/Users/stealthy/Documents/GitHub/security-hardening/archive/README.md:1) for the archival note.

Stability mitigations:

- `v1.0.0` preserves the last pre-refactor portable snapshot.
- `v2.0.0-rc.1` preserves the first auditable/testable refactor baseline after phase 6.
- [docs/redirects.md](D:/Users/stealthy/Documents/GitHub/security-hardening/docs/redirects.md:1) captures old-to-new reference paths.

## Remaining TODO

Resolved stale-review queue:

- `docs/stale.md` now reflects that the previously stale references were refreshed.

Still manual / deferred for the next iteration:

- Build a model-backed semantic eval runner if `must_mention` and `must_not_mention` need automated grading instead of manual checkpoints.
- Continue compacting non-reference documentation snapshots when corpus metrics materially change again.
- Add regulator-facing reporting packs for NIS2 and DORA if the repo needs operational compliance evidence rather than technical preparation guidance.

## Commit Trail

Phase commits produced by this upgrade:

- `5a8841a` `docs: add phase 1 reference overlap audit`
- `660901e` `docs: add reference frontmatter metadata`
- `9a8b50e` `refactor(references): reorganize corpus by domain`
- `e553fde` `refactor(skill): route through core invariants`
- `2b18b74` `test: add offline routing eval harness`
- `6dd535e` `feat: add skill integrity linting`
- `b6b1b7f` `docs: add changelog and release guidance`
- `3cb2a17` `docs: downgrade compliance crosswalk claims`
- `ab8b098` `docs: split human and agent entrypoints`
