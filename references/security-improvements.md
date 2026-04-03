# Security Improvement Plan (Defense in Depth)

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Essential | Automation: Partial (CI/CD axes; threat modeling and pentest manual)


Approach based on the **Shift-Left** principle and **defense in depth**.
Sources: OWASP, NIST 800-53 / 800-63B, CIS Benchmarks.

---

## 1. Code Security (SAST/DAST & Reviews)

Goal: eliminate vulnerabilities at the source (OWASP Top 10: Injections, XSS, IDOR...).

**Quick Wins (Immediate)**

- **Eliminate injections:** always use parameterized queries or a secure ORM. Never concatenate SQL strings.
- **Prevent XSS:** use the auto-escaping of modern frameworks (React, Vue, Angular). Ban `innerHTML` and `eval()`.
- **Security linters:** enable security rules in the developer IDE (`eslint-plugin-security`).

**Long Term**

- **Security-focused code reviews:** require peer approval with a security checklist (access control/IDOR checks on every PR).
- **Continuous SAST and DAST** in the CI/CD pipeline.

**Open Source / Free Tools**

| Category | Tool |
|----------|------|
| SAST | Semgrep, SonarQube (Community), Bandit (Python), Gosec (Go) |
| DAST | OWASP ZAP |

---

## 2. Authentication & Session Management

The number one target for attackers. Follow **NIST 800-63B** recommendations.

**Quick Wins (Immediate)**

- **Session cookies:** always set `HttpOnly`, `Secure`, and `SameSite=Strict` (or `Lax`).
- **Password policy (NIST):** remove arbitrary expiration (e.g. every 90 days). Require 12+ characters and block compromised passwords.
- **Password storage:** use **Argon2id** or **Bcrypt** (high work factor). Never MD5/SHA1/SHA256.

**Long Term**

- **MFA & Passkeys:** implement WebAuthn (FIDO2) for phishing-resistant authentication.
- **Identity delegation:** do not build your own auth system. Use OAuth2/OIDC or SAML through an Identity Provider (IdP).
- **JWT:** sign with RS256 (asymmetric), verify `aud` and `iss`, keep a short lifetime (15 min) with rotating Refresh Tokens.

**Open Source / Free Tools**

| Category | Tool |
|----------|------|
| IdP / IAM | Keycloak, Authelia, Zitadel |
| Compromised passwords | HaveIBeenPwned API (k-Anonymity) |

---

## 3. Infrastructure & Server Configuration

Reduce the attack surface and harden exposed components.

**Quick Wins (Immediate)**

- **HTTP headers:** implement HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.
- **Hide versions:** `server_tokens off;` (Nginx), `ServerSignature Off` (Apache), remove `X-Powered-By`.
- **TLS:** enforce TLS 1.2 minimum (prefer TLS 1.3) and disable weak ciphers.

**Long Term**

- **Content Security Policy (CSP):** deploy a strict CSP (nonce- or hash-based) to block XSS and data exfiltration.
- **OS hardening:** apply CIS Benchmarks on Linux (disable root SSH, use key-based auth, configure AppArmor/SELinux).
- **WAF & IPS:** deploy a Web Application Firewall to block generic attacks.

**Open Source / Free Tools**

| Category | Tool |
|----------|------|
| TLS / Headers audit | Mozilla Observatory, SSL Labs |
| WAF / IPS | Coraza, CrowdSec |
| OS audit | Lynis |

---

## 4. Dependencies & Supply Chain (SCA)

Modern applications are composed of ~80% third-party code.

**Quick Wins (Immediate)**

- **Automated updates:** enable bots to automatically apply security patches.
- **Local audit:** integrate `npm audit`, `pip-audit` or `cargo audit` into developer workflows.

**Long Term**

- **SBOM (Software Bill of Materials):** generate a SBOM on every build to know exactly what is running in production.
- **Block builds:** fail the CI/CD pipeline if a critical vulnerability (CVSS > 8.0) with an available fix is detected.

**Open Source / Free Tools**

| Category | Tool |
|----------|------|
| SCA & SBOM | Trivy, Syft |
| Continuous management | OWASP Dependency-Track, Renovate, Dependabot |

---

## 5. CI/CD & DevSecOps

Automate security so it does not become a bottleneck.

**Quick Wins (Immediate)**

- **Secret scanning:** scan the Git history to ensure no passwords, API keys or tokens are hardcoded.
- **Least privilege CI/CD:** restrict runner permissions (e.g. do not grant AWS admin rights to a GitHub Actions runner).

**Long Term**

- **Secrets management:** never inject secrets in plaintext into CI. Use a dynamic secrets vault.
- **Artifact signing:** sign Docker images and commits to guarantee integrity (prevents SolarWinds-style attacks).

**Open Source / Free Tools**

| Category | Tool |
|----------|------|
| Secret scanning | Gitleaks, TruffleHog |
| Secrets management | HashiCorp Vault (OSS), SOPS (Mozilla) |
| Signing | Sigstore (Cosign) |

---

## 6. Monitoring & Incident Response

Adopt an "Assume Breach" mindset: the goal is to detect a compromise in minutes, not months.

**Quick Wins (Immediate)**

- **Security logging:** log all authentication attempts (successes/failures), privilege changes and admin actions. Never log passwords, tokens or PII in plaintext.
- **Basic alerting:** create alerts on spikes of 500 errors, spikes of 401/403 (brute force) and logins from unusual countries.

**Long Term**

- **SIEM & centralization:** ship all logs (application, server, WAF) to a centralized, immutable log store.
- **Incident Response Plan (IRP):** document who to contact, how to isolate a server, how to communicate with customers. Run annual tabletop exercises.

**Open Source / Free Tools**

| Category | Tool |
|----------|------|
| SIEM / XDR | Wazuh, Elastic Stack (ELK), Grafana Loki |

---

## 7. Offensive Security Testing

Validate the effectiveness of defenses in place.

**Quick Wins (Immediate)**

- **security.txt:** place a `/.well-known/security.txt` file to allow security researchers to report vulnerabilities ethically.
- **Threat modeling:** before coding a critical feature, run a STRIDE workshop (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).

**Long Term**

- **Manual pentest:** have a grey-box penetration test performed at least once a year by an external certified provider (OSCP, CREST).
- **Bug Bounty / VDP:** launch a private then public Vulnerability Disclosure Program (VDP) to reward ethical hackers.
- **Fuzzing:** integrate fuzzing on APIs to test robustness against malformed inputs.

**Open Source / Free Tools**

| Category | Tool |
|----------|------|
| Scanning / Fuzzing | Nuclei, ffuf |
| Threat modeling | OWASP Threat Dragon |

---

## Top 3 Priorities This Week

1. Install **Gitleaks** as a pre-commit hook to stop secret leaks.
2. Run your site through **Mozilla Observatory** and fix the HTTP headers.
3. Configure **Trivy** in CI to block dependencies with critical CVEs.
