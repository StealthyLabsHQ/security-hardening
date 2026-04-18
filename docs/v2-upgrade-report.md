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
- `scripts/build-index.py`
- `scripts/lint-skill.py`
- `evals/README.md`
- `evals/run.py`
- `evals/results/.gitignore`
- `evals/cases/*.yaml` (`20` positive fixtures)
- `evals/negative/*.yaml` (`10` negative fixtures)
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `INDEX.md`

Created and continuously updated as decision control points:

- `docs/DECISIONS.md`

## Files Moved

The flat `references/` layout was replaced by a domain layout.

Moved from flat paths like:

- `references/<name>.md`

To categorized paths:

- `references/appsec/` (`15` files)
- `references/infra/` (`4` files)
- `references/iam/` (`5` files)
- `references/platform/` (`3` files)
- `references/ai/` (`10` files)
- `references/privacy/` (`2` files)
- `references/ops/` (`9` files)
- `references/compliance/` (`3` files)

Compatibility support:

- old-to-new path map recorded in [docs/redirects.md](D:/Users/stealthy/Documents/GitHub/security-hardening/docs/redirects.md:1)
- generated metadata index recorded in [references/_index.md](D:/Users/stealthy/Documents/GitHub/security-hardening/references/_index.md:1)

## Files Archived

None.

No files were removed during this phased upgrade, so `archive/` was not created or used.

## Key Structural Changes

- `SKILL.md` is now a compact router instead of a mixed router/reference dump.
- `references/_core-invariants.md` holds the always-applied baseline once per task.
- `README.md` is now explicitly human-facing.
- `INDEX.md` is now explicitly machine-facing.
- `references/compliance/compliance-mapping.md` was downgraded to a pedagogical crosswalk and no longer reads like an audit artifact.
- `security.yml` now includes a `skill-integrity` job that runs `scripts/lint-skill.py`.

## Metrics

- Total references before refactor: `51`
- Total references after refactor: `52`
- New shared core file added: `1` (`references/_core-invariants.md`)
- Reference categories after refactor: `8`
- `SKILL.md` current size: `62` lines
- `INDEX.md` current size: `105` lines

Eval coverage:

- Positive fixtures: `20`
- Negative fixtures: `10`
- Total fixtures: `30`
- Preflight result: `30/30 PASS`
- Fixtures with manual semantic checkpoints: `20`

Positive fixture domain coverage from [evals/results/2026-04-18.md](D:/Users/stealthy/Documents/GitHub/security-hardening/evals/results/2026-04-18.md:1):

- `ai`: `18`
- `appsec`: `7`
- `iam`: `7`
- `infra`: `5`
- `ops`: `13`
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

Stability mitigations:

- `v1.0.0` preserves the last pre-refactor portable snapshot.
- `v2.0.0-rc.1` preserves the first auditable/testable refactor baseline after phase 6.
- [docs/redirects.md](D:/Users/stealthy/Documents/GitHub/security-hardening/docs/redirects.md:1) captures old-to-new reference paths.

## Remaining TODO

Still stale (`last_reviewed: null`) in [docs/stale.md](D:/Users/stealthy/Documents/GitHub/security-hardening/docs/stale.md:1):

- `references/ops/detection-engineering.md`
- `references/appsec/framework-examples.md`
- `references/appsec/graphql-security.md`
- `references/appsec/security-myths.md`

Still manual / deferred for the next iteration:

- Build a model-backed semantic eval runner if `must_mention` and `must_not_mention` need automated grading instead of manual checkpoints.
- Add dedicated governance templates for RoPA, DPIA, DSAR, DPA, SCC, and TIA if compliance support needs to go beyond the current pedagogical crosswalk.
- Add regulator-facing reporting packs for NIS2 and DORA if the repo needs operational compliance evidence rather than technical preparation guidance.
- Revalidate framework-specific snippets against current upstream versions before clearing the remaining stale queue.

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
