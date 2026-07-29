# AI Tool Profiles

Copy-paste defensive profiles for:

- Claude Code
- Codex
- Gemini CLI
- Cursor
- no-code / low-code / automation tools

Posture overlays are also available under `templates/ai-tool-profiles/postures/`:

- `solo`
- `startup`
- `prod-sensitive`
- `gdpr-sensitive`

Premerged bundles are available under `templates/ai-tool-profiles/bundles/`:

- `claude-code-prod-sensitive`
- `cursor-prod-sensitive`
- `gemini-cli-prod-sensitive`
- `codex-gdpr-sensitive`
- `no-code-gdpr-sensitive`

These templates are intentionally conservative. Start here, then widen access only when a project has a clear operational need.

## Suggested copy paths

### Claude Code

```bash
mkdir -p .claude
cp templates/ai-tool-profiles/claude-code/.claude/settings.json .claude/settings.json
cp templates/ai-tool-profiles/claude-code/CLAUDE.md CLAUDE.md
```

### Codex

```bash
cp templates/ai-tool-profiles/codex/AGENTS.md AGENTS.md
```

### Gemini CLI

```bash
mkdir -p .gemini
cp templates/ai-tool-profiles/gemini-cli/.gemini/settings.json .gemini/settings.json
cp templates/ai-tool-profiles/gemini-cli/GEMINI.md GEMINI.md
```

### Cursor

```bash
mkdir -p .cursor/rules
cp templates/ai-tool-profiles/cursor/.cursorignore .cursorignore
cp templates/ai-tool-profiles/cursor/.cursor/rules/security-hardening.mdc .cursor/rules/security-hardening.mdc
cp templates/ai-tool-profiles/cursor/AGENTS.md AGENTS.md
```

### No-code / low-code

```bash
mkdir -p security/no-code
cp templates/ai-tool-profiles/no-code/connector-register.csv security/no-code/connector-register.csv
cp templates/ai-tool-profiles/no-code/release-gate-checklist.md security/no-code/release-gate-checklist.md
```

### Add a posture overlay

```bash
cp templates/ai-tool-profiles/postures/solo/ROOT-INSTRUCTIONS.md .ai-security-overlay.md
mkdir -p .ai
cp templates/ai-tool-profiles/postures/solo/.ai/agent-policy.yaml .ai/agent-policy.yaml
cp templates/ai-tool-profiles/postures/solo/tool-approval-matrix.csv .ai/tool-approval-matrix.csv
```

Swap `solo` for `startup`, `prod-sensitive`, or `gdpr-sensitive` depending on the repo.

## Notes

- These files are safe baselines, not proof that a project is secure.
- For tool-specific caveats, bundle selection, and official docs, see `references/ai/ai-tool-profiles.md`.

