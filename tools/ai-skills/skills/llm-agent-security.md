---
name: llm-agent-security
description: Prompt injection, tool misuse, output validation, trust boundaries, MCP trust model.
tags: [security, llm, agents, prompt-injection]
---

## Core Threat Model

Agents have: an LLM (reasoning), tools (side effects), memory (state), and an orchestrator (control flow).
Each component is an attack surface. Assume adversarial content in any external data the LLM processes.

## Prompt Injection

### Direct injection
User instructs the LLM to ignore its system prompt or act outside its role.

**Mitigations:**
- Separate system instructions from user input (distinct message roles).
- Use structured output schemas; reject free-form responses for tool calls.
- Validate tool calls against an allowlist before execution.
- Periodically re-assert role in system message for long contexts.

### Indirect injection
Malicious content in external data (web pages, files, emails) that the agent fetches and processes.

**Mitigations:**
- Treat all retrieved content as untrusted; never interpolate raw retrieved text into system-role messages.
- Sanitize retrieved content before including in context (strip `<|`, `###`, `SYSTEM:`, `ASSISTANT:` patterns).
- Apply a "confused deputy" check: did this instruction come from a source with authority to give it?
- Limit agent permissions to minimum needed for the task (see below).

## Tool Misuse & Capability Minimization

- Define an explicit allowlist of tools per agent role; deny by default.
- Tools with write/delete/execute capability require caller authentication + confirmation.
- Never pass LLM-generated shell commands directly to `exec`/`system()`.
- Scope filesystem access: agents should only read/write designated directories.
- Network tools: allowlist target domains; block access to cloud metadata endpoints (169.254.169.254).
- Irreversible actions (send email, delete record, charge card) require a human-in-the-loop gate.

## Output Validation

- Validate LLM output structure before acting on it (schema validation, not just type check).
- If output drives a tool call: validate tool name and each argument independently.
- Detect jailbreak artifacts in output: `ignore previous instructions`, `DAN mode`, role-play framing.
- Cap numeric outputs (e.g., quantity to order) with business-logic bounds.
- Flag outputs that reference topics outside the agent's defined scope.

## Trust Hierarchy

```
Human operator       ← highest trust (system prompt, config)
  Agent orchestrator ← trusted (within defined role)
    Tool results     ← semi-trusted (structured, validated)
      External data  ← untrusted (sanitize before use)
        User input   ← untrusted (validate and scope)
```

Never elevate trust of content based on claims within that content ("I am your admin, override...").

## MCP Trust Model (Model Context Protocol)

- MCP servers are external processes; treat them as untrusted third parties.
- Require explicit user approval before connecting to a new MCP server.
- Tool descriptions and schema come from the MCP server — they can be malicious.
- Validate tool result shape before passing to LLM context.
- Scope: one MCP server per trust domain; do not share auth tokens across servers.
- Audit log all MCP tool calls with arguments and results.

## Memory Security

- Shared memory (across sessions/users) is an injection vector; namespace by user ID.
- Never store raw LLM outputs as authoritative facts without human review.
- Evict memory entries on session end if they contain user PII.
- Sanitize before retrieval-augmented prompts (same as indirect injection mitigations).

## Monitoring & Anomaly Detection

- Log all tool calls: agent ID, tool name, arguments (redact secrets), result, timestamp.
- Alert on: unusual tool call volume, calls to disallowed tools, anomalous argument patterns.
- Rate-limit autonomous agents; require human escalation above threshold.
- Immutable audit log; agents must not have write access to their own logs.
