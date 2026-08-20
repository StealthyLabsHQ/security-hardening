# Contributing

Use this checklist for any pull request that touches `references/`, `SKILL.md`, routing metadata, or eval fixtures.

## Reference Changes

- Keep YAML frontmatter present and valid on every file under `references/`.
- Keep reference files in English. Do not mix languages in the same reference.
- Preserve existing citations. New factual claims need a source link or a clear note for later review.
- Link to external material instead of copying long paragraphs.
- Do not add exploit chains, weaponized payloads, or offensive operator instructions.
- If `last_reviewed` cannot be updated confidently, keep it `null` and update `docs/stale.md`.

## Routing And Structure

- If you add, move, or rename a reference, update `SKILL.md`, `references/_index.md`, and `docs/redirects.md`.
- Keep `references/` categorized by frontmatter `category`.
- Do not add new root-level files under `references/` without a short ADR in `docs/DECISIONS.md`.
- Make sure `slug` matches the file name, with root helper files using the stem without the leading underscore.

## Validation

- Run `python scripts/build-index.py` after structural reference changes.
- Run `python scripts/lint-skill.py`.
- Run `python evals/run.py`.
- Review the generated eval report in `evals/results/`.

## Pull Request Hygiene

- Describe the scope of the corpus change and any routing impact.
- Call out any new external domains introduced in sources or examples.
- Mention stale files, null review dates, or manual follow-up left for a later iteration.

## License

- Unless otherwise noted, contributions to this repository are made under the Apache License, Version 2.0. See `LICENSE` and `NOTICE`.
- If you add third-party material or content with extra attribution or restrictions, document that in the file and update `NOTICE` when required.
