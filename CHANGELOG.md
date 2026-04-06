# Changelog

All notable changes to this repository are documented here.
Format: `[YYYY-MM-DD] Description`

---

## [2026-04-06] - Eighth batch

### Added
- `references/ai-cli-hardening.md` - Operational hardening baseline for AI coding CLIs (Claude Code, Codex CLI, Gemini CLI): default-deny profile, tiered permissions, policy-as-code template, prompt/context firewall, CI guardrails, maturity roadmap
- `references/ai-agent-incident-response.md` - Incident response playbook for AI agents and MCP workflows: containment, evidence collection, timeline reconstruction, blast radius analysis, recovery, communication template, post-incident hardening

### Updated
- `SKILL.md` - Added explicit agentic controls step and references to new AI CLI hardening + AI agent incident response guides
- `README.md` - Added both new AI-focused references in the AI/LLM & Agent Security section
- `references/coverage-matrix.md` - Added coverage rows for new AI CLI hardening and AI agent incident response documents
- `references/ai-cli-hardening.md` - Added vendor-neutral control mapping table and 14-day rollout plan
- `references/ai-agent-incident-response.md` - Added RACI-lite ownership model and recovery exit criteria checklist

---

## [2026-04-03] - Seventh batch

### Added
- `references/applied-cryptography.md` - Algorithm selection guide (Gemini input): Argon2id/bcrypt password hashing, AES-256-GCM/ChaCha20-Poly1305 authenticated encryption, CSPRNG usage, asymmetric algorithm table, HMAC vs plain hash, quick reference table, CWE mapping for common mistakes
- `references/supply-chain-security.md` - SLSA levels 0-3 with GitHub Actions provenance workflow, SBOM generation (Syft/Trivy, SPDX/CycloneDX), dependency confusion attack and mitigations (npm scoped packages, pip --index-url), Cosign keyless image signing, CI/CD hardening (pinned action SHAs, OIDC, minimal permissions)
- `references/frontend-frameworks-security.md` - SSR data leaks via `__NEXT_DATA__` and RSC payloads, DOM XSS in React/Vue (`dangerouslySetInnerHTML`, `v-html`, `javascript:` href), prototype pollution (attack chain, vulnerable libs, `Object.freeze` mitigations), `NEXT_PUBLIC_` secret exposure, CSRF in SPAs (double-submit pattern), nonce-based CSP for Next.js

---

## [2026-04-03] - Sixth batch

### Added
- `references/mcp-security.md` - Dedicated MCP security reference (Google Gemini input): Excessive Agency with HITL patterns, Indirect Prompt Injection via MCP with sanitization layer, Server Spoofing and malicious manifest validation, Path Traversal and SSRF in MCP tool parameters with Python validation examples

---

## [2026-04-03] - Fifth batch

### Added
- `references/security-testing-examples.md` - Executable security tests (pytest, Jest, Go): IDOR, rate limiting, file upload, SSRF, error handling, security headers, webhooks, ZAP baseline
- `references/cloud-iam-hardening.md` - AWS/GCP/Azure IAM least privilege, S3/GCS/Blob exposure, Secrets Manager, IMDS/IMDSv2, CloudTrail, IaC scanning (Checkov, tfsec)
- `references/container-k8s-hardening.md` - Dockerfile non-root/multi-stage/read-only, Trivy scanning, K8s Pod Security Standards, network policies, Secrets (External Secrets Operator, Vault), RBAC, Kyverno, Cosign image signing
- `references/incident-playbooks.md` - Response procedures for: compromised account, webhook token, JWT secret, exposed storage bucket, verbose error in prod, CORS misconfiguration. Includes postmortem template.

---

## [2026-04-03] - Fourth batch

### Added
- `references/security-audit-levels.md` - Progressive audit framework: 4 levels (solo MVP / live app / SaaS team / regulated), each with checklist, tools, time estimate, and next-level trigger

### Updated
- `references/coverage-matrix.md` - Added Audit Level column, reordered rows by level

---

## [2026-04-03] - Third batch

### Added
- `references/quick-start-ai-coding.md` - 10 pre-push checks for AI-assisted coding, false-sense-of-security table, incident response summaries, 5-minute project setup
- `references/pre-push-checklist.md` - 2-minute operational checklist before every git push, with inline grep commands
- `references/production-error-handling.md` - Generic error responses, correct HTTP status codes, server banner removal, logging security, startup config validation, debug mode risks

### Updated
- All markdown files: replaced all em-dashes with hyphens
- `README.md` - Added "Install in Claude Code" section

---

## [2026-04-03] - Second batch

### Added
- `references/secret-leak-prevention.md` - Secret leak prevention: incident response (revoke first), detection by type, frontend safety matrix, pre-commit setup, 8 vibecoder traps, secrets manager examples
- `references/security-myths.md` - 11 common misconceptions with explanations and fixes
- `references/framework-examples.md` - Copy-paste security configs for Express, NestJS, FastAPI, Django, Laravel, Spring Boot, Go/Gin
- `references/coverage-matrix.md` - Priority, audit level, review frequency, automation availability for all reference files
- `.gitignore-security-template` - Security-focused .gitignore covering secrets, keys, dumps, Terraform, Kubernetes
- `CHANGELOG.md` - This file

### Updated
- All reference files: added review metadata header (last reviewed, next review, priority, audit level, automation)
- `README.md` - Restructured with categorized sections, table of contents
- `SKILL.md` - Expanded trigger list, 8 key references, under 1024 chars

---

## [2026-04-03] - Initial batch

### Added
- `references/owasp-top10.md` - OWASP Top 10 (2021) quick-reference
- `references/secure-headers.md` - HTTP security headers with Nginx and Cloudflare Workers examples
- `references/language-patterns.md` - Dangerous code patterns per language (Node.js, Python, PHP, Go, Ruby, Java)
- `references/security-improvements.md` - 7-axis defense-in-depth improvement plan (OWASP, NIST 800-53/800-63B, CIS Benchmarks)
- `references/api-security.md` - OWASP API Top 10 (2023)
- `references/authorization-rbac.md` - RBAC/ABAC/ReBAC, deny-by-default, IDOR prevention
- `references/vibecoder-traps.md` - 12 common LLM copy-paste security mistakes
- `references/llm-agent-security.md` - OWASP LLM Top 10 (2025): prompt injection, RAG poisoning, MCP security
- `references/cwe-owasp-mapping.md` - CWE / OWASP / ASVS / SAST rule cross-reference
- `references/endpoint-vba-security.md` - VBA macros, AppLocker/WDAC, endpoint hardening
- `references/active-directory-hardening.md` - Tiering Model, LAPS, NTLM/SMBv1/LLMNR, Entra ID, PIM
- `references/mobile-security.md` - OWASP Mobile Top 10 (2024), Keychain/Keystore, cert pinning
- `references/desktop-app-security.md` - C/C++ memory safety, DLL hijacking, Electron hardening
- `references/social-engineering-physical.md` - Phishing, BEC, vishing, DMARC, physical access controls
- `references/iot-ot-security.md` - Purdue Model, OT protocols, firmware management, OT incident response
- `.github/workflows/security.yml` - CI pipeline: Gitleaks, Semgrep, Trivy, SBOM, Dependency Review
- `.github/pull_request_template.md` - Security checklist on every PR
- `README.md` - Structured documentation with install instructions for Claude Code

---

## [2026-04-03] - Seventh batch

### Added
- `references/privacy-data-minimization.md` - PII in logs (redaction patterns for Pino/Zap/Python logging), data retention policy template with scheduled deletion jobs, GDPR right to erasure implementation, PII in error tracking (Sentry scrubbing), support dumps scoping, analytics data minimization, session recording masking
- `references/vuln-management.md` - Full vulnerability lifecycle, severity classification with context adjustments, remediation SLA table (Critical 24h to Low 90d), triage decision tree, false positive documentation with in-code suppression justification, risk acceptance template (90-day expiry, two approvals, compensating controls), metrics and reporting, dependency reachability analysis (govulncheck)

### Updated
- `references/coverage-matrix.md` - Added 2 new entries

---

## Backlog

- [ ] Container/K8s maturity levels cross-reference
- [ ] Cloud misconfiguration examples for common vibecodeur mistakes (open S3, public RDS)
