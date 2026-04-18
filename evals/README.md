# Evals

This directory stores routing fixtures for the `security-hardening` skill.

## Scope

The Phase 5 runner is an offline preflight harness. It validates:

- fixture schema,
- reference paths in `should_load` and `must_not_load`,
- positive cases always loading `references/_core-invariants.md`,
- positive routing targets being present in `SKILL.md`.

It does **not** grade model prose or semantic quality. Fields such as `must_mention`
and `must_not_mention` are recorded as manual checkpoints in the generated report.

## Layout

- `cases/`: positive routing fixtures
- `negative/`: non-trigger fixtures
- `results/`: generated markdown reports
- `run.py`: offline runner

## Run

```bash
python evals/run.py
```

The runner writes a markdown report to `evals/results/YYYY-MM-DD.md` and prints the path.

## Read the report

- `PASS`: schema and routing preflight checks passed
- `FAIL`: fixture is broken and needs to be fixed
- `MANUAL`: semantic expectations that still need a model-backed or human review
