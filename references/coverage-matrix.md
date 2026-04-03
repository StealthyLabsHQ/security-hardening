# Coverage Matrix

Overview of all reference files: depth, review frequency, priority, and automation availability.

Last matrix review: **2026-04-03**

---

## Reference Files

| File | Topic | Depth | Priority | Audit Level | Review Frequency | Automation Available |
|------|-------|-------|----------|-------------|-----------------|---------------------|
| `quick-start-ai-coding.md` | AI coding security guide | High | Essential | 1 | Bi-annual | Partial (Gitleaks/Semgrep; IDOR and logic checks manual) |
| `pre-push-checklist.md` | Pre-push operational checklist | Medium | Essential | 1-2 | Annual | Partial (grep commands provided; auth checks manual) |
| `secret-leak-prevention.md` | Secret leak prevention & IR | High | Essential | 1-2 | Bi-annual | Full (Gitleaks, TruffleHog, GitHub push protection) |
| `vibecoder-traps.md` | Common copy-paste mistakes | High | Essential | 1 | Bi-annual | Full (Semgrep, Bandit, Gitleaks cover most patterns) |
| `owasp-top10.md` | OWASP Top 10 (2021) | High | Essential | 1-2 | Every 3 years (OWASP release cycle) | Partial (SAST covers A03/A06; A01/A04 need manual review) |
| `secure-headers.md` | HTTP security headers | High | Essential | 1-2 | Annual | Full (Mozilla Observatory, securityheaders.com, Lynis) |
| `language-patterns.md` | Per-language dangerous patterns | High | Essential | 1-2 | Annual | Full (Semgrep, Bandit, Gosec, ESLint security rules) |
| `production-error-handling.md` | Error handling and log security | High | Essential | 1-2 | Annual | Partial (SAST detects stack trace; log PII manual) |
| `framework-examples.md` | Per-framework secure configs | High | Recommended | 1-2 | Bi-annual | Full (copy-paste into project, then CI validates) |
| `security-myths.md` | Common misconceptions | Medium | Recommended | 1-2 | Annual | None (awareness content) |
| `api-security.md` | OWASP API Top 10 (2023) | High | Essential | 2-3 | Every 3 years + ongoing | Partial (rate limiting, input validation automatable; BOLA needs manual) |
| `authorization-rbac.md` | RBAC/ABAC/ReBAC, IDOR | High | Essential | 2-3 | Annual | Partial (SAST catches some patterns; ownership checks need manual review) |
| `security-improvements.md` | 7-axis improvement plan | Medium | Essential | 2-3 | Annual | Partial (CI/CD axes automatable; threat modeling/pentest manual) |
| `cwe-owasp-mapping.md` | CWE / OWASP / ASVS / SAST mapping | Medium | Recommended | 2-3 | Annual | Full (cross-reference for tool configuration) |
| `llm-agent-security.md` | LLM/Agent/MCP security | Medium | Recommended | 2-3 | Bi-annual (fast-moving field) | Partial (output validation; prompt injection mostly manual) |
| `mcp-security.md` | MCP attack vectors (SSRF, path traversal, injection, spoofing) | High | Recommended | 2-3 | Bi-annual (fast-moving field) | Partial (manifest static analysis; parameter validation in code; injection manual) |
| `mobile-security.md` | iOS/Android security | High | Recommended | 2-3 | Annual (OWASP Mobile release cycle) | Partial (MobSF, static analysis; cert pinning needs manual) |
| `desktop-app-security.md` | C/C++/C#/Electron | High | Recommended | 2-3 | Annual | Partial (compiler flags, Electronegativity; DLL hijacking needs manual) |
| `endpoint-vba-security.md` | Endpoints, VBA macros | Medium | Recommended | 3 | Annual | Partial (CIS-CAT, OSQuery; macro policy needs GPO/manual) |
| `active-directory-hardening.md` | AD/Entra ID | High | Recommended | 3-4 | Annual | Partial (BloodHound, PingCastle; PIM/Conditional Access needs manual) |
| `social-engineering-physical.md` | Phishing, BEC, physical | Medium | Recommended | 3-4 | Annual | Partial (DMARC/SPF/DKIM automatable; phishing sim manual) |
| `iot-ot-security.md` | IoT/OT/Industrial | Medium | Context-Dependent | 3-4 | Annual | Partial (Zeek/Nozomi monitoring; OT IR manual) |
| `security-audit-levels.md` | Audit framework | Medium | Essential | All | Annual | None (framework document) |
| `security-testing-examples.md` | Executable security tests | High | Recommended | 2-3 | Annual | Full (all tests runnable in CI) |
| `cloud-iam-hardening.md` | AWS/GCP/Azure IAM + storage | High | Recommended | 3-4 | Annual | Partial (Checkov, tfsec; IAM reviews manual) |
| `container-k8s-hardening.md` | Docker and Kubernetes | High | Recommended | 3 | Annual | Partial (Trivy, kube-bench, Kyverno; network policies manual) |
| `incident-playbooks.md` | Incident response procedures | Medium | Recommended | 3-4 | Annual | None (human-executed procedures) |
| `frontend-frameworks-security.md` | SSR leaks, DOM XSS, prototype pollution, CSP for SPAs | High | Recommended | 2-3 | Annual | Partial (ESLint security, Semgrep; SSR leaks and prototype pollution manual) |
| `supply-chain-security.md` | SLSA, SBOM, dependency confusion, Cosign, CI/CD pipeline | High | Recommended | 3 | Annual | Partial (Syft/Trivy SBOM, Cosign, govulncheck; SLSA provenance manual) |
| `applied-cryptography.md` | Algorithm selection, AEAD, CSPRNG, password hashing | High | Recommended | 2-3 | Annual | Partial (Semgrep/Bandit detect deprecated algos; key length manual) |
| `privacy-data-minimization.md` | PII in logs, retention, erasure, analytics | High | Recommended | 2-3 | Annual | Partial (log PII scanning; retention jobs manual) |
| `vuln-management.md` | Triage SLA, false positives, risk acceptance, metrics | High | Recommended | 3 | Annual | Partial (SLA tracking automatable; triage and acceptance manual) |
| `coverage-matrix.md` | This document | Medium | Recommended | 3 | Annual | None (meta document) |

---

## Automation Files

| File | Purpose | Trigger |
|------|---------|---------|
| `.github/workflows/security.yml` | Gitleaks + Semgrep + Trivy + SBOM + Dep Review | Every push / PR |
| `.github/pull_request_template.md` | Security checklist | Every PR (manual) |

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| **Essential** | Every project, every team, non-negotiable |
| **Recommended** | Most projects should implement; exceptions need justification |
| **Advanced** | High-security or specific-context environments |
| **Context-Dependent** | Only relevant for specific stacks, industries, or architectures |

---

## Automation Legend

| Level | Meaning |
|-------|---------|
| **Full** | Can be entirely automated in CI/CD (SAST, dependency scan, config check) |
| **Partial** | Some checks automatable, others require manual code review or testing |
| **None** | Requires human judgment, interviews, physical inspection, or penetration testing |

---

## Review Schedule

| Frequency | Rationale | Topics |
|-----------|-----------|--------|
| Bi-annual | Fast-moving: new attacks, new framework versions | LLM/agent security, framework examples, vibecoder traps |
| Annual | Moderately stable: standards update yearly | Headers, language patterns, auth, AD, mobile, myths, improvements plan |
| Every 3 years | Tied to OWASP release cycles | OWASP Top 10, OWASP API Top 10 |
| Event-driven | After a major breach, CVE, or new technology adoption | Any file touching the affected domain |

---

## Coverage Gaps (Backlog)

| Gap | Priority | Notes |
|-----|----------|-------|
| Security testing examples (pytest, Jest, ZAP) | Recommended | Show how to write security-specific tests |
| Maturity-level roadmap (solo dev / startup / enterprise) | Recommended | Prioritization by team maturity |
| Container and Kubernetes hardening | Recommended | Separate from endpoint; growing attack surface |
| CI/CD pipeline hardening (GitHub Actions, GitLab CI) | Recommended | Secrets in CI, runner permissions, artifact integrity |
| Privacy by design / GDPR technical controls | Context-Dependent | Data minimization, right to erasure implementation |
| Cloud misconfigurations (AWS/GCP/Azure) | Recommended | IAM least privilege, public S3, security groups |
