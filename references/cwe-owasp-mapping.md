# CWE / OWASP / ASVS Mapping

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Recommended | Automation: Full (cross-reference for tool configuration)


Cross-reference table linking CWE identifiers, OWASP Top 10 categories, OWASP ASVS controls, and automated detection tools. Use this to standardize audit findings and link issues to compliance requirements.

---

## Web Application Vulnerabilities

| CWE | Name | OWASP Top 10 | ASVS Control | Vulnerable Pattern | SAST Tool / Rule |
|-----|------|--------------|--------------|-------------------|-----------------|
| CWE-89 | SQL Injection | A03 Injection | V5.3.4 | String concatenation in SQL queries | Semgrep: `sql-injection`, Bandit: `B608` |
| CWE-79 | Cross-Site Scripting (XSS) | A03 Injection | V5.3.3 | `innerHTML`, unescaped output in templates | Semgrep: `xss`, ESLint: `no-inner-html` |
| CWE-78 | OS Command Injection | A03 Injection | V5.3.8 | `exec(user_input)`, `shell=True` | Bandit: `B602`, `B603`; Semgrep: `command-injection` |
| CWE-94 | Code Injection | A03 Injection | V5.3.9 | `eval()`, `new Function()` | Semgrep: `eval-injection`, ESLint: `no-eval` |
| CWE-22 | Path Traversal | A01 Broken Access Control | V12.3.1 | Unsanitized filename in file path | Semgrep: `path-traversal`, Bandit: `B404` |
| CWE-611 | XML External Entity (XXE) | A05 Security Misconfig | V5.3.10 | XML parser with DTD enabled | Semgrep: `xxe`, Bandit: `B405`, `B408` |
| CWE-918 | Server-Side Request Forgery | A10 SSRF | V10.3 | User-controlled URL in server-side fetch | Semgrep: `ssrf` |
| CWE-502 | Deserialization of Untrusted Data | A08 Integrity Failures | V1.5.2 | `pickle.loads`, `ObjectInputStream`, `Marshal.load` | Bandit: `B301`, `B302`; Semgrep: `unsafe-deserialization` |
| CWE-352 | Cross-Site Request Forgery | A01 Broken Access Control | V4.2.2 | State-changing GET requests, missing CSRF token | Semgrep: `csrf` |
| CWE-943 | NoSQL Injection | A03 Injection | V5.3.4 | Object passed directly to MongoDB query | Semgrep: `nosql-injection` |

---

## Authentication & Session

| CWE | Name | OWASP Top 10 | ASVS Control | Vulnerable Pattern | SAST Tool / Rule |
|-----|------|--------------|--------------|-------------------|-----------------|
| CWE-287 | Improper Authentication | A07 Auth Failures | V2.1 | Missing auth check on endpoint | Manual review |
| CWE-384 | Session Fixation | A07 Auth Failures | V3.3.1 | Session ID not rotated on login | Manual review |
| CWE-613 | Insufficient Session Expiration | A07 Auth Failures | V3.3.2 | Long-lived or non-expiring tokens | Manual review |
| CWE-256 | Plaintext Credential Storage | A02 Crypto Failures | V2.4.1 | `password = sha256(input)` or stored in plaintext | Bandit: `B303` |
| CWE-916 | Weak Password Hash | A02 Crypto Failures | V2.4.1 | MD5/SHA1/SHA256 for passwords | Bandit: `B303`, `B324` |
| CWE-345 | JWT Algorithm Confusion | A02 Crypto Failures | V3.5.3 | `alg: none` accepted, `decode()` not `verify()` | Semgrep: `jwt-none-alg` |
| CWE-1004 | Missing HttpOnly Cookie | A07 Auth Failures | V3.4.2 | Cookie without `HttpOnly` flag | Semgrep: `cookie-missing-httponly` |
| CWE-614 | Missing Secure Cookie | A07 Auth Failures | V3.4.1 | Cookie without `Secure` flag | Semgrep: `cookie-missing-secure-flag` |

---

## Access Control

| CWE | Name | OWASP Top 10 | ASVS Control | Vulnerable Pattern | SAST Tool / Rule |
|-----|------|--------------|--------------|-------------------|-----------------|
| CWE-639 | IDOR / BOLA | A01 Broken Access Control | V4.2.1 | Object fetched by ID without ownership check | Manual / test |
| CWE-285 | Improper Authorization | A01 Broken Access Control | V4.1.1 | Missing role/permission check on privileged route | Manual review |
| CWE-269 | Improper Privilege Management | A01 Broken Access Control | V4.1.3 | Role elevated without audit | Manual review |
| CWE-1220 | Mass Assignment | A03 Injection | V4.2.1 | `User.create(req.body)` without allowlist | Semgrep: `mass-assignment` |

---

## Cryptography

| CWE | Name | OWASP Top 10 | ASVS Control | Vulnerable Pattern | SAST Tool / Rule |
|-----|------|--------------|--------------|-------------------|-----------------|
| CWE-327 | Broken Cryptographic Algorithm | A02 Crypto Failures | V6.2.2 | MD5, SHA1, DES, RC4 | Bandit: `B303`, `B304` |
| CWE-330 | Weak Random Number | A02 Crypto Failures | V6.3.1 | `Math.random()`, `random.random()` for tokens | Semgrep: `insecure-random` |
| CWE-295 | Certificate Validation Failure | A02 Crypto Failures | V9.1.1 | `verify=False`, `NODE_TLS_REJECT_UNAUTHORIZED=0` | Bandit: `B501`; Semgrep: `tls-no-verify` |
| CWE-321 | Hardcoded Cryptographic Key | A02 Crypto Failures | V6.4.1 | Key or IV hardcoded in source | Gitleaks, Semgrep: `hardcoded-secret` |

---

## Secrets & Configuration

| CWE | Name | OWASP Top 10 | ASVS Control | Vulnerable Pattern | SAST Tool / Rule |
|-----|------|--------------|--------------|-------------------|-----------------|
| CWE-798 | Hardcoded Credentials | A05 Security Misconfig | V2.10.4 | `password = "secret123"` in source | Gitleaks, TruffleHog, Semgrep: `hardcoded-credentials` |
| CWE-532 | Information Exposure Through Logs | A09 Logging Failures | V7.1.1 | `logger.info(password)` | Manual review |
| CWE-215 | Debug Information Exposure | A05 Security Misconfig | V14.3.1 | Stack trace in HTTP response | Semgrep |
| CWE-16 | Configuration Error | A05 Security Misconfig | V14.1 | `DEBUG=True` in production | Semgrep |

---

## Dependencies & Supply Chain

| CWE | Name | OWASP Top 10 | ASVS Control | Detection |
|-----|------|--------------|--------------|-----------|
| CWE-1104 | Use of Unmaintained Third-Party Component | A06 Vulnerable Components | V14.2.1 | Trivy, Snyk, `npm audit` |
| CWE-829 | Inclusion of Functionality from Untrusted Source | A08 Integrity Failures | V14.2.3 | CDN scripts without SRI hashes |
| CWE-494 | Download Without Integrity Check | A08 Integrity Failures | V14.2.3 | Packages without checksum verification |

---

## ASVS Level Summary

| ASVS Level | Target | Description |
|------------|--------|-------------|
| Level 1 | All software | Basic security hygiene, automated scanning |
| Level 2 | Standard web apps | Defense in depth, most applications should reach this |
| Level 3 | High-value applications | Medical, financial, military - maximum assurance |

Full ASVS checklist: https://owasp.org/www-project-application-security-verification-standard/

---

## Quick Tool Command Reference

```bash
# Semgrep - run all security rules
semgrep --config=auto .

# Bandit - Python SAST
bandit -r . -ll -ii

# Gosec - Go SAST
gosec ./...

# Gitleaks - secret scanning
gitleaks detect --source . --verbose

# npm audit
npm audit --audit-level=high

# pip-audit - Python dependency scan
pip-audit

# Trivy - filesystem scan
trivy fs --severity CRITICAL,HIGH .

# OWASP ZAP - baseline DAST (against running app)
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://your-app.example.com
```
