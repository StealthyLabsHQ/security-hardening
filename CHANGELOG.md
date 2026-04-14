# Changelog

All notable changes to this repository are documented here.
Format: `[YYYY-MM-DD] Description`

---

## [2026-04-14] - Eighteenth batch

### Added
- `tools/ai-skills/` — zero-dependency Node.js CLI (`npx ai-skills`) that installs skills from this repo into any AI CLI: Claude Code, Codex, Gemini CLI, Cursor, Copilot, Windsurf. Auto-detects installed CLIs. Ships 7 bundled skills: `security-review`, `api-security`, `secret-leak-prevention`, `llm-agent-security`, `mcp-security`, `graphql-security`, `vibecoder-traps`. Supports remote registries via `--registry <url>`.
- `README.md` — new **Quick install** section documenting `npx ai-skills` usage.

---

## [2026-04-14] - Seventeenth batch

### Updated
- `SKILL.md` - Added a dedicated `Validate` step for security tests and regression proof, expanded triggers to cover CI/CD, supply chain, cloud IAM, containers/K8s, and IaC, and extended references toward testing, infrastructure, and incident-response material while keeping the manifest portable.

---

## [2026-04-14] - Sixteenth batch

### Added
- `references/ai-bundle-presets.md` - Ready-made merged bundle map for common high-security scenarios, with direct copy paths for Claude Code, Cursor, Gemini CLI, Codex, and no-code / low-code.
- `templates/ai-tool-profiles/bundles/` - Pre-merged bundles:
  - `claude-code-prod-sensitive`
  - `cursor-prod-sensitive`
  - `gemini-cli-prod-sensitive`
  - `codex-gdpr-sensitive`
  - `no-code-gdpr-sensitive`

### Updated
- `templates/ai-tool-profiles/README.md` - Added visibility for the new ready-made merged bundles.
- `README.md` - Added the bundle pack to the installation/usage overview and linked the new bundle reference.
- `references/coverage-matrix.md` - Added coverage row for `ai-bundle-presets.md`.

---

## [2026-04-14] - Fifteenth batch

### Added
- `templates/ai-tool-profiles/postures/` - Posture overlay pack with `solo`, `startup`, `prod-sensitive`, and `gdpr-sensitive` variants. Each includes `ROOT-INSTRUCTIONS.md`, `.ai/agent-policy.yaml`, and `tool-approval-matrix.csv` for merging onto the base AI tool profiles.

### Updated
- `templates/ai-tool-profiles/README.md` - Added copy instructions for posture overlays in addition to the base tool profiles.
- `references/ai-tool-profiles.md` - Added the posture overlay model, selection table, and rollout sequence combining base profile + risk posture.
- `README.md` - Added visibility for the new `solo` / `startup` / `prod-sensitive` / `gdpr-sensitive` overlays.
- `references/coverage-matrix.md` - Expanded the `ai-tool-profiles.md` row to reflect the new posture overlay coverage.

---

## [2026-04-14] - Fourteenth batch

### Added
- `references/ai-tool-profiles.md` - New reference mapping copy-paste defensive profiles to Claude Code, Codex, Gemini CLI, Cursor, and no-code / low-code tools, with official vendor documentation links.
- `templates/ai-tool-profiles/` - Ready-to-copy defensive baseline pack:
  - `claude-code/.claude/settings.json` + `CLAUDE.md`
  - `codex/AGENTS.md` + launch guidance
  - `gemini-cli/.gemini/settings.json` + `GEMINI.md`
  - `cursor/.cursorignore` + `.cursor/rules/security-hardening.mdc` + `AGENTS.md`
  - `no-code/connector-register.csv` + `release-gate-checklist.md`

### Updated
- `README.md` - Added the new copy-paste AI tool profile pack and linked the new profile-map reference.
- `references/coverage-matrix.md` - Added coverage row for `ai-tool-profiles.md`.

---

## [2026-04-14] - Thirteenth batch

### Added
- `references/ai-ide-no-code-security.md` - Dedicated hardening guide for AI IDE assistants, browser builders, and no-code / low-code tools: workspace indexing risk, extension/plugin trust, public previews, connector sprawl, service-account ownership, publish gates, exportability, and mandatory human-review zones.

### Updated
- `references/ai-cli-hardening.md` - Clarified that CLI controls must be paired with adjacent AI IDE, browser-builder, and no-code controls; added a short mapping table and pointer to the new guide.
- `references/quick-start-ai-coding.md` - Added extra checks for Cursor-style IDEs, browser builders, and no-code tools: protected previews, service-account ownership, prompt hygiene, webhook verification, and exportability.
- `SKILL.md` - Updated triggers and references so the skill now explicitly points at IDE / no-code hardening, not only CLI-style agent security.
- `README.md` - Added the new AI IDE / no-code reference and included it in the maximum-protection quick-start sequence.
- `.github/pull_request_template.md` - Added a review gate for no-code connectors, webhooks, preview links, and publish scopes.
- `references/coverage-matrix.md` - Added coverage row for the new AI IDE / no-code security guide.

---

## [2026-04-14] - Twelfth batch

### Added
- `references/defensive-security-baseline.md` - Maximum-protection defensive baseline for developers, founders, executives, and small teams: priority account hardening, workstation controls, data separation, BEC-resistant comms, travel/remote work, SaaS/AI tool hardening, backup resilience, and incident readiness rollout.
- `references/gdpr-security-ops.md` - Operational GDPR / RGPD security guide mapping Articles 5/25/28/30/32/33/35 and transfer controls to concrete engineering, vendor, DSAR, breach, and evidence-management actions.
- `.github/workflows/content-lint.yml` - Content policy workflow enforcing the `SKILL.md` 1024-byte portability budget and presence of review metadata headers on every reference file.

### Updated
- `SKILL.md` - Expanded the skill from pure vuln-finding to a more defensive posture including privacy, recovery, vendor risk, phishing/ransomware triggers, and GDPR impact reporting while keeping it portable.
- `README.md` - Added a maximum-protection quick-start path, a new Personal / Executive Defense section, the GDPR security operations guide, and the content-policy / scorecard / lint workflows to the Automation section.
- `.github/pull_request_template.md` - Added Privacy / GDPR and AI / Automation review gates so downstream projects are pushed to check data minimization, retention, processor impact, prompt-injection risk, and bot permissions.
- `references/coverage-matrix.md` - Added both new references, expanded the automation files list, refreshed the review date, and replaced stale closed gaps with a more accurate backlog (workstation examples, detections, compliance crosswalks, GraphQL tests, hostile-corpus review).

---

## [2026-04-14] - Eleventh batch

### Added
- `.github/workflows/script-lint.yml` - Dedicated lint pipeline for small ops/installer scripts. Runs `shellcheck` on `.sh`/`.bash` (severity=warning, all checks enabled, treated as errors) and `PSScriptAnalyzer` on `.ps1`/`.psm1`/`.psd1` with the security rule set (`PSAvoidUsingInvokeExpression`, `PSAvoidUsingConvertToSecureStringWithPlainText`, `PSAvoidUsingPlainTextForPassword`, `PSAvoidUsingComputerNameHardcoded`, etc.). Path-filtered to stay fast.

### Updated
- `references/language-patterns.md` - Added Bash / POSIX shell section: command injection / word splitting (CWE-78/77), unquoted expansion (the `rm -rf $TMPDIR/*` bug), missing `set -Eeuo pipefail` (CWE-754), `find -exec` and `xargs` injection, insecure download / `curl | sh` pattern with SHA-256 pinning fix (CWE-494/829/319), path traversal with `realpath` bounding (CWE-22), temp file races and `mktemp` (CWE-377/367), secrets on the command line via argv (CWE-214), `IFS` and `PATH` tampering (CWE-807), shebang and privilege escalation anti-patterns, per-script audit checklist, `shellcheck` detection commands.
- `README.md` - Added Bash / POSIX shell row to the language-patterns coverage table; added `script-lint.yml` to the Automation section.

---

## [2026-04-14] - Tenth batch

### Updated
- `references/language-patterns.md` - Added PowerShell section: `Invoke-Expression` / `iex` / `[scriptblock]::Create` (CWE-94/95), command injection via `cmd /c` and `Start-Process` string interpolation (CWE-78), path traversal in `Get-Content` / `Remove-Item` (CWE-22), `Import-Clixml` insecure deserialization (CWE-502), `ConvertTo-SecureString -AsPlainText -Force` and DPAPI footguns (CWE-798/321), `ServerCertificateValidationCallback` and `-SkipCertificateCheck` TLS bypass (CWE-295), download-and-run patterns (CWE-494/829), explanation that `ExecutionPolicy Bypass` is not a security boundary (Constrained Language Mode + WDAC are), per-script audit checklist, PSScriptAnalyzer + InjectionHunter detection commands.
- `README.md` - Added PowerShell row to the language-patterns coverage table.

---

## [2026-04-14] - Ninth batch

### Added
- `SECURITY.md` - Coordinated disclosure policy, supported branches, scope, safe harbor, hall of fame.
- `.github/dependabot.yml` - Weekly Dependabot updates for pinned GitHub Actions (SHA + version comment).
- `.github/CODEOWNERS` - Mandatory security review for every change; extra reviewers required for `.github/workflows/`.
- `.github/workflows/scorecard.yml` - OpenSSF Scorecard analysis on a weekly schedule and on push to `main`, with SARIF upload to GitHub code scanning.
- `.github/workflows/lint.yml` - actionlint (workflow validation) + lychee (markdown link check) on push, PR, and weekly cron.
- `references/database-security.md` - Parameterized queries by ORM, least-privilege DB accounts, Postgres Row-Level Security, encryption at rest, backup security, audit logging, network exposure checks, detection cheat sheet.
- `references/webhooks-security.md` - HMAC verification with timing-safe compare (Node/Python/Go), replay protection (timestamp + nonce), idempotency strategies, retry handling, IP allowlist limitations, secret rotation with two active keys, SSRF risk for receivers.
- `references/threat-modeling.md` - STRIDE / LINDDUN / PASTA cheat sheet, DFD primer, trust boundaries, abuse cases, reusable threat library, 90-minute workshop agenda, repo cross-references.

### Updated
- `SKILL.md` - Trimmed to under 1024 characters so it fits in the manifest budget enforced by claude.ai Skills and similar tools.
- `README.md` - "Install" section rewritten to cover Claude Code, Claude on the web (Skills + Projects), Gemini CLI, ChatGPT (Custom GPT + Project), and Codex / Codex CLI. Added new database / webhooks / threat-modeling references to the Web Application Security index.
- `.github/workflows/security.yml` - SHA-pinned every action with version comments, set workflow-level `permissions: {}` and minimal per-job permissions, added `concurrency` with `cancel-in-progress`, replaced obsolete `returntocorp/semgrep` image with `semgrep/semgrep:1.159.0`, added `persist-credentials: false` on every checkout, added `ignore-unfixed` to Trivy, set explicit retention on the SBOM artifact, enabled `comment-summary-in-pr: on-failure` for Dependency Review.

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
