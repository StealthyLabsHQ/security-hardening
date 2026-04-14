---
name: security-review
description: Find vulns, leaks, unsafe defaults. Defensive fixes.
tags: [security, audit, owasp]
---

## Workflow

1. **Context** — identify language, framework, entry points, data flows, trust boundaries.
2. **Threat model** — enumerate actors, assets, attack surfaces (STRIDE: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation).
3. **Audit** — systematically scan each category below.
4. **Harden** — propose minimal-diff fixes; prefer stdlib over custom crypto/parsers.
5. **Validate** — check fixes don't break functionality; verify no new surface introduced.
6. **Report** — severity (Critical/High/Medium/Low/Info), file:line, impact, fix.

## Audit Checklist

### Injection
- SQL: parameterized queries only; no string concat with user input.
- Command: avoid `exec`/`shell=True`/`system()`; use allow-lists for args.
- Template: escape output; avoid `render(user_input)`.
- Path traversal: normalize paths; reject `..`; use `realpath` + prefix check.

### Authentication & Session
- Passwords: bcrypt/argon2/scrypt with proper cost factor (>=12 rounds bcrypt).
- Sessions: cryptographically random IDs (>=128 bits); regenerate on privilege change.
- JWTs: verify `alg` header matches expected; reject `alg: none`; short expiry + refresh.
- MFA: rate-limit OTP attempts; constant-time comparison.

### Authorization
- Check authz on every endpoint, not just UI routes.
- Enforce ownership: `WHERE user_id = :current_user` on queries.
- Avoid IDOR: never expose raw DB IDs in URLs without ownership check.
- Privilege escalation: verify role before any admin action.

### Secrets & Config
- No hardcoded secrets, API keys, passwords in source.
- Env vars for all credentials; never log them.
- `.env` in `.gitignore`; check git history for accidental commits.
- Secret scanning hooks pre-commit.

### Cryptography
- No MD5/SHA1 for security purposes; use SHA-256+.
- No ECB mode; prefer AES-GCM or ChaCha20-Poly1305.
- No custom crypto; no home-grown RNG.
- TLS: enforce 1.2+; validate certificates; no `verify=False`.

### Input Validation
- Validate type, length, format, range on all inputs (server-side).
- Reject unexpected fields (allowlist, not denylist).
- Sanitize before storage and before output (XSS: encode HTML entities).

### Dependencies
- Flag CVEs in direct + transitive deps.
- Prefer well-maintained packages; check last commit date.
- Lock dependency versions.

### Logging & Error Handling
- Never log passwords, tokens, PII, full request bodies with secrets.
- Generic error messages to clients; verbose only in server logs.
- Log auth failures, privilege changes, admin actions with user ID + IP.

### CORS & Headers
- `Access-Control-Allow-Origin`: never `*` for credentialed requests.
- Set: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`.

### File Uploads
- Validate MIME type server-side (not just extension).
- Store outside webroot; rename files; virus-scan if applicable.
- Limit size; never execute uploaded files.

## Severity Definitions
- **Critical**: RCE, SQLi, auth bypass, secret exposure in public repo.
- **High**: IDOR, stored XSS, privilege escalation, weak crypto in use.
- **Medium**: reflected XSS, missing CSRF, verbose errors, info disclosure.
- **Low**: missing security headers, weak session config.
- **Info**: best-practice deviations without direct exploitability.
