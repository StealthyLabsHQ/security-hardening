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
