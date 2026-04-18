# Decisions

## ADR-0001: Phase 1 overlap matrix is sparse, not a 51x51 dense grid

- Date: 2026-04-18
- Status: accepted

### Context

Phase 1 requires a matrix of overlap across 51 reference files. A fully dense markdown
grid would be large, hard to review, and low-signal for refactoring decisions.

### Decision

Represent the overlap matrix as a sparse matrix:

- every reference file appears once,
- only strong overlaps (`score >= 2`) are called out explicitly,
- all omitted pairings are treated as `0` or `1`.

### Consequences

- The artifact stays readable enough to drive deduplication work in later phases.
- The score rubric remains auditable.
- Later restructuring can still consume the matrix without reverse-engineering a huge grid.

## ADR-0002: Frontmatter `audit_level` preserves levels 1 through 4

- Date: 2026-04-18
- Status: accepted

### Context

The Phase 2 example shows `audit_level: [1, 2, 3]`, but the existing repository already
defines four audit levels in `references/ops/security-audit-levels.md`, including a distinct
Level 4 for expert / regulated / high-consequence reviews.

### Decision

Use the real repository scale in frontmatter:

- `audit_level` may contain any subset of `[1, 2, 3, 4]`
- existing references that already target Level 4 keep that scope

### Consequences

- Metadata remains aligned with the current audit model instead of silently downgrading it.
- Later tooling can still down-scope to `[1, 2, 3]` if a consumer only supports three levels.

## ADR-0003: `references/` directory structure follows frontmatter `category`

- Date: 2026-04-18
- Status: accepted

### Context

Phase 3 requires moving the flat `references/` layout into domain folders:

- `appsec`
- `infra`
- `iam`
- `platform`
- `ai`
- `privacy`
- `ops`
- `compliance`

Several files are borderline by subject matter. Examples:

- `threat-modeling.md` could be read as `appsec` or `ops`
- `coverage-matrix.md` is governance/meta, not a runtime control
- `cloud-iam-hardening.md` spans cloud and identity

### Decision

The physical path under `references/` must follow the existing `category` field in each file's
frontmatter. This keeps one source of truth for routing and later index generation.

### Consequences

- Category disputes are resolved in metadata first, then inherited by filesystem layout.
- `references/_index.md` can be generated mechanically from frontmatter without custom exception logic.
- If a file changes domain later, its frontmatter category is the change control point.

## ADR-0004: `_core-invariants.md` is a root-level exception under `references/`

- Date: 2026-04-18
- Status: accepted

### Context

Phase 4 requires a single shared file at `references/_core-invariants.md` so the skill can load
the baseline invariants once, independently of domain routing.

This conflicts with ADR-0003, which moved all references into domain directories based on
frontmatter `category`.

### Decision

Allow exactly two root-level machine-facing files under `references/`:

- `_index.md`
- `_core-invariants.md`

All other reference files must stay in their category folders.

### Consequences

- The skill can load one shared baseline file without overloading a domain bucket.
- Index generation must explicitly tolerate `_core-invariants.md`.
- Future root-level additions require a new ADR instead of quietly bypassing the taxonomy.

## ADR-0005: Phase 5 evals use an offline fixture-integrity runner

- Date: 2026-04-18
- Status: accepted

### Context

Phase 5 requires `evals/cases/*.yaml`, `evals/negative/*.yaml`, and a simple runner that logs
results in markdown.

No model backend, agent harness, or golden-output execution contract is specified for this phase.
That makes semantic assertions such as `must_mention` impossible to verify automatically without
inventing a fake evaluator.

### Decision

Implement Phase 5 as an offline fixture-integrity harness:

- validate case schema and required fields,
- validate that referenced files resolve in the repository,
- validate that positive cases include `references/_core-invariants.md`,
- validate that positive routing targets appear in `SKILL.md`,
- record semantic expectations such as `must_mention` as manual review checkpoints in the markdown report.

### Consequences

- The eval corpus becomes auditable and runnable without external services.
- Routing regressions and broken paths are caught immediately.
- Semantic quality checks remain explicit, but require a later model-backed harness if full automation is needed.

## ADR-0006: Skill lint uses an allowlist plus example-domain heuristics

- Date: 2026-04-18
- Status: accepted

### Context

Phase 6 requires linting for non-allowlisted links and suspicious hidden instructions.

This corpus intentionally contains:

- official vendor and standards links,
- placeholder hosts such as `example.com`,
- private/internal sample hosts such as `*.internal` and `*.corp`,
- adversary simulation hosts such as `attacker.com` inside defensive examples.

### Decision

Lint external links with two buckets:

- explicit allowlist for official documentation and standards domains already used by the repo,
- heuristic allowlist for placeholders, private sample hosts, local addresses, and explicit attacker-simulation hosts used in defensive examples.

Also lint hidden prompt-injection patterns only when they appear in code fences or HTML comments without nearby defensive framing.

### Consequences

- The linter blocks accidental drift to random external domains.
- Existing defensive examples remain valid instead of generating noisy false positives.
- Future domains should be added intentionally instead of slipping into the corpus unnoticed.

## ADR-0007: Phase 7 version anchors preserve the pre-refactor portable snapshot

- Date: 2026-04-18
- Status: accepted

### Context

Phase 7 requires tagging:

- `v1.0.0` on the pre-refactor version already used by existing consumers,
- `v2.0.0-rc.1` at the end of Phase 6.

The refactor spans multiple local commits and the repository had no prior semantic tags.

### Decision

Anchor the tags to the last two meaningful boundaries already present in history:

- `v1.0.0` -> commit `8feff18`, the last stable pre-phase-refactor portable skill snapshot on `main`
- `v2.0.0-rc.1` -> commit `6dd535e`, the completed Phase 6 integrity baseline

Phase 7 documentation updates live after those anchors and do not move either tag.

### Consequences

- Existing consumers get a stable tag that matches the last non-refactor layout already on `main`.
- The v2 release candidate points to the first auditable/testable refactor milestone, not later documentation drift.
- README install guidance can default to the stable tag while still exposing the release candidate.

