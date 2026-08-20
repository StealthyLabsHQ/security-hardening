# Scale evaluation harness for secure-review

Generate a labeled corpus and measure precision/recall of local Semgrep rules
via `scripts/secure-review.py` in detect-only mode.

```bash
# Fast CI-sized run
python3 evals/scale/run_scale.py --variants 5

# Larger local run
python3 evals/scale/run_scale.py --variants 40 --workdir /tmp/secure-review-scale-corpus
```

Generated corpora under `evals/scale/.corpus/` are gitignored.
