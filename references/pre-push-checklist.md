# Pre-Push Security Checklist

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Essential | Automation: Partial (Gitleaks covers secrets; logic checks are manual)

Run this before every `git push`. Takes 2 minutes. Saves hours of incident response.

---

## Secrets & Credentials

- [ ] No API keys, tokens, or passwords in any staged file (`git diff --cached`)
- [ ] `.env` is in `.gitignore` and NOT in `git status` output
- [ ] No `.pem`, `.key`, `.p12`, `.pfx`, `id_rsa`, or service account JSON staged
- [ ] No credential in README, comments, or example files
- [ ] No secret hardcoded as a default value in function arguments
- [ ] Config files contain only placeholders, not real values

```bash
# Quick scan before push
git diff --cached | grep -iE "(api_key|secret|password|token|sk-|ghp_|AKIA)" | grep "^\+"
```

---

## Dangerous Code Patterns

- [ ] No `eval(`, `exec(`, `new Function(` with user-controlled input
- [ ] No `shell=True` with user-controlled command
- [ ] No `pickle.loads(`, `yaml.load(` (not `yaml.safe_load`) with untrusted data
- [ ] No `innerHTML =` with user-controlled content
- [ ] No `verify=False` or `NODE_TLS_REJECT_UNAUTHORIZED=0`
- [ ] No `BinaryFormatter`, `ObjectInputStream`, `Marshal.load` on untrusted data
- [ ] No string concatenation building SQL queries

```bash
# Quick scan for dangerous patterns
git diff --cached | grep -E "^\+" | grep -iE "(eval\(|shell=True|pickle\.loads|yaml\.load\(|innerHTML|verify=False|BinaryFormatter)"
```

---

## Authentication & Authorization

- [ ] New endpoints have authentication checks
- [ ] New endpoints that fetch objects by ID also check ownership (IDOR prevention)
- [ ] No new route marked `public` or `no_auth` without intentional reason
- [ ] Admin/privileged actions have explicit role checks
- [ ] No `role`, `isAdmin`, or `permissions` field accepted from the request body

---

## Input & Output

- [ ] User input is validated server-side (type, length, format)
- [ ] File uploads: extension, MIME type, size limit validated; stored with a random name
- [ ] No user input passed to `os.system`, `subprocess`, `shell_exec`, or equivalent
- [ ] Output encoded before rendering (HTML context: escape; SQL: parameterized)
- [ ] Error responses return a generic message, not a stack trace or internal path

---

## Sensitive Data

- [ ] No PII (emails, names, IPs) logged in plaintext
- [ ] No tokens, session IDs, or passwords logged anywhere
- [ ] No sensitive data returned in API responses that do not need it
- [ ] Passwords stored with Argon2id or bcrypt, not SHA-256/MD5

---

## Dependencies

- [ ] New packages have been checked (`npm audit`, `pip-audit`, or equivalent)
- [ ] No packages with known critical CVEs added without justification
- [ ] Lockfile updated and included in the commit

---

## Configuration & Infrastructure

- [ ] `DEBUG=False` (or equivalent) for anything going to production
- [ ] No hardcoded `localhost`, `127.0.0.1`, or dev-only URLs in production code paths
- [ ] No commented-out debug code or `TODO: fix security` left in
- [ ] Docker: no `--privileged`, no root user without justification

---

## Frontend-Specific

- [ ] No server-side API keys in frontend code (OpenAI, Anthropic, Stripe secret, etc.)
- [ ] Sensitive operations go through the backend, not direct API calls from the browser
- [ ] No secrets in `localStorage` or `sessionStorage`
- [ ] No secrets in URL query parameters

---

## Quick Automation

Run all at once before pushing:

```bash
# 1. Check staged diff for obvious secrets
git diff --cached | grep -E "^\+" | grep -iE "(api.?key|secret.?key|password|token|sk-|ghp_|AKIA|sk_live)"

# 2. Run Gitleaks on staged files
gitleaks protect --staged --verbose

# 3. Check for dangerous patterns
git diff --cached | grep -E "^\+" | grep -iE "(eval\(|shell=True|pickle\.loads|yaml\.load\(|verify=False|innerHTML\s*=)"

# 4. Confirm .env is not staged
git status | grep "\.env"
```

Or install the pre-commit hook once and let it run automatically:

```bash
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.4
    hooks:
      - id: gitleaks
```

```bash
pre-commit install
```
