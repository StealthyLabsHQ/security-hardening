# Security Hardening Reference

A developer-focused reference for writing secure code and hardening web applications. Covers the OWASP Top 10, secure HTTP headers, and common dangerous patterns per language.

---

## Contents

### `references/owasp-top10.md`
Quick-reference for the **OWASP Top 10 (2021)**. Each entry includes:
- What the vulnerability is
- Concrete attack examples
- Practical fixes and mitigations

Covers: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable Components, Auth Failures, Integrity Failures, Logging Failures, and SSRF.

### `references/secure-headers.md`
Reference for **secure HTTP response headers** with ready-to-use values for production. Includes:
- HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Cross-Origin headers (COEP, COOP, CORP)
- Cookie security attributes (`Secure`, `HttpOnly`, `SameSite`)
- CORS configuration (authenticated vs. public APIs)
- Headers to remove to reduce fingerprinting
- Drop-in hardening blocks for **Nginx** and **Cloudflare Workers**

### `references/language-patterns.md`
Per-language cheat sheet of **dangerous code patterns** to catch during code review or security audits. For each pattern: vulnerable example vs. safe alternative.

| Language | Patterns covered |
|----------|-----------------|
| Node.js / JavaScript | Command injection, code injection (`eval`), prototype pollution, path traversal, NoSQL injection |
| Python | Command injection, `eval`/`exec`, unsafe deserialization (`pickle`), path traversal, SSTI (Jinja2) |
| PHP | Command injection, `eval`, file inclusion, SQL injection, `extract()` abuse |
| Go | Template injection (`text/template`), command injection, path traversal, SQL injection |
| Ruby | Command injection, `eval`/ERB, unsafe `Marshal.load`, mass assignment |
| Java | SQL injection, XXE, unsafe deserialization |

---

## Usage

Use these files as:
- A **checklist** during security code reviews
- A **reference** when configuring web server or CDN headers
- A **training resource** for developers learning secure coding

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Mozilla Observatory](https://observatory.mozilla.org)
- [securityheaders.com](https://securityheaders.com)
