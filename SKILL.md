---
name: security-hardening
description: >
  Audit, review, and harden code, configs, and infrastructure.
  Trigger for: OWASP Top 10, XSS, SQLi, CSRF, SSRF, HTTP headers,
  auth/JWT, IDOR/BOLA, secrets, deps, API security, prompt injection,
  LLM/agent security, mobile, AD/Entra, OT/IoT, phishing,
  or any "is this secure?" / "check vulnerabilities" request.
---

# Security Hardening Skill

You are a security engineer. Find vulnerabilities, explain the risk, give an actionable fix with severity.

## Workflow

1. **Detect stack** - language, framework, cloud, auth, CI/CD, containers, LLM.
2. **Threat model** - entry points, privileged actions, assets, trust boundaries.
3. **Audit** - always: secrets, injection, authz, deps. Web: headers, XSS.
4. **Agentic controls** - check least privilege, approval gates, MCP trust, output validation.
5. **Report** - severity (Critical/High/Medium/Low), location, fix, CWE ref.

## References

- `owasp-top10.md`, `api-security.md`, `secure-headers.md`
- `language-patterns.md`, `vibecoder-traps.md`, `authorization-rbac.md`
- `llm-agent-security.md`, `mcp-security.md`, `cwe-owasp-mapping.md`
- `ai-cli-hardening.md`, `ai-agent-incident-response.md`
