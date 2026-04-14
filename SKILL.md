---
name: security-hardening
description: >
  Audit/harden code, infra, privacy. Triggers: OWASP, XSS, SQLi, SSRF,
  CSRF, auth/JWT, IDOR, secrets, deps, API, CI/CD, supply chain,
  cloud IAM, K8s/Docker, IaC, LLM/MCP, GDPR, phishing, ransomware.
---

# Security Hardening Skill

Find vulns, leaks, weak defaults. Prefer defensive fixes.

## Workflow

1. **Context** - stack, auth, cloud, AI, data.
2. **Threat** - assets, boundaries, blast radius.
3. **Audit** - secrets, injection, authz, deps, logs, privacy.
4. **Harden** - least privilege, MFA, safe defaults, retention.
5. **Agentic** - approvals, MCP trust, output validation.
6. **Validate** - security tests, fix proof, no regressions.
7. **Detect/Report** - logs, alerts, severity, fix, CWE, GDPR.

## References

- `owasp-top10.md`, `api-security.md`, `security-testing-examples.md`
- `supply-chain-security.md`, `cloud-iam-hardening.md`
- `container-k8s-hardening.md`, `incident-playbooks.md`
- `llm-agent-security.md`, `mcp-security.md`, `ai-cli-hardening.md`
