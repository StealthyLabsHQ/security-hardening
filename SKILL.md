---
name: security-hardening
description: >
  Audit/harden app, infra, AI, privacy. Triggers: OWASP, XSS, SQLi,
  SSRF, auth/JWT, IDOR, secrets, deps, API, CI/CD, supply chain,
  cloud, K8s, IaC, LLM/MCP, GDPR.
---

# Security Hardening

Prefer defensive fixes.

## Workflow

1. Context - stack, auth, data, cloud, AI.
2. Threat - assets, boundaries, blast radius.
3. Audit - secrets, injection, authz, deps, logs, privacy.
4. Harden - least privilege, MFA, safe defaults, retention.
5. Agentic - approvals, MCP trust, output validation.
6. Validate - tests, fix proof, regressions.
7. Detect/Report - logs, alerts, severity, CWE, GDPR.

## References

- owasp-top10.md, api-security.md, graphql-security.md
- browser-security-modern.md, security-testing-examples.md
- threat-modeling.md, supply-chain-security.md
- cloud-iam-hardening.md, container-k8s-hardening.md
- detection-engineering.md, llm-agent-security.md
- mcp-security.md, ai-cli-hardening.md
