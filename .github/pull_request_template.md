## Description

<!-- What does this PR do? -->

## Security Checklist

Work through this checklist before requesting review. Check every item or explain why it does not apply.

### Input & Output
- [ ] All user inputs are validated (type, length, format) server-side
- [ ] Parameterized queries / ORM used for all database calls (no string concatenation)
- [ ] Output is encoded before rendering (HTML, JSON, SQL context-appropriate)
- [ ] File uploads: MIME type, extension, size, and storage path validated
- [ ] No `eval()`, `exec()`, `shell=True`, `innerHTML`, or equivalent with user data

### Authentication & Authorization
- [ ] Every endpoint verifies authentication (no unauthenticated routes by accident)
- [ ] Authorization checked at the object level (ownership, not just role) to prevent IDOR/BOLA
- [ ] Deny-by-default applied: access explicitly granted, not assumed
- [ ] New admin or privileged routes are protected and not just hidden

### Secrets & Sensitive Data
- [ ] No hardcoded secrets, API keys, tokens, or passwords in code or config files
- [ ] Environment variables / secrets manager used for all credentials
- [ ] Sensitive data (PII, tokens, passwords) is NOT logged
- [ ] Logs do not contain bearer tokens, cookies, session IDs, or emails

### Dependencies
- [ ] New dependencies are justified and from a trustworthy source
- [ ] `npm audit` / `pip-audit` / `cargo audit` shows no new critical/high CVEs
- [ ] Lockfile updated and committed

### Network & API
- [ ] CORS configuration is explicit (no `*` with credentials)
- [ ] Rate limiting considered for new endpoints (auth, search, upload, reset)
- [ ] Error messages are generic to the client (no stack traces, no version info)
- [ ] Server-side fetch: URL is validated against an allowlist (no SSRF risk)

### Code Quality
- [ ] No debug code, `TODO: fix security`, or `# temporary` security bypass left in
- [ ] TLS verification not disabled (`verify=False`, `NODE_TLS_REJECT_UNAUTHORIZED=0`)
- [ ] No broad `try/except: pass` swallowing security-relevant errors

## Notes for Reviewer

<!-- Anything that warrants extra attention during the security review? -->
