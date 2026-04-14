# AI Security Postures

These overlays sit **on top of** the base tool profiles in `templates/ai-tool-profiles/`.

Use them when you need a stronger security posture by project sensitivity, not just by tool choice.

## Available postures

- `solo` - one developer, small repo, no direct production write from the agent
- `startup` - small team, shared repos, CI and protected branches matter
- `prod-sensitive` - production systems, finance, internal admin tools, or high-blast-radius services
- `gdpr-sensitive` - personal data, HR, legal, customer support exports, regulated retention/deletion flows

## Files in each posture

- `README.md` - when to use it and what it changes
- `ROOT-INSTRUCTIONS.md` - text to merge into `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, or a Cursor project rule
- `.ai/agent-policy.yaml` - vendor-neutral policy-as-code baseline
- `tool-approval-matrix.csv` - approval requirements for common action classes

## Recommended use

1. Copy the base profile for your tool.
2. Pick the matching posture overlay.
3. Merge `ROOT-INSTRUCTIONS.md` into the tool's root instruction file.
4. Commit `.ai/agent-policy.yaml` and the approval matrix in the repo.

These overlays are intentionally stricter than the base templates.
