# ai-skill

Universal AI CLI skill installer. Installs skills from any GitHub-hosted registry into Claude Code, OpenAI Codex CLI, Gemini CLI, Cursor, GitHub Copilot, and Windsurf.

## Install

```bash
npx ai-skill <command>
```

## Commands

### `add <owner/repo> [skill] [--for targets] [--branch branch]`

Install skills from a GitHub repository that contains a `registry.json`.

```bash
# Install all skills from a repo
npx ai-skill add StealthyLabsHQ/security-hardening

# Install a specific skill only
npx ai-skill add StealthyLabsHQ/security-hardening security-review

# Install into specific AI CLIs only
npx ai-skill add StealthyLabsHQ/security-hardening --for claude,codex

# Install from a specific branch
npx ai-skill add StealthyLabsHQ/security-hardening@dev
```

Adapters are auto-detected from your machine if `--for` is not provided.

### `list`

Show all installed skills.

```bash
npx ai-skill list
```

### `remove <skill>`

Remove a skill from all adapters it was installed into.

```bash
npx ai-skill remove security-review
```

### `targets`

Show which AI CLIs are detected on this machine and how many skills each has.

```bash
npx ai-skill targets
```

## Registry format

Your repo must have a `registry.json` at the root:

```json
{
  "skills": {
    "security-review": {
      "description": "Security code review checklist",
      "file": "skills/security-review.md",
      "tags": ["security"]
    }
  }
}
```

Each `file` path is resolved relative to the repo root on GitHub raw.

## Supported adapters

| ID       | Tool             | Install location                          |
|----------|------------------|-------------------------------------------|
| claude   | Claude Code      | `~/.claude/skills/<name>.md`              |
| codex    | OpenAI Codex CLI | `~/.codex/instructions.md` (section)      |
| gemini   | Gemini CLI       | `~/.gemini/GEMINI.md` (section)           |
| cursor   | Cursor           | `~/.cursor/rules/<name>.md`               |
| copilot  | GitHub Copilot   | `.github/copilot-instructions.md` (section) |
| windsurf | Windsurf         | `~/.windsurf/rules/<name>.mdc`            |

## Requirements

- Node >= 18
- No external dependencies
