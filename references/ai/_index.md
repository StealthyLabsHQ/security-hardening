# AI Security Index

Use this index when the task is already clearly in the AI security domain, but the right AI reference is still unclear.

Load only the narrowest files needed for the task. Do not load the whole AI directory by default.

| If you need... | Load... | Skip unless clearly needed... |
|---|---|---|
| A first-pass checklist for AI-assisted coding | `quick-start-ai-coding.md` | deep agent or MCP references |
| Common insecure AI coding patterns to call out quickly | `vibecoder-traps.md` | incident response or tool-profile docs |
| General agent security, prompt injection, RAG poisoning, trust zones, planner/executor split | `llm-agent-security.md` | no-code or bundle-selection docs |
| Browser agents, GUI actions, Operator/CUA, desktop control, session and click-flow risk | `browser-computer-use-security.md`, `llm-agent-security.md` | generic appsec references unless the target app itself is the audit subject |
| MCP-specific attack surface, manifests, tool poisoning, SSRF, path traversal, scope creep | `mcp-security.md` | generic appsec references unless the vulnerable code is the main target |
| RAG, vector stores, embeddings, retrieval filtering, document poisoning | `rag-retrieval-security.md`, `hostile-corpus-review.md`, `llm-agent-security.md` | compliance references unless evidence mapping is the actual ask |
| Reviewing untrusted prompts, docs, tickets, tool output, or copied code safely | `hostile-corpus-review.md` | bundle-selection docs |
| Runtime controls for coding agents and CLIs | `ai-cli-hardening.md` | no-code guidance unless the tool is low-code or browser-based |
| Tool-specific profiles, posture overlays, or ready-made bundles | `ai-tool-profiles.md` | incident response unless the task is post-incident hardening |
| AI IDEs, browser builders, or no-code / low-code systems | `ai-ide-no-code-security.md` | deep MCP details unless the product exposes MCP directly |
| Agent eval plans, red teaming, regression gates, or release criteria | `agent-evals-red-teaming.md`, `llm-agent-security.md` | general compliance references |
| Containment, evidence handling, or recovery after an AI-agent incident | `ai-agent-incident-response.md` | bundle-selection docs |

## Suggested load order

1. `../_core-invariants.md`
2. This file if the AI subdomain is still ambiguous
3. One or two task-specific AI references
4. Cross-domain references only when the issue clearly spills into appsec, IAM, privacy, infra, or compliance
