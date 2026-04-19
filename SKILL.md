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
| Secure code review, web auth, headers, input validation, XSS, SSRF, insecure defaults | `references/_core-invariants.md`, `references/appsec/owasp-top10.md`, `references/appsec/api-security.md`, `references/appsec/browser-security-modern.md`, `references/appsec/secure-headers.md` | `references/platform/*` unless the target is a desktop or mobile app; `references/compliance/*` unless an audit mapping is explicitly requested |
| GraphQL authz, depth, persisted queries, batching | `references/_core-invariants.md`, `references/appsec/graphql-security.md`, `references/iam/authorization-rbac.md` | `references/platform/*`; `references/privacy/*` unless the schema exposes personal data |
| Threat modeling, abuse cases, test design | `references/_core-invariants.md`, `references/appsec/threat-modeling.md`, `references/appsec/security-testing-examples.md` | `references/ai/*` unless the system includes agents, MCP, or prompt-bearing workflows |
| Security architecture, secure design, control selection, roadmap | `references/_core-invariants.md`, `references/appsec/threat-modeling.md`, `references/ops/security-improvements.md`, `references/ops/detection-engineering.md` | `references/platform/*` unless platform-specific runtime constraints matter |
| Secrets, leaks, pre-push hygiene, dangerous patterns | `references/_core-invariants.md`, `references/ops/secret-leak-prevention.md`, `references/ops/pre-push-checklist.md`, `references/ai/vibecoder-traps.md` | `references/compliance/*`; `references/platform/*` unless the leak sits in a client app or workstation image |
| AuthN/AuthZ, RBAC, sessions, WebAuthn, IAM | `references/_core-invariants.md`, `references/iam/authorization-rbac.md`, `references/iam/session-management.md`, `references/iam/webauthn-fido2.md`, `references/iam/cloud-iam-hardening.md` | `references/infra/*` unless cloud or cluster policy is part of the auth path |
| Password hashing, encryption, JWT signing, webhook signatures, token generation | `references/_core-invariants.md`, `references/appsec/applied-cryptography.md`, `references/iam/session-management.md` | `references/platform/*` unless native keychain or platform crypto APIs are part of the issue |
| Supply chain, CI/CD, GitHub Actions, containers, Kubernetes | `references/_core-invariants.md`, `references/infra/supply-chain-security.md`, `references/infra/container-k8s-hardening.md` | `references/privacy/*`; `references/platform/*` unless the runtime target is endpoint, desktop, or mobile |
| Desktop app, native client, C/C++ memory safety, Electron, DLL hijacking | `references/_core-invariants.md`, `references/platform/desktop-app-security.md`, `references/platform/memory-safety-hardening.md` | `references/ai/*` unless the desktop surface is an AI agent runtime; `references/compliance/*` unless audit mapping is explicitly requested |
| AI agents, MCP, prompt injection, hostile corpus, tool trust | `references/_core-invariants.md`, `references/ai/llm-agent-security.md`, `references/ai/mcp-security.md`, `references/ai/hostile-corpus-review.md`, `references/ai/ai-cli-hardening.md` | `references/appsec/framework-examples.md`; `references/platform/*` unless the user is specifically reviewing a desktop, mobile, or endpoint agent surface |
| Browser use, computer use, GUI automation, web agent, Operator, CUA, authenticated click-flow risk | `references/_core-invariants.md`, `references/ai/browser-computer-use-security.md`, `references/ai/llm-agent-security.md`, `references/ai/ai-cli-hardening.md` | `references/platform/desktop-app-security.md` unless the audit target is a traditional desktop app rather than an AI agent driving a sandboxed environment |
| AI IDE, browser builder, no-code, tool profiles, AI incident response | `references/_core-invariants.md`, `references/ai/ai-ide-no-code-security.md`, `references/ai/ai-tool-profiles.md`, `references/ai/ai-agent-incident-response.md`, `references/ai/quick-start-ai-coding.md` | `references/compliance/*` unless the ask is regulatory; `references/infra/*` unless connectors or deployment paths are in scope |
| RAG, retrieval, vector stores, embeddings, document poisoning, knowledge-base leakage | `references/_core-invariants.md`, `references/ai/rag-retrieval-security.md`, `references/ai/hostile-corpus-review.md`, `references/ai/llm-agent-security.md` | `references/compliance/*` unless evidence mapping is explicitly requested; `references/appsec/framework-examples.md` unless runnable application snippets are explicitly needed |
| Agent evals, red teaming, regression gates, release criteria | `references/_core-invariants.md`, `references/ai/agent-evals-red-teaming.md`, `references/ai/llm-agent-security.md`, `references/ai/mcp-security.md`, `references/ai/hostile-corpus-review.md` | `references/compliance/*` unless evidence mapping is explicitly requested; `references/appsec/framework-examples.md` unless the user also wants runnable code examples |
| Privacy, GDPR, retention, PII in logs and exports | `references/_core-invariants.md`, `references/privacy/privacy-data-minimization.md`, `references/privacy/gdpr-security-ops.md` | `references/platform/*`; `references/infra/*` unless logs, storage, or export pipelines are part of the issue |
| Detection, incident response, security roadmap | `references/_core-invariants.md`, `references/ops/detection-engineering.md`, `references/ops/incident-playbooks.md`, `references/ai/ai-agent-incident-response.md`, `references/ops/security-improvements.md` | `references/appsec/framework-examples.md`; `references/compliance/*` unless evidence mapping is explicitly requested |

## Core Invariants

Always load `references/_core-invariants.md` once before any domain-specific references.

## Example

Input utilisateur:
`Review this Express route for IDOR and auth bugs.`

Decision:
load `references/_core-invariants.md`, `references/appsec/api-security.md`, and `references/iam/authorization-rbac.md`; do not load `references/platform/mobile-security.md` or `references/compliance/compliance-mapping.md`.

Output attendu:
call out missing object-level authorization, deny-by-default gaps, blast radius, and the smallest defensive fix first.

Do NOT load all references at once. Load only the files required by the decision tree above.

