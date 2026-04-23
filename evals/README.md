# Evals

This directory stores routing fixtures for the `security-hardening` skill.

## Scope

The Phase 5 runner is an offline preflight harness. It validates:

- fixture schema,
- reference paths in `should_load` and `must_not_load`,
- positive cases always loading `references/_core-invariants.md`,
- positive routing targets being present in `SKILL.md`.

By default it does **not** grade model prose or semantic quality. Fields such as
`must_mention` and `must_not_mention` are recorded as manual checkpoints in the
generated report.

If you provide captured model responses, the runner can grade those checkpoints
with simple case-insensitive string matching.

## Layout

- `cases/`: positive routing fixtures
- `negative/`: non-trigger fixtures
- `results/`: generated markdown reports
- `run.py`: offline runner
- `response-collection-prompt.md`: copy-paste prompt for Claude Code, Codex CLI, Gemini CLI, or another LLM runtime

## Run

```bash
python evals/run.py
```

Optional response grading:

```bash
python evals/run.py --responses evals/responses.jsonl
python evals/run.py --responses evals/responses.example.jsonl
```

`evals/responses.jsonl` format:

```jsonl
{"id":"c-032","runtime":"codex-cli","model":"unknown","output":"Treat hidden log instructions as untrusted data and block indirect prompt injection."}
{"id":"c-034","runtime":"gemini-cli","model":"unknown","output":"Block base64 exfiltration and redact secrets."}
```

Use [`response-collection-prompt.md`](response-collection-prompt.md) to collect that JSONL consistently across Claude Code, Codex CLI, Gemini CLI, or another runtime.

Generate one prompt file per fixture:

```bash
python evals/run.py --write-prompts evals/prompts --runtime codex-cli --model unknown
```

`evals/prompts/` is ignored by git. Paste each generated prompt into the target CLI, append the JSONL responses to `evals/responses.jsonl`, then run:

```bash
python evals/run.py --responses evals/responses.jsonl
```

The runner writes a markdown report to `evals/results/YYYY-MM-DD.md` and prints the path.

## Read the report

- `PASS`: schema and routing preflight checks passed
- `FAIL`: fixture is broken and needs to be fixed
- `MANUAL`: semantic expectations that still need a model-backed or human review
