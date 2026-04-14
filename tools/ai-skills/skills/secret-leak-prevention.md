---
name: secret-leak-prevention
description: Detect and prevent secrets in code, logs, and git history.
tags: [security, secrets, git, scanning]
---

## Workflow

1. Scan codebase for hardcoded secrets (patterns below).
2. Audit logging statements for accidental secret inclusion.
3. Check `.gitignore` and git history.
4. Establish prevention controls (hooks, CI scanning, env patterns).
5. Rotate any exposed secrets immediately; treat exposure as a breach.

## Secret Patterns to Detect

```
# Generic
[Aa][Pp][Ii][-_][Kk][Ee][Yy]\s*=\s*["'][^"']{8,}
[Ss][Ee][Cc][Rr][Ee][Tt]\s*=\s*["'][^"']{8,}
[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]\s*=\s*["'][^"']{4,}
[Tt][Oo][Kk][Ee][Nn]\s*=\s*["'][^"']{8,}

# Cloud providers
(AKIA|AGPA|AIPA|AROA|ASCA|ASIA)[A-Z0-9]{16}   # AWS Access Key
AIza[0-9A-Za-z\\-_]{35}                         # GCP API key
[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}  # UUID-format tokens

# Common services
sk-[a-zA-Z0-9]{48}           # OpenAI
ghp_[a-zA-Z0-9]{36}          # GitHub PAT
xox[baprs]-[0-9a-zA-Z]{10,}  # Slack
```

## Code Anti-patterns

```python
# BAD: hardcoded
API_KEY = "sk-abc123..."

# BAD: default that looks benign
DB_PASSWORD = "changeme"

# BAD: in URL
requests.get(f"https://api.example.com?key={API_KEY}")

# GOOD: env var with explicit error on missing
import os
API_KEY = os.environ["API_KEY"]  # raises KeyError if missing — intentional
```

## Logging Traps

- Never log: `request.headers` (contains Authorization), `request.body` (may have passwords), full DB connection strings.
- Audit: `console.log(req)`, `logger.debug(config)`, `print(env)` — these dump entire objects.
- Redact before logging: replace secret values with `[REDACTED]`.
- Log frameworks: ensure structured loggers don't serialize entire config objects.

## Git Controls

- `.gitignore` must include: `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `secrets/`, `config/local.*`.
- Pre-commit hook: run `git-secrets`, `trufflehog`, or `detect-secrets` on staged files.
- CI check: scan every PR with secret scanning tool; block merge on match.
- Check history: `git log --all --full-diff -p | grep -E "(secret|password|key)\s*="`.

## Environment Variable Patterns

```bash
# Validate presence at startup — fail fast
required_vars=(DATABASE_URL API_KEY SIGNING_SECRET)
for var in "${required_vars[@]}"; do
  [[ -z "${!var}" ]] && { echo "Missing required env var: $var"; exit 1; }
done
```

```js
// Node.js: fail fast
function requireEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}
```

## Secret Rotation Checklist

When a secret is suspected/confirmed leaked:
1. Revoke/rotate the secret immediately (assume compromised).
2. Check access logs for unauthorized use since the commit date.
3. Remove from git history: `git filter-repo --path-glob '*.env' --invert-paths`.
4. Force-push; invalidate cached copies in CI/CD.
5. Notify security team; document incident.

## Tool Recommendations (zero-config)

- `git-secrets` — git hooks for AWS and custom patterns.
- `trufflehog` — scans git history with entropy analysis.
- `detect-secrets` — baseline + diff scanning, CI-friendly.
- `gitleaks` — fast Go binary, SARIF output for GitHub Advanced Security.
- GitHub: enable "Secret scanning" in repo settings (free for public repos).
