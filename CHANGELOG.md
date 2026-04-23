# Changelog

All notable changes to this repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Adversarial AI-agent eval fixtures for indirect prompt injection, path traversal, output exfiltration, and multi-turn tool abuse.
- Optional JSONL response grading and per-fixture prompt generation for Claude Code, Codex CLI, Gemini CLI, and other runtimes.
- Core adversarial case guidance in `references/ai/agent-evals-red-teaming.md`.
- Local ignore rules for `source.md`, generated eval prompts, and captured eval responses.
- Stable-vs-preview release guidance in `README.md`.
- Initial changelog and semantic tag mapping for the pre-refactor and v2 release-candidate lines.

## [v2.0.0-rc.1] - 2026-04-18

### Added

- Phase 1 corpus inventory, overlap matrix, and short ADR log for structural decisions.
- Phase 2 frontmatter across the full `references/` corpus plus `docs/stale.md`.
- Phase 4 shared `references/_core-invariants.md` baseline and router-style `SKILL.md`.
- Phase 5 offline eval harness with positive and negative routing fixtures.
- Phase 6 `scripts/lint-skill.py`, CI skill-integrity checks, and contribution guidance.

### Changed

- Reorganized `references/` by domain with generated `references/_index.md` and redirects.
- Reworked `SKILL.md` into a compact routing layer with explicit load and do-not-load guidance.

## [v1.0.0] - 2026-04-18

### Added

- Portable `SKILL.md` plus `references/` corpus for Claude, Codex, Gemini, and ChatGPT workflows.
- Official provider guidance from OpenAI, Google, and Anthropic, including Project Glasswing / Claude Mythos references.
- Defensive AI tool profiles and posture bundles under `templates/ai-tool-profiles/`.

### Changed

- Repositioned the repository from the old `tools/ai-skills` packaging into a portable skill layout.
- Tightened the root skill triggers and GitHub repository metadata for application-security and AI-agent-security discovery.

## [pre-semver]

### Added

- Initial security reference corpus, workflow templates, and GitHub automation before semantic tagging.

[Unreleased]: https://github.com/StealthyLabsHQ/security-hardening/compare/v2.0.0-rc.1...HEAD
[v2.0.0-rc.1]: https://github.com/StealthyLabsHQ/security-hardening/compare/v1.0.0...v2.0.0-rc.1
[v1.0.0]: https://github.com/StealthyLabsHQ/security-hardening/releases/tag/v1.0.0
