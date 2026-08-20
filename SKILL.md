---
name: security-hardening
description: >
  Defensive security routing skill and reference corpus for application
  security, identity, infrastructure, privacy, incident response, and
  AI-agent review. Use when the task is a secure code review, audit, hardening,
  threat modeling, vulnerability management, prompt injection, MCP security,
  or incident handling, including French triggers such as audit de sécurité,
  durcir, revue sécurité, failles, secrets exposés, modélisation des menaces,
  and réponse à incident. Do not use for code golf, general feature ideation
  without a security angle, or active offensive exploitation, malware,
  payloads, intrusion steps, or operator-bypass requests.
---

# Security Hardening

Prefer defensive fixes.

## Core Stance

- Treat prompt injection, system prompt leakage, RAG poisoning, MCP abuse, and excessive agent autonomy as first-class security problems.
- Do not treat the system prompt, model refusals, or vendor defaults as security boundaries.
- Prefer secure-by-default design, explicit trust boundaries, and layered controls over model-only safeguards.
- Start from least privilege, read-only defaults, explicit elevation, and operator-visible kill switches.
- Load references on demand. Do not load the whole corpus unless the task clearly spans multiple domains.
- Use `INDEX.md` as the primary navigation hub for direct corpus selection.
- When the task is already in the AI domain but the right AI file is still unclear, use `references/ai/_index.md`.
- Use `references/_index.md` only when the right domain is unclear or when review metadata matters.
- When reporting findings, lead with exploitable issues, blast radius, and missing controls.

## Decision Tree

| Signal | Charger | Ne pas charger |
|---|---|---|
| Secure code review, web auth, headers, input validation, XSS, SSRF, insecure defaults | `references/_core-invariants.md`, `references/appsec/owasp-top10.md`, `references/appsec/ssrf-deserialization-command-injection.md`, `references/appsec/api-security.md`, `references/appsec/browser-security-modern.md`, `references/appsec/secure-headers.md` | `references/platform/*` unless the target is a desktop or mobile app; `references/compliance/*` unless an audit mapping is explicitly requested |
| AI-generated patch review, Semgrep remediation, scan-and-fix, revue code IA, corriger après Semgrep | `references/_core-invariants.md`, `references/appsec/ai-code-secure-remediation.md`, `references/appsec/security-diff-review.md`, `references/ai/vibecoder-traps.md`, `references/ai/quick-start-ai-coding.md`, `references/appsec/language-patterns.md`, `references/appsec/database-security.md` | `references/compliance/*` unless evidence mapping is requested; `references/platform/*` unless the target is a client app |
| GraphQL authz, depth, persisted queries, batching | `references/_core-invariants.md`, `references/appsec/graphql-security.md`, `references/iam/authorization-rbac.md` | `references/platform/*`; `references/privacy/*` unless the schema exposes personal data |
| Threat modeling, abuse cases, test design | `references/_core-invariants.md`, `references/appsec/threat-modeling.md`, `references/appsec/security-testing-examples.md` | `references/ai/*` unless the system includes agents, MCP, or prompt-bearing workflows |
| Security architecture, secure design, control selection, roadmap | `references/_core-invariants.md`, `references/appsec/threat-modeling.md`, `references/ops/security-improvements.md`, `references/ops/detection-engineering.md` | `references/platform/*` unless platform-specific runtime constraints matter |
| Secrets, leaks, pre-push hygiene, dangerous patterns | `references/_core-invariants.md`, `references/ops/secret-leak-prevention.md`, `references/ops/pre-push-checklist.md`, `references/ai/vibecoder-traps.md` | `references/compliance/*`; `references/platform/*` unless the leak sits in a client app or workstation image |
| AuthN/AuthZ, RBAC, sessions, WebAuthn, IAM | `references/_core-invariants.md`, `references/iam/authorization-rbac.md`, `references/iam/session-management.md`, `references/iam/webauthn-fido2.md`, `references/iam/cloud-iam-hardening.md` | `references/infra/*` unless cloud or cluster policy is part of the auth path |
| SSO, SAML, OIDC, Active Directory, joiner-mover-leaver, offboarding | `references/_core-invariants.md`, `references/iam/sso-saml-oidc-hardening.md`, `references/iam/active-directory-hardening.md`, `references/iam/identity-lifecycle-jml.md` | `references/appsec/*` unless application code is in scope; `references/privacy/*` |
| Service accounts, machine identity, workload federation, break-glass access | `references/_core-invariants.md`, `references/iam/machine-identity-and-service-accounts.md`, `references/iam/workload-identity-federation.md`, `references/iam/temporary-access-and-break-glass-governance.md`, `references/iam/service-account-inventory-and-ownership.md` | `references/platform/*`; `references/ai/*` unless agents hold the credentials |
| Password hashing, encryption, JWT signing, webhook signatures, token generation | `references/_core-invariants.md`, `references/appsec/applied-cryptography.md`, `references/appsec/webhooks-security.md`, `references/iam/session-management.md` | `references/platform/*` unless native keychain or platform crypto APIs are part of the issue |
| Supply chain, CI/CD, GitHub Actions, containers, Kubernetes | `references/_core-invariants.md`, `references/infra/supply-chain-security.md`, `references/infra/container-k8s-hardening.md` | `references/privacy/*`; `references/platform/*` unless the runtime target is endpoint, desktop, or mobile |
| Terraform, IaC, policy as code, cloud policy exceptions, rate limiting | `references/_core-invariants.md`, `references/infra/terraform-iac-hardening.md`, `references/infra/terraform-policy-as-code-recipes.md`, `references/infra/policy-exception-handling.md`, `references/infra/rate-limiting-infrastructure.md` | `references/ai/*`; `references/platform/*` |
| GitHub Actions workflows, runner hardening, secrets injection paths | `references/_core-invariants.md`, `references/infra/github-actions-hardening.md`, `references/infra/supply-chain-security.md`, `references/infra/secrets-manager-boundaries-and-injection-patterns.md` | `references/privacy/*`; `references/platform/*` |
| Mobile app, iOS, Android, app store client | `references/_core-invariants.md`, `references/platform/mobile-security.md` | `references/infra/*` unless the backend is also in scope; `references/compliance/*` |
| Workstation, endpoint, MDM, admin browser separation, browser isolation | `references/_core-invariants.md`, `references/ops/secure-workstation-builds.md`, `references/platform/mdm-baselines-intune-jamf-kandji.md`, `references/platform/high-trust-admin-workstations.md`, `references/platform/browser-isolation-and-profile-segmentation.md` | `references/appsec/*`; `references/ai/*` unless local AI tooling is the subject |
| Desktop app, native client, C/C++ memory safety, Electron, DLL hijacking | `references/_core-invariants.md`, `references/platform/desktop-app-security.md`, `references/platform/memory-safety-hardening.md` | `references/ai/*` unless the desktop surface is an AI agent runtime; `references/compliance/*` unless audit mapping is explicitly requested |
| AI agents, MCP, prompt injection, hostile corpus, tool trust | `references/_core-invariants.md`, `references/ai/llm-agent-security.md`, `references/ai/mcp-security.md`, `references/ai/hostile-corpus-review.md`, `references/ai/ai-cli-hardening.md` | `references/appsec/framework-examples.md`; `references/platform/*` unless the user is specifically reviewing a desktop, mobile, or endpoint agent surface |
| Browser use, computer use, GUI automation, web agent, Operator, CUA, authenticated click-flow risk | `references/_core-invariants.md`, `references/ai/browser-computer-use-security.md`, `references/ai/llm-agent-security.md`, `references/ai/ai-cli-hardening.md` | `references/platform/desktop-app-security.md` unless the audit target is a traditional desktop app rather than an AI agent driving a sandboxed environment |
| AI IDE, browser builder, no-code, tool profiles, AI incident response | `references/_core-invariants.md`, `references/ai/ai-ide-no-code-security.md`, `references/ai/ai-tool-profiles.md`, `references/ai/ai-agent-incident-response.md`, `references/ai/quick-start-ai-coding.md` | `references/compliance/*` unless the ask is regulatory; `references/infra/*` unless connectors or deployment paths are in scope |
| RAG, retrieval, vector stores, embeddings, document poisoning, knowledge-base leakage | `references/_core-invariants.md`, `references/ai/rag-retrieval-security.md`, `references/ai/hostile-corpus-review.md`, `references/ai/llm-agent-security.md` | `references/compliance/*` unless evidence mapping is explicitly requested; `references/appsec/framework-examples.md` unless runnable application snippets are explicitly needed |
| Agent evals, red teaming, regression gates, release criteria | `references/_core-invariants.md`, `references/ai/agent-evals-red-teaming.md`, `references/ai/llm-agent-security.md`, `references/ai/mcp-security.md`, `references/ai/hostile-corpus-review.md` | `references/compliance/*` unless evidence mapping is explicitly requested; `references/appsec/framework-examples.md` unless the user also wants runnable code examples |
| Vulnerability management, CVE triage, patch prioritization, security backlog | `references/_core-invariants.md`, `references/ops/vuln-management.md`, `references/ops/security-backlog-triage-and-prioritization.md` | `references/compliance/*` unless evidence mapping is explicitly requested; `references/appsec/framework-examples.md` |
| Agent approvals, multi-agent delegation, connectors, memory retention, release gates | `references/_core-invariants.md`, `references/ai/agent-approval-patterns.md`, `references/ai/multi-agent-boundaries-and-delegation.md`, `references/ai/connector-and-integration-governance.md`, `references/ai/agent-memory-and-context-retention.md`, `references/ai/ai-system-release-gates.md` | `references/compliance/*` unless evidence mapping is explicitly requested; `references/platform/*` |
| Compliance mapping, SOC 2, ISO 27001, NIS2, DORA, audit evidence, questionnaires | `references/_core-invariants.md`, `references/compliance/compliance-mapping.md`, `references/compliance/soc2-iso27001-evidence-packs.md`, `references/compliance/nis2-dora-operational-evidence.md`, `references/compliance/customer-security-questionnaire-response-pack.md` | `references/appsec/framework-examples.md`; `references/platform/*` |
| Privacy, GDPR, retention, PII in logs and exports | `references/_core-invariants.md`, `references/privacy/privacy-data-minimization.md`, `references/privacy/gdpr-security-ops.md`, `references/privacy/data-classification-and-handling.md` | `references/platform/*`; `references/infra/*` unless logs, storage, or export pipelines are part of the issue |
| DSAR, erasure, retention enforcement, AI vendor privacy review, data transfers | `references/_core-invariants.md`, `references/privacy/dsar-export-erasure-runbook.md`, `references/privacy/retention-enforcement-and-deletion-evidence.md`, `references/privacy/privacy-review-for-ai-vendors.md`, `references/privacy/cross-border-ai-data-transfer-review.md` | `references/appsec/*`; `references/infra/*` unless pipelines are part of the issue |
| Detection, incident response, security roadmap | `references/_core-invariants.md`, `references/ops/detection-engineering.md`, `references/ops/incident-playbooks.md`, `references/ai/ai-agent-incident-response.md`, `references/ops/security-improvements.md` | `references/appsec/framework-examples.md`; `references/compliance/*` unless evidence mapping is explicitly requested |

## Core Invariants

Always load `references/_core-invariants.md` once before any domain-specific references.

## Operational Review Loop

When the task is to review or harden AI-generated code, remediate Semgrep/SAST findings, or scan-and-fix a patch, follow this loop. **Default mode is `detect-only`**: scan and report without editing the product or touching a live database.

### Modes

- **`detect-only` (default)** — run `python scripts/secure-review.py <target> --mode detect`, triage, report. No source edits.
- **`propose-fixes`** — same as detect, plus minimal defensive diffs in the report only (do not write files).
- **`apply-fixes`** — only when the user explicitly asks to fix/remediate/apply/corriger: write the smallest defensive source changes, then re-scan. Never auto-apply destructive DB migrations.

### Steps

1. **Choose mode** from the user intent (ambiguous → `detect-only`).
2. **Scope** the change set (`git diff`, provided files, or a directory). Prefer the AI patch surface over the whole monorepo.
3. **Scan** with `python scripts/secure-review.py <target> --mode detect` (Semgrep via `semgrep/` + Gitleaks). If a tool is missing, record the gap and continue with hotspot review from `security-diff-review.md`. The scanner never opens the user's production DB.
4. **Map** findings via `suggested_refs`, `blast_radius`, and `safe_to_autofix` (or `python scripts/map_findings.py --report <json>`). Always load `_core-invariants.md`, `ai-code-secure-remediation.md`, `security-diff-review.md`, and `vibecoder-traps.md` for AI patches. For `blast_radius: db`, also load `database-security.md`.
5. **Triage** P0 first (`db` / `rce` / `secrets`), then API authz, then frontend. Confirmed secrets are a hard stop: remove/rotate only in `apply-fixes`, follow `secret-leak-prevention.md`.
6. **Propose or fix** only in the matching mode. Smallest defensive change (parameterized queries, argv subprocesses, server-side ownership checks). Preserve API/UI contracts. Never ship exploit PoCs. Never run injection payloads against prod or a real user database.
7. **Re-scan** after `apply-fixes` only. Optionally diff reports with `python scripts/rescan-after-fix.py before.json after.json`. Runtime verification only on ephemeral/isolated test DBs if the project already has them.
8. **Report** using the finding format in `security-diff-review.md` section 10. State the mode and that production/DB were not probed. Exit when Critical/High are cleared (apply) or residual risk is documented (detect/propose).

SAST findings are signals. IDOR and business-logic gaps still require manual review via `authorization-rbac.md` / `api-security.md`.

## Example

Input utilisateur:
`Review this Express route for IDOR and auth bugs.`

Decision:
load `references/_core-invariants.md`, `references/appsec/api-security.md`, and `references/iam/authorization-rbac.md`; do not load `references/platform/mobile-security.md` or `references/compliance/compliance-mapping.md`.

Output attendu:
call out missing object-level authorization, deny-by-default gaps, blast radius, and the smallest defensive fix first.

Do NOT load all references at once. Load only the files required by the decision tree above.

