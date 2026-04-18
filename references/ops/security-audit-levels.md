---
title: "Security Audit Levels"
slug: security-audit-levels
category: ops
depth: 2
audit_level: [1, 2, 3, 4]
last_reviewed: 2026-04-03
sources:
  - "OWASP Web Security Testing Guide"
  - "NIST SP 800-115"
  - "PTES"
triggers_strong: ["audit level 1", "audit level 2", "audit level 3", "audit level 4"]
triggers_weak: ["audit process", "maturity"]
related: ["coverage-matrix", "security-testing-examples"]
---

# Security Audit Levels

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Essential | Automation: Partial

A progressive audit framework from solo developer to expert-level review.
Start at Level 1 and move up only when the previous level is fully addressed.

---

## How to Use This Guide

1. Identify your current level based on the "For who" description.
2. Work through the checklist for that level completely.
3. Fix all findings before moving to the next level.
4. Return to your current level after every major feature or infrastructure change.

---

## Level 1 - Basic Audit

**For who:** Solo developer, vibecodeur, MVP, internal tool, pre-launch app.
**Goal:** Remove obvious vulnerabilities that are trivial to exploit.
**Time:** 30 to 90 minutes.
**Skill required:** None - automated tools do most of the work.
**Deliverable:** Confirmation that no critical beginner mistakes are present.

### Checklist

**Secrets**
- [ ] No API keys, tokens, or passwords committed to Git (run `gitleaks detect`)
- [ ] `.env` is in `.gitignore` and not tracked
- [ ] No hardcoded credentials in any file

**Dependencies**
- [ ] `npm audit --audit-level=high` returns no critical/high issues
- [ ] `pip-audit` or `cargo audit` returns no critical issues

**HTTP Headers**
- [ ] HTTPS enforced (no plain HTTP in production)
- [ ] `X-Content-Type-Options: nosniff` present
- [ ] `X-Frame-Options: DENY` present
- [ ] `Strict-Transport-Security` present

**Cookies**
- [ ] Session cookies have `HttpOnly`, `Secure`, `SameSite=Strict`

**Authentication**
- [ ] Passwords hashed with Argon2id or bcrypt (not SHA-256/MD5)
- [ ] Login endpoint has rate limiting

**Dangerous patterns**
- [ ] No `eval()`, `exec()`, `new Function()` with user input
- [ ] No `shell=True` with user-controlled input
- [ ] No `pickle.loads()` or `yaml.load()` (without SafeLoader) on untrusted data
- [ ] No SQL built by string concatenation

**Logging**
- [ ] No passwords or tokens logged
- [ ] Error responses do not include stack traces

### Tools for Level 1

| Tool | Command | What it checks |
|------|---------|---------------|
| Gitleaks | `gitleaks detect --source .` | Secrets in code/history |
| npm audit | `npm audit --audit-level=high` | Vulnerable JS packages |
| pip-audit | `pip-audit` | Vulnerable Python packages |
| Mozilla Observatory | observatory.mozilla.org | HTTP headers |
| Semgrep | `semgrep --config=auto .` | Dangerous patterns |

### When to move to Level 2

When the app is accessible on the internet, handles real user accounts, or stores any user data.

---

## Level 2 - Intermediate Audit

**For who:** App already live on the internet, early-stage SaaS, app handling real user data.
**Goal:** Cover the vulnerabilities most commonly exploited in production web apps.
**Time:** Half a day to one full day.
**Skill required:** Ability to read code and test API endpoints manually.
**Deliverable:** Written list of findings with severity and fix for each.

### Checklist

**Authorization (most commonly missed)**
- [ ] Every endpoint that returns an object verifies the caller owns it (IDOR/BOLA test: log in as user A, try to access user B's resource by changing an ID)
- [ ] Admin/privileged endpoints check role server-side, not just in the frontend
- [ ] Deny-by-default: new routes require explicit permission grant

**Input validation**
- [ ] All user inputs validated server-side (type, length, format)
- [ ] File uploads: extension allowlist, MIME type check, size limit, random storage name
- [ ] JSON payloads have schema validation; unknown fields are stripped (prevents mass assignment)

**CORS**
- [ ] `Access-Control-Allow-Origin` is not `*` for authenticated endpoints
- [ ] `*` is not combined with `Access-Control-Allow-Credentials: true`

**Rate limiting**
- [ ] Login endpoint: max 10 attempts per 15 minutes per IP
- [ ] Password reset: max 5 per hour per IP
- [ ] Any endpoint that sends email/SMS: rate limited

**Error responses**
- [ ] 500 responses return a generic message and reference ID only
- [ ] Server version headers removed (`Server:`, `X-Powered-By:`)
- [ ] Debug mode disabled in production

**SSRF**
- [ ] Server-side fetch of user-supplied URLs validated against allowlist
- [ ] Private/loopback IP ranges blocked from server-side requests

**Path traversal**
- [ ] File paths built from user input are resolved and checked against allowed base directory

**Secrets in CI/CD**
- [ ] No secrets hardcoded in workflow files
- [ ] Least-privilege permissions on CI runners

### Manual Tests for Level 2

```bash
# IDOR test - replace IDs across users
# 1. Create two accounts: user_a and user_b
# 2. Create a resource as user_a, get its ID
# 3. Log in as user_b
# 4. Try: GET /api/resources/{user_a_resource_id}
# Expected: 404 or 403. If 200: IDOR vulnerability.

# Mass assignment test
curl -X POST /api/users/profile \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"name":"test","role":"admin","isVerified":true}'
# Check response and database: role/isVerified should not have changed

# Rate limit test
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST /api/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Expected: 429 after 10 attempts
```

### Tools for Level 2

| Tool | What it checks |
|------|---------------|
| OWASP ZAP (baseline scan) | Automated DAST scan |
| Burp Suite Community | Manual API testing |
| ffuf | Directory and endpoint discovery |
| sqlmap (on staging only) | SQL injection |

### When to move to Level 3

When the app has multiple user roles, handles sensitive data (financial, medical, PII), or has a team of developers committing regularly.

---

## Level 3 - Advanced Audit

**For who:** Production SaaS with real users, app handling financial or health data, team of 3+ developers.
**Goal:** Defense in depth - cover systematic vulnerabilities, supply chain, and detection.
**Time:** 1 to 3 days.
**Skill required:** Security engineer background or developer with solid security knowledge.
**Deliverable:** Formal audit report with findings, severity (CVSS or similar), recommended fixes, and remediation timeline.

### Checklist

**Authorization model**
- [ ] Authorization model documented (RBAC/ABAC/ReBAC)
- [ ] Every resource type has a defined ownership/sharing model
- [ ] Policy enforced in code, not just filtered at query level

**Session management**
- [ ] Session tokens: 128+ bits entropy, generated with CSPRNG
- [ ] Sessions invalidated server-side on logout
- [ ] Concurrent session policy defined
- [ ] JWT: RS256, short lifetime (15 min), rotating refresh tokens, revocation list

**Webhooks and integrations**
- [ ] All incoming webhooks verify HMAC signature
- [ ] OAuth flows validate `state` parameter and use PKCE for public clients
- [ ] Third-party API responses validated before use

**Infrastructure hardening**
- [ ] Docker: non-root user, no `--privileged`, read-only mounts where possible
- [ ] Container images scanned with Trivy before deployment
- [ ] Kubernetes: network policies, pod security standards, secret management via Vault or CSI
- [ ] TLS 1.2 minimum, TLS 1.3 preferred, weak ciphers disabled

**Supply chain**
- [ ] SBOM generated on every build
- [ ] CI blocks on critical CVEs with available fix
- [ ] Dependency update automation (Dependabot or Renovate)
- [ ] Docker base images pinned to digest, not tag

**Secrets management**
- [ ] Secrets stored in a vault (HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager)
- [ ] Secrets rotated on a defined schedule
- [ ] No secrets in environment variables baked into Docker images

**Observability**
- [ ] Auth events logged (login success/failure, logout, password change)
- [ ] Access control failures logged and alerted
- [ ] Anomaly detection: login from new country, bulk data export, privilege escalation
- [ ] Log retention: minimum 90 days online, 1 year archived

**Content Security Policy**
- [ ] CSP deployed with nonce-based or hash-based script allowlist
- [ ] `report-uri` or `report-to` configured to collect violations

### Tools for Level 3

| Tool | What it checks |
|------|---------------|
| Trivy | Container and dependency CVEs |
| Semgrep (custom rules) | App-specific patterns from `references/appsec/language-patterns.md` |
| BloodHound | AD attack paths (if applicable) |
| OWASP ZAP (full scan) | Dynamic application scan |
| Nuclei | Known vulnerability templates |
| Checkov / tfsec | Infrastructure-as-code misconfigs |

### When to move to Level 4

When the app handles regulated data (HIPAA, PCI-DSS, GDPR with high-risk processing), or when a breach would cause significant financial or reputational damage.

---

## Level 4 - Expert Audit

**For who:** Fintech, healthtech, critical infrastructure, regulated environment, or any app where a breach has serious consequences.
**Goal:** Test actual resilience against determined attackers. Validate defenses, not just documentation.
**Time:** Several days to weeks. Often involves an external specialist.
**Skill required:** Certified penetration tester (OSCP, CREST, GPEN) or equivalent experience.
**Deliverable:** Full penetration test report including exploitation evidence, attack narrative, and remediation roadmap.

### Checklist

**Threat modeling**
- [ ] STRIDE analysis documented for every major component
- [ ] Data flow diagrams with trust boundaries
- [ ] Attack tree for highest-value assets
- [ ] Threat model reviewed after every major architectural change

**Architecture review**
- [ ] Network segmentation validated (not just documented)
- [ ] Blast radius of each component assessed: what can be reached if it is compromised?
- [ ] Privilege separation between services (no service has more access than it needs)

**Penetration test (grey-box)**
- [ ] External attack surface: subdomains, exposed APIs, S3 buckets, old versions
- [ ] Authentication bypass attempts: JWT manipulation, session fixation, OAuth abuse
- [ ] Business logic: coupon stacking, privilege escalation through legitimate flows
- [ ] Second-order injection: stored inputs that are processed later
- [ ] Race conditions on financial operations

**Cloud and IAM**
- [ ] AWS/GCP/Azure IAM roles follow least privilege
- [ ] No overly permissive policies (`*:*` on production resources)
- [ ] Service accounts have only the permissions they need
- [ ] Cloud storage buckets are not publicly accessible
- [ ] CloudTrail/Stackdriver/Monitor logging enabled and alarmed

**Fuzzing**
- [ ] API endpoints fuzzed with malformed inputs (ffuf, Radamsa, or Atheris for Python)
- [ ] File upload endpoints fuzzed with polyglot files, overlong filenames, path traversal payloads

**Incident response validation**
- [ ] Tabletop exercise: simulate a ransomware incident
- [ ] Tabletop exercise: simulate a credential leak
- [ ] Recovery time objective (RTO) and recovery point objective (RPO) tested

**Bug bounty / VDP**
- [ ] Vulnerability Disclosure Policy published at `/.well-known/security.txt`
- [ ] Private bug bounty program in place, or plan to launch one

### External Resources for Level 4

| Resource | Purpose |
|----------|---------|
| OWASP Testing Guide (OTG) | Comprehensive manual test cases |
| PTES (Penetration Testing Execution Standard) | Methodology framework |
| NIST SP 800-115 | Technical guide to information security testing |
| MITRE ATT&CK | Adversary tactics and techniques reference |
| HackerOne / Bugcrowd | Bug bounty program platforms |

---

## Coverage Matrix by Audit Level

Each reference file in this repository maps to one or more audit levels.

| File | Level 1 | Level 2 | Level 3 | Level 4 |
|------|---------|---------|---------|---------|
| `quick-start-ai-coding.md` | Core | - | - | - |
| `pre-push-checklist.md` | Core | Core | - | - |
| `owasp-top10.md` | Partial | Core | - | - |
| `secure-headers.md` | Core | Core | - | - |
| `language-patterns.md` | Core | Core | - | - |
| `vibecoder-traps.md` | Core | - | - | - |
| `secret-leak-prevention.md` | Core | Core | - | - |
| `api-security.md` | - | Core | Core | - |
| `authorization-rbac.md` | - | Core | Core | - |
| `production-error-handling.md` | Core | Core | - | - |
| `security-improvements.md` | - | Core | Core | Core |
| `cwe-owasp-mapping.md` | - | Core | Core | Core |
| `framework-examples.md` | Core | Core | - | - |
| `security-myths.md` | Core | Core | - | - |
| `mobile-security.md` | - | Core | Core | - |
| `desktop-app-security.md` | - | Core | Core | - |
| `endpoint-vba-security.md` | - | - | Core | - |
| `active-directory-hardening.md` | - | - | Core | Core |
| `social-engineering-physical.md` | - | - | Core | Core |
| `iot-ot-security.md` | - | - | Core | Core |
| `llm-agent-security.md` | - | Core | Core | Core |
| `coverage-matrix.md` | - | - | Core | Core |

Legend: **Core** = primary reference for this level. **Partial** = partially relevant.

---

## Summary

| Level | For who | Time | Key focus | Next trigger |
|-------|---------|------|-----------|-------------|
| 1 | Solo dev / MVP | 30-90 min | Secrets, deps, basic headers, no eval | Going live on the internet |
| 2 | Live app with users | Half-day to 1 day | IDOR, input validation, CORS, rate limiting | Multiple roles, sensitive data, team of 3+ |
| 3 | Production SaaS / team | 1-3 days | AuthZ model, supply chain, infra hardening, detection | Regulated data, high-value target |
| 4 | Regulated / critical | Days to weeks | Threat model, pentest, fuzzing, red team | Ongoing, after major changes |


