# Coverage Matrix

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: Recommended | Audit Level: 3 | Automation: None (meta inventory document)

Overview of all reference files: depth, review frequency, priority, and automation availability.

Last matrix review: **2026-04-14**

---

## Reference Files

| File | Topic | Depth | Priority | Audit Level | Review Frequency | Automation Available |
|------|-------|-------|----------|-------------|-----------------|---------------------|
| `quick-start-ai-coding.md` | AI coding security guide | High | Essential | 1 | Bi-annual | Partial (Gitleaks/Semgrep; IDOR and logic checks manual) |
| `pre-push-checklist.md` | Pre-push operational checklist | Medium | Essential | 1-2 | Annual | Partial (grep commands provided; auth checks manual) |
| `secret-leak-prevention.md` | Secret leak prevention & IR | High | Essential | 1-2 | Bi-annual | Full (Gitleaks, TruffleHog, GitHub push protection) |
| `vibecoder-traps.md` | Common copy-paste mistakes | High | Essential | 1 | Bi-annual | Full (Semgrep, Bandit, Gitleaks cover most patterns) |
| `owasp-top10.md` | OWASP Top 10 (2021) | High | Essential | 1-2 | Every 3 years (OWASP release cycle) | Partial (SAST covers A03/A06; A01/A04 need manual review) |
| `database-security.md` | Database hardening, least privilege, RLS, backups | High | Recommended | 2-3 | Annual | Partial (SAST catches raw SQL; DB privilege, RLS, and backup review manual) |
| `webhooks-security.md` | Webhook signatures, replay defense, idempotency | High | Recommended | 2-3 | Annual | Partial (signature/replay tests automatable; provider-specific flow review manual) |
| `secure-headers.md` | HTTP security headers | High | Essential | 1-2 | Annual | Full (Mozilla Observatory, securityheaders.com, Lynis) |
| `browser-security-modern.md` | Trusted Types, SRI, COOP/COEP, Permissions Policy | High | Recommended | 2-3 | Annual | Partial (header checks automatable; Trusted Types rollout and third-party review manual) |
| `language-patterns.md` | Per-language dangerous patterns | High | Essential | 1-2 | Annual | Full (Semgrep, Bandit, Gosec, ESLint security rules) |
| `production-error-handling.md` | Error handling and log security | High | Essential | 1-2 | Annual | Partial (SAST detects stack trace; log PII manual) |
| `framework-examples.md` | Per-framework secure configs | High | Recommended | 1-2 | Bi-annual | Full (copy-paste into project, then CI validates) |
| `security-myths.md` | Common misconceptions | Medium | Recommended | 1-2 | Annual | None (awareness content) |
| `threat-modeling.md` | STRIDE, LINDDUN, PASTA, trust boundaries, abuse cases | High | Recommended | 2-4 | Annual | None (facilitated modeling and prioritization require human judgment) |
| `api-security.md` | OWASP API Top 10 (2023) | High | Essential | 2-3 | Every 3 years + ongoing | Partial (rate limiting, input validation automatable; BOLA needs manual) |
| `graphql-security.md` | GraphQL authz, depth, cost, uploads, subscriptions | High | Context-Dependent | 2-3 | Annual | Partial (introspection/depth tests automatable; field authz and schema design manual) |
| `rate-limiting-infrastructure.md` | Edge, proxy, app, and Redis rate limiting patterns | High | Recommended | 2-3 | Annual | Partial (proxy tests and 429 telemetry automatable; quota design and bypass analysis manual) |
| `authorization-rbac.md` | RBAC/ABAC/ReBAC, IDOR | High | Essential | 2-3 | Annual | Partial (SAST catches some patterns; ownership checks need manual review) |
| `session-management.md` | Session rotation, invalidation, timeout, revocation | High | Essential | 2-3 | Annual | Partial (cookie and logout tests automatable; recovery and re-auth policy manual) |
| `webauthn-fido2.md` | Passkeys/WebAuthn server-side implementation | High | Recommended | 2-3 | Annual | Partial (ceremony tests automatable; recovery and attestation policy manual) |
| `security-improvements.md` | 7-axis improvement plan | Medium | Essential | 2-3 | Annual | Partial (CI/CD axes automatable; threat modeling/pentest manual) |
| `cwe-owasp-mapping.md` | CWE / OWASP / ASVS / SAST mapping | Medium | Recommended | 2-3 | Annual | Full (cross-reference for tool configuration) |
| `llm-agent-security.md` | LLM/Agent/MCP security | Medium | Recommended | 2-3 | Bi-annual (fast-moving field) | Partial (output validation; prompt injection mostly manual) |
| `mcp-security.md` | MCP attack vectors (SSRF, path traversal, injection, spoofing) | High | Recommended | 2-3 | Bi-annual (fast-moving field) | Partial (manifest static analysis; parameter validation in code; injection manual) |
| `ai-cli-hardening.md` | AI coding CLI baseline controls, policy-as-code, permission tiers | High | Essential | 2-3 | Bi-annual (fast-moving field) | Partial (policy lint and CI gates automatable; approvals/manual review needed) |
| `ai-tool-profiles.md` | Copy-paste defensive profiles and posture overlays for AI tools/builders | High | Essential | 1-3 | Bi-annual (fast-moving field) | Partial (template sync/checks automatable; approval and rollout decisions manual) |
| `ai-bundle-presets.md` | Ready-made merged bundles for common high-security AI tool scenarios | High | Essential | 1-3 | Bi-annual (fast-moving field) | Partial (template sync/checks automatable; rollout and exception handling manual) |
| `ai-ide-no-code-security.md` | AI IDE, browser builder, and no-code / low-code security | High | Essential | 1-3 | Bi-annual (fast-moving field) | Partial (secret scans, audit exports, webhook tests; connector and publish controls manual) |
| `hostile-corpus-review.md` | Reviewing untrusted docs, prompts, and MCP output safely | High | Recommended | 2-3 | Bi-annual (fast-moving field) | Partial (normalization/scanning automatable; semantic review manual) |
| `ai-agent-incident-response.md` | Incident response playbook for AI agents and MCP workflows | High | Recommended | 3-4 | Bi-annual (fast-moving field) | Partial (detection/containment automatable; investigation/communications manual) |
| `mobile-security.md` | iOS/Android security | High | Recommended | 2-3 | Annual (OWASP Mobile release cycle) | Partial (MobSF, static analysis; cert pinning needs manual) |
| `desktop-app-security.md` | C/C++/C#/Electron | High | Recommended | 2-3 | Annual | Partial (compiler flags, Electronegativity; DLL hijacking needs manual) |
| `endpoint-vba-security.md` | Endpoints, VBA macros | Medium | Recommended | 3 | Annual | Partial (CIS-CAT, OSQuery; macro policy needs GPO/manual) |
| `active-directory-hardening.md` | AD/Entra ID | High | Recommended | 3-4 | Annual | Partial (BloodHound, PingCastle; PIM/Conditional Access needs manual) |
| `social-engineering-physical.md` | Phishing, BEC, physical | Medium | Recommended | 3-4 | Annual | Partial (DMARC/SPF/DKIM automatable; phishing sim manual) |
| `defensive-security-baseline.md` | Personal, executive, and small-team defensive baseline | High | Essential | 1-3 | Bi-annual | Partial (device compliance, backup verification, SaaS audit logs automatable; opsec drills manual) |
| `iot-ot-security.md` | IoT/OT/Industrial | Medium | Context-Dependent | 3-4 | Annual | Partial (Zeek/Nozomi monitoring; OT IR manual) |
| `security-audit-levels.md` | Audit framework | Medium | Essential | All | Annual | None (framework document) |
| `security-testing-examples.md` | Executable security tests (REST, GraphQL, SSRF, upload, headers) | High | Recommended | 2-3 | Annual | Full (all tests runnable in CI) |
| `cloud-iam-hardening.md` | AWS/GCP/Azure IAM + storage | High | Recommended | 3-4 | Annual | Partial (Checkov, tfsec; IAM reviews manual) |
| `container-k8s-hardening.md` | Docker and Kubernetes | High | Recommended | 3 | Annual | Partial (Trivy, kube-bench, Kyverno; network policies manual) |
| `detection-engineering.md` | Detection rules for app, cloud, GraphQL, AI, and supply chain abuse | High | Recommended | 3-4 | Bi-annual (fast-moving detections) | Partial (detection-as-code automatable; tuning and triage manual) |
| `incident-playbooks.md` | Incident response procedures | Medium | Recommended | 3-4 | Annual | None (human-executed procedures) |
| `frontend-frameworks-security.md` | SSR leaks, DOM XSS, prototype pollution, CSP for SPAs | High | Recommended | 2-3 | Annual | Partial (ESLint security, Semgrep; SSR leaks and prototype pollution manual) |
| `supply-chain-security.md` | SLSA, SBOM, dependency confusion, Cosign, CI/CD pipeline | High | Recommended | 3 | Annual | Partial (Syft/Trivy SBOM, Cosign, govulncheck; SLSA provenance manual) |
| `applied-cryptography.md` | Algorithm selection, AEAD, CSPRNG, password hashing | High | Recommended | 2-3 | Annual | Partial (Semgrep/Bandit detect deprecated algos; key length manual) |
| `gdpr-security-ops.md` | GDPR governance, TOMs, breach handling, vendor/transfer controls | High | Essential | 2-4 | Annual | Partial (inventory and breach logging automatable; legal assessments manual) |
| `compliance-mapping.md` | Compliance and evidence crosswalk across major frameworks | Medium | Context-Dependent | 3-4 | Annual | None (control ownership and evidence mapping are manual) |
| `privacy-data-minimization.md` | PII in logs, retention, erasure, analytics | High | Recommended | 2-3 | Annual | Partial (log PII scanning; retention jobs manual) |
| `vuln-management.md` | Triage SLA, false positives, risk acceptance, metrics | High | Recommended | 3 | Annual | Partial (SLA tracking automatable; triage and acceptance manual) |
| `coverage-matrix.md` | This document | Medium | Recommended | 3 | Annual | None (meta document) |

---

## Automation Files

| File | Purpose | Trigger |
|------|---------|---------|
| `.github/workflows/content-lint.yml` | Enforce SKILL size budget and review metadata headers on refs | Every push / PR |
| `.github/workflows/lint.yml` | actionlint + markdown link checking | Every push / PR / weekly |
| `.github/workflows/scorecard.yml` | OpenSSF Scorecard with SARIF upload | Push to `main` / weekly |
| `.github/workflows/script-lint.yml` | Shell and PowerShell script linting | Script changes |
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
| Browser isolation / workstation examples per OS | Recommended | Add Windows/macOS/Linux step-by-step hardening snippets |
| Detection translations by SIEM/XDR | Recommended | Translate reusable detections to Elastic/Sentinel/Splunk and add triage playbooks |
| NIS2 / DORA operational evidence mapping | Context-Dependent | Extend `compliance-mapping.md` from a high-level crosswalk to owner/evidence/task checklists |
| Cloud / container runnable hardening tests | Recommended | Add executable IAM, OIDC trust, admission-policy, and network-policy verification examples |
