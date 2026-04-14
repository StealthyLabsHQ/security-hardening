---
name: mcp-security
description: MCP server trust, tool allowlists, approval gates, capability minimization.
tags: [security, mcp, tools, agents]
---

## MCP Security Model

MCP (Model Context Protocol) connects AI models to external tools and data sources.
Each MCP server is an independently trusted (or untrusted) process. Misconfigured MCP is a primary attack vector for LLM agent compromise.

## Server Trust

- **Treat each MCP server as a third-party service**, not an extension of the AI.
- Verify server identity: use signed packages, known registries, pinned versions.
- Never run MCP servers from untrusted sources (arbitrary npm/pip packages, URLs).
- Run MCP servers in isolated processes with minimal OS permissions.
- Prefer MCP servers with open-source, audited implementations.

## Tool Allowlisting

Define an explicit allowlist per agent/session:

```json
{
  "allowedTools": [
    "read_file",
    "list_directory",
    "search_codebase"
  ],
  "deniedTools": ["*"],
  "defaultPolicy": "deny"
}
```

- Apply allowlist before the LLM sees available tools — do not rely on the LLM to refuse.
- Separate allowlists per task type (read-only tasks vs. write tasks).
- Audit and review allowlist changes in version control.

## Approval Gates

Require explicit human approval before executing:
- Any tool that writes, deletes, or modifies persistent state.
- Network calls to external services (not pre-approved list).
- Shell/command execution of any kind.
- Operations involving PII or financial data.
- First use of any new tool in a session.

Approval gate implementation pattern:
```
1. LLM generates tool call
2. System intercepts → presents to human: tool name + args (formatted, not raw)
3. Human approves / denies / modifies
4. Execute only on explicit approval
5. Log decision + actor
```

## Capability Minimization

- **Filesystem**: scope to project directory; block access to `~`, `/etc`, env files.
- **Network**: allowlist by domain; block cloud metadata (169.254.169.254, fd00:ec2::254).
- **Processes**: no shell execution tools unless explicitly required.
- **Auth**: MCP servers should not receive production credentials; use scoped tokens.
- **Secrets**: MCP tool arguments must not contain raw secrets; pass via environment at server start.

## Tool Description Attacks (Prompt Injection via Schema)

MCP tool descriptions and parameter schemas are returned by the server and injected into the LLM's context. A malicious or compromised server can embed prompt injection in tool descriptions.

**Mitigations:**
- Validate tool schemas: names/descriptions must be plain strings, no instruction-like patterns.
- Reject tools whose description contains: `ignore`, `override`, `system prompt`, `you are now`, `DAN`.
- Pin tool schemas: compare against a trusted baseline; alert on changes.
- Show tool schema to user on first install; re-check on updates.

## Audit & Monitoring

- Log every tool invocation: server ID, tool name, arguments (sanitized), result, timestamp, user session.
- Detect anomalies: unexpected tool calls, high-frequency calls, out-of-scope arguments.
- Store logs outside MCP server reach — servers must not modify audit logs.
- Rotate MCP server credentials/tokens regularly; revoke on session end.

## Configuration Checklist

- [ ] Each MCP server has a defined capability scope documented.
- [ ] Allowlist reviewed and approved by team before deployment.
- [ ] Approval gate active for all write/execute tools.
- [ ] Tool schemas pinned and compared on each server startup.
- [ ] MCP servers run under least-privilege OS user.
- [ ] Audit logging active and immutable.
- [ ] Credential rotation procedure defined.
- [ ] Incident response plan covers MCP server compromise scenario.
