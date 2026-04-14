# Codex Defensive Start Modes

Use `AGENTS.md` with an explicit launch mode so the session posture is obvious.

## Recommended starts

### Daily safe default

```bash
codex --suggest
```

### Local edits with review

```bash
codex --auto-edit
```

### High-risk mode

```bash
codex --full-auto
```

Use `--full-auto` only inside a sandboxed, disposable, version-controlled workspace where autonomous command execution is acceptable.

## Operating rules

- Prefer explicit launch flags over a permanently permissive default.
- Keep the repo root clean of secrets and production exports before starting Codex.
- Review every auth, billing, webhook, deletion, infra, and CI change manually before merge.
