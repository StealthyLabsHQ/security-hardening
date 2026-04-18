---
title: "OWASP Top 10"
slug: owasp-top10
category: appsec
depth: 1
audit_level: [1, 2]
last_reviewed: 2026-04-03
sources:
  - "OWASP Top 10 2021"
triggers_strong: ["owasp top 10", "xss", "sql injection", "security misconfiguration"]
triggers_weak: ["security review", "appsec basics"]
related: ["cwe-owasp-mapping", "api-security"]
---

# OWASP Top 10 - 2021 Reference

> Last reviewed: 2026-04-03 | Next review: 2029-01-01 (next OWASP release) | Priority: Essential | Automation: Partial


## A01 - Broken Access Control
**What**: Users act outside intended permissions. Includes IDOR, privilege escalation, JWT tampering.

**Attack examples**:
- Changing `?user_id=123` to `?user_id=124` to access another user's data
- Accessing `/admin` without being admin
- JWT `alg: none` bypass

**Fixes**:
- Enforce server-side authorization on every request
- Deny by default; grant explicitly
- Log and alert on access control failures
- Invalidate JWT server-side (use short TTL + refresh tokens)

---

## A02 - Cryptographic Failures
**What**: Weak/missing encryption of sensitive data at rest or in transit.

**Attack examples**:
- Plain HTTP (no TLS) for login forms
- MD5/SHA1 password storage → rainbow table attacks
- Hardcoded encryption keys in source code
- Unencrypted PII in DB

**Fixes**:
- TLS 1.2+ everywhere; HSTS enabled
- argon2id / bcrypt (cost ≥12) / scrypt for passwords
- AES-256-GCM for symmetric encryption
- Never store sensitive data you don't need

---

## A03 - Injection
**What**: Untrusted data sent to an interpreter as part of a command or query.

**Types**: SQL, NoSQL, LDAP, OS command, SSTI, XML/XXE

**Attack examples**:
```sql
-- Input: ' OR '1'='1
SELECT * FROM users WHERE email = '' OR '1'='1'
```
```python
# OS injection
os.system(f"ping {user_input}")  # input: "; rm -rf /"
```

**Fixes**:
- Parameterized queries / prepared statements
- ORM with proper escaping
- Input validation (allowlist, not blocklist)
- Never pass user input to OS/eval/exec functions

---

## A04 - Insecure Design
**What**: Missing or ineffective security controls by design (not implementation bugs).

**Examples**:
- No rate limiting on password reset → brute force
- Business logic flaws (e.g., apply coupon multiple times)
- No fraud detection on financial operations

**Fixes**:
- Threat modeling during design phase
- Security requirements as part of user stories
- Defense in depth patterns

---

## A05 - Security Misconfiguration
**What**: Insecure default configs, unnecessary features enabled, verbose errors.

**Examples**:
- Default admin credentials not changed
- Directory listing enabled
- Stack traces shown to users
- Cloud storage bucket publicly readable
- Debug mode in production

**Fixes**:
- Hardening guides per component (nginx, PostgreSQL, AWS IAM)
- Disable everything not needed
- Custom error pages
- Regular config audits

---

## A06 - Vulnerable and Outdated Components
**What**: Using components with known CVEs or abandoned packages.

**Examples**:
- `log4j` < 2.15.0 (Log4Shell, CVSS 10.0)
- `lodash` < 4.17.21 (prototype pollution)
- `openssl` < 1.0.2 (Heartbleed)

**Fixes**:
- `npm audit`, `pip-audit`, `trivy` in CI/CD
- SBOM (Software Bill of Materials)
- Subscribe to security advisories for key deps
- Automated PRs for dep updates (Dependabot, Renovate)

---

## A07 - Identification and Authentication Failures
**What**: Weak auth implementation allows credential attacks or session hijacking.

**Attack examples**:
- Brute force with no rate limiting
- Credential stuffing (reused passwords from leaks)
- Predictable session tokens
- Session not invalidated on logout

**Fixes**:
- Rate limiting + lockout on login
- MFA for sensitive operations
- CSPRNG for session tokens (≥128 bits entropy)
- Invalidate session server-side on logout
- bcrypt/argon2 for password storage

---

## A08 - Software and Data Integrity Failures
**What**: Code/infrastructure updates without integrity verification. Insecure CI/CD.

**Examples**:
- CDN scripts without SRI (`<script src="cdn.example.com/lib.js">`)
- Auto-update mechanism with no signature verification
- CI pipeline with write access to prod, no branch protection

**Fixes**:
- SRI hashes: `<script integrity="sha384-..." crossorigin="anonymous">`
- Signed releases / verified package checksums
- Code review + protected branches in CI/CD

---

## A09 - Security Logging and Monitoring Failures
**What**: Insufficient logging makes breaches undetectable or unresponsive.

**Examples**:
- Failed logins not logged
- No alerts on privilege escalation
- Logs stored locally (deleted if system compromised)
- No incident response plan

**Fixes**:
- Log authentication events, access control failures, input validation failures
- Centralized, append-only log storage (SIEM)
- Automated alerts on anomalies
- Log retention policy (≥1 year for compliance)

---

## A10 - Server-Side Request Forgery (SSRF)
**What**: Server fetches user-supplied URL → attacker can reach internal services.

**Attack example**:
```
POST /fetch-url
url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
```
→ Leaks AWS instance credentials

**Fixes**:
- Allowlist of permitted domains/IPs for server-side fetch
- Block private/loopback/link-local ranges
- Disable HTTP redirects or validate redirect destinations
- Use a dedicated egress proxy with filtering

