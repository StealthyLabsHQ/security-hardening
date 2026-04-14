---
name: security-hardening
description: >
  Audit/harden code, infra, privacy. Triggers: OWASP, XSS, SQLi, SSRF,
  CSRF, headers, auth/JWT, IDOR, secrets, deps, API, LLM/MCP, GDPR,
  phishing, ransomware, IDE/no-code.
---

# Security Hardening Skill

Find vulns, leaks, and unsafe defaults. Prefer defensive fixes.

## Workflow

1. **Context** - stack, auth, cloud, AI tools, sensitive data.
2. **Threat model** - assets, boundaries, blast radius.
3. **Audit** - secrets, injection, authz, deps, logs, privacy, recovery.
4. **Harden** - least privilege, MFA, secure defaults, retention, vendor risk.
5. **Agentic** - approval gates, MCP trust, output validation.
6. **Report** - severity, location, fix, CWE, GDPR impact.

## References

- `owasp-top10.md`, `api-security.md`, `secure-headers.md`
- `authorization-rbac.md`, `privacy-data-minimization.md`, `gdpr-security-ops.md`
- `defensive-security-baseline.md`, `llm-agent-security.md`, `mcp-security.md`
- `ai-cli-hardening.md`, `ai-ide-no-code-security.md`
