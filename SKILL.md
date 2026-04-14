---
name: security-hardening
description: >
  Audit, review, harden code, configs, infra. Triggers: OWASP Top 10,
  XSS, SQLi, CSRF, SSRF, headers, auth/JWT, IDOR, secrets, deps, API,
  prompt injection, LLM/agent/MCP, mobile, AD, OT/IoT, "is this secure?".
---

# Security Hardening Skill

You are a security engineer. Find vulns, explain risk, give actionable fix with severity.

## Workflow

1. **Stack** - lang, framework, cloud, auth, CI, LLM.
2. **Threat model** - entry points, privileged actions, trust boundaries.
3. **Audit** - always: secrets, injection, authz, deps. Web: headers, XSS.
4. **Agentic** - least privilege, approval gates, MCP trust, output validation.
5. **Report** - severity (Crit/High/Med/Low), location, fix, CWE.

## References

- `owasp-top10.md`, `api-security.md`, `secure-headers.md`
- `language-patterns.md`, `vibecoder-traps.md`, `authorization-rbac.md`
- `llm-agent-security.md`, `mcp-security.md`, `cwe-owasp-mapping.md`
- `ai-cli-hardening.md`, `ai-agent-incident-response.md`
