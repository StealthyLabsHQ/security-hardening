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

