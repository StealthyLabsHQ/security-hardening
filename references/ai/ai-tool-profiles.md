---
title: "AI Tool Profiles"
slug: ai-tool-profiles
category: ai
depth: 1
audit_level: [1, 2, 3]
last_reviewed: 2026-04-21
sources:
  - "Anthropic Claude Code settings — https://docs.anthropic.com/en/docs/claude-code"
  - "OpenAI Codex CLI"
  - "Gemini CLI configuration"
  - "Cursor documentation"
  - "Repository template bundles"
  - "CVE-2024-46946 LangChain LLMSymbolicMathChain sympy eval RCE — https://nvd.nist.gov/vuln/detail/CVE-2024-46946 (2024-09, CVSS 9.8, CWE-20)"
triggers_strong: ["claude code profile", "codex profile", "gemini settings", "cursor rules", "bundle preset", "prod-sensitive preset"]
triggers_weak: ["tool profile", "ai tool", "bundle selection"]
related: ["ai-cli-hardening", "ai-ide-no-code-security"]
---

# AI Tool Profiles (Copy-Paste Defensive Pack)

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 1-3 | Automation: Partial (template sync, secret scans, and policy lint automatable; connector review, rollout choice, and approval governance manual)

This file owns the repository's **copy-paste defensive profiles**, posture overlays, and ready-made bundle guidance for specific AI tools and builder categories:

- `Claude Code`
- `Codex`
- `Gemini CLI`
- `Cursor`
- no-code / low-code / automation platforms

The templates live under `templates/ai-tool-profiles/`.

Posture overlays live under `templates/ai-tool-profiles/postures/`.

Ready-made merged bundles live under `templates/ai-tool-profiles/bundles/`.

---

## 1. What This Pack Gives You

| Tool | Template path | Goal |
|------|---------------|------|
| Claude Code | `templates/ai-tool-profiles/claude-code/` | Restrict reads/writes, deny sensitive paths, and make risky actions interactive |
| Codex | `templates/ai-tool-profiles/codex/` | Force security instructions through `AGENTS.md` and keep mode selection explicit |
| Gemini CLI | `templates/ai-tool-profiles/gemini-cli/` | Restrict core tools, disable auto-accept, and prefer sandboxed execution |
| Cursor | `templates/ai-tool-profiles/cursor/` | Block indexing of sensitive files and enforce project rules for the agent |
| No-code / low-code | `templates/ai-tool-profiles/no-code/` | Track connectors, scopes, owners, release gates, and restore paths |

## 1.1 Risk Postures

Add one posture overlay on top of the base tool profile:

| Posture | Path | Use when |
|---------|------|----------|
| `solo` | `templates/ai-tool-profiles/postures/solo/` | One developer or a tiny team, fast iteration, no autonomous prod actions |
| `startup` | `templates/ai-tool-profiles/postures/startup/` | Shared repos, CI, branch protections, service-account-based delivery |
| `prod-sensitive` | `templates/ai-tool-profiles/postures/prod-sensitive/` | High-blast-radius services, finance, internal admin tools, prod infrastructure |
| `gdpr-sensitive` | `templates/ai-tool-profiles/postures/gdpr-sensitive/` | Personal data, HR, legal, support exports, regulated deletion/export flows |

Each posture contains:

- `ROOT-INSTRUCTIONS.md` - merge into `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, or a Cursor rule,
- `.ai/agent-policy.yaml` - vendor-neutral policy baseline,
- `tool-approval-matrix.csv` - explicit approval ownership.

## 1.2 Ready-Made Bundles

Use a bundle when you do not want to manually merge `base profile + posture overlay + root instructions`.

| Bundle | Path | Best fit |
|--------|------|----------|
| `claude-code-prod-sensitive` | `templates/ai-tool-profiles/bundles/claude-code-prod-sensitive/` | Anthropic-based coding workflows touching prod-adjacent systems |
| `cursor-prod-sensitive` | `templates/ai-tool-profiles/bundles/cursor-prod-sensitive/` | AI IDE workflows where workspace indexing and auto-apply are major concerns |
| `gemini-cli-prod-sensitive` | `templates/ai-tool-profiles/bundles/gemini-cli-prod-sensitive/` | CLI agent workflows that should stay near read/review-only by default |
| `codex-gdpr-sensitive` | `templates/ai-tool-profiles/bundles/codex-gdpr-sensitive/` | Codex usage on repos handling personal data, exports, HR, support, or legal data |
| `no-code-gdpr-sensitive` | `templates/ai-tool-profiles/bundles/no-code-gdpr-sensitive/` | Retool/Bubble/Make/Zapier/n8n/Power Platform style environments with personal data |

---

## 2. Choose a Base Profile or a Bundle

Start with a base profile when:

- you need to understand each layer before rollout,
- your repo already has custom instructions or policy files,
- you want to combine a tool profile with a different posture overlay.

Start with a ready-made bundle when:

- you want the fastest conservative baseline,
- the workflow already matches one of the repository's high-risk patterns,
- you do not want to hand-merge instructions, policy, and approval ownership.

Quick rule:

- Pick `*-prod-sensitive` when the main risk is operational blast radius or production adjacency.
- Pick `*-gdpr-sensitive` when the main risk is confidentiality, personal data, retention/deletion, or processor/vendor exposure.

If both are true, start from the more restrictive bundle and then narrow further if the project needs additional controls.

---

## 3. Claude Code

**Use when:** you want a project-level defensive profile with explicit `allow` / `ask` / `deny` rules and hidden secret paths.

**Copy:**

```bash
mkdir -p .claude
cp templates/ai-tool-profiles/claude-code/.claude/settings.json .claude/settings.json
cp templates/ai-tool-profiles/claude-code/CLAUDE.md CLAUDE.md
```

What it does:

- denies reads of `.env`, secret folders, private keys, and dumps,
- asks before edits, writes, installs, pushes, and web access,
- disables non-essential traffic / telemetry-related settings via environment variables,
- adds a project instruction file that reinforces least privilege and human review.

**Official source used for field names and permission syntax:** Anthropic Claude Code settings docs.

---

## 4. Codex

**Use when:** you want a stable defensive baseline for Codex without hard-wiring a permissive persistent profile.

**Copy:**

```bash
cp templates/ai-tool-profiles/codex/AGENTS.md AGENTS.md
```

Recommended start modes:

```bash
codex --suggest
codex --auto-edit
```

Use `--full-auto` only in a sandboxed, version-controlled repo when you are comfortable with autonomous command execution inside that boundary.

What it does:

- encodes a defensive system instruction file in `AGENTS.md`,
- biases the tool toward read/review first,
- keeps approval mode explicit at launch instead of hiding it in a permissive default.

**Official source used:** OpenAI Codex CLI getting started / approval modes, plus the `AGENTS.md` convention used in the public Codex repository.

---

## 5. Gemini CLI

**Use when:** you want a concrete `settings.json` profile with restricted tools and no auto-accept.

**Copy:**

```bash
mkdir -p .gemini
cp templates/ai-tool-profiles/gemini-cli/.gemini/settings.json .gemini/settings.json
cp templates/ai-tool-profiles/gemini-cli/GEMINI.md GEMINI.md
```

What it does:

- restricts available tools to a narrow core set,
- disables `autoAccept`,
- prefers Docker sandboxing,
- disables usage statistics,
- blocks sensitive variables from being loaded from project `.env` files,
- keeps project memory files focused on security guardrails.

**Official source used:** Gemini CLI configuration docs (`settings.json`, `coreTools`, `autoAccept`, `sandbox`, `allowMCPServers`, `excludedProjectEnvVars`).

---

## 6. Cursor

**Use when:** you want to reduce exposure from workspace indexing and enforce project rules for the agent.

**Copy:**

```bash
mkdir -p .cursor/rules
cp templates/ai-tool-profiles/cursor/.cursorignore .cursorignore
cp templates/ai-tool-profiles/cursor/.cursor/rules/security-hardening.mdc .cursor/rules/security-hardening.mdc
cp templates/ai-tool-profiles/cursor/AGENTS.md AGENTS.md
```

What it does:

- blocks indexing and model-access to common secret and dump paths via `.cursorignore`,
- adds an always-applied project rule in `.cursor/rules/`,
- adds an `AGENTS.md` fallback for tools or workflows that read it directly.

**Important limitation:** per Cursor docs, `.cursorignore` helps with indexing and model file access, but it does **not** fully constrain terminal or MCP tool calls. Treat it as one layer, not the whole defense.

**Official sources used:** Cursor docs for `.cursorignore`, `.cursorindexingignore`, project rules, and `AGENTS.md`.

---

## 7. No-Code / Low-Code / Automation

**Use when:** your risk comes from connectors, previews, OAuth scopes, webhooks, or hidden publish controls rather than from handwritten code.

**Copy:**

```bash
mkdir -p security/no-code
cp templates/ai-tool-profiles/no-code/connector-register.csv security/no-code/connector-register.csv
cp templates/ai-tool-profiles/no-code/release-gate-checklist.md security/no-code/release-gate-checklist.md
```

What it does:

- gives you a connector inventory with owner, scope, account type, and rotation date,
- forces a release gate before publish,
- creates an audit trail for service-account ownership, preview protection, and restore/export checks.

This pack is vendor-neutral on purpose so it can be used with Retool, Bubble, Make, Zapier, n8n, Power Platform, and similar products.

---

## 8. Bundle Copy Paths

### Claude Code + Prod-Sensitive

```bash
mkdir -p .claude .ai
cp templates/ai-tool-profiles/bundles/claude-code-prod-sensitive/.claude/settings.json .claude/settings.json
cp templates/ai-tool-profiles/bundles/claude-code-prod-sensitive/CLAUDE.md CLAUDE.md
cp templates/ai-tool-profiles/bundles/claude-code-prod-sensitive/.ai/agent-policy.yaml .ai/agent-policy.yaml
cp templates/ai-tool-profiles/bundles/claude-code-prod-sensitive/.ai/tool-approval-matrix.csv .ai/tool-approval-matrix.csv
```

### Cursor + Prod-Sensitive

```bash
mkdir -p .cursor/rules .ai
cp templates/ai-tool-profiles/bundles/cursor-prod-sensitive/.cursorignore .cursorignore
cp templates/ai-tool-profiles/bundles/cursor-prod-sensitive/.cursorindexingignore .cursorindexingignore
cp templates/ai-tool-profiles/bundles/cursor-prod-sensitive/.cursor/rules/security-hardening.mdc .cursor/rules/security-hardening.mdc
cp templates/ai-tool-profiles/bundles/cursor-prod-sensitive/AGENTS.md AGENTS.md
cp templates/ai-tool-profiles/bundles/cursor-prod-sensitive/.ai/agent-policy.yaml .ai/agent-policy.yaml
cp templates/ai-tool-profiles/bundles/cursor-prod-sensitive/.ai/tool-approval-matrix.csv .ai/tool-approval-matrix.csv
```

### Gemini CLI + Prod-Sensitive

```bash
mkdir -p .gemini .ai
cp templates/ai-tool-profiles/bundles/gemini-cli-prod-sensitive/.gemini/settings.json .gemini/settings.json
cp templates/ai-tool-profiles/bundles/gemini-cli-prod-sensitive/GEMINI.md GEMINI.md
cp templates/ai-tool-profiles/bundles/gemini-cli-prod-sensitive/.ai/agent-policy.yaml .ai/agent-policy.yaml
cp templates/ai-tool-profiles/bundles/gemini-cli-prod-sensitive/.ai/tool-approval-matrix.csv .ai/tool-approval-matrix.csv
```

### Codex + GDPR-Sensitive

```bash
mkdir -p .ai
cp templates/ai-tool-profiles/bundles/codex-gdpr-sensitive/AGENTS.md AGENTS.md
cp templates/ai-tool-profiles/bundles/codex-gdpr-sensitive/.ai/agent-policy.yaml .ai/agent-policy.yaml
cp templates/ai-tool-profiles/bundles/codex-gdpr-sensitive/.ai/tool-approval-matrix.csv .ai/tool-approval-matrix.csv
```

Recommended start:

```bash
codex --suggest
```

### No-Code + GDPR-Sensitive

```bash
mkdir -p security/no-code .ai
cp templates/ai-tool-profiles/bundles/no-code-gdpr-sensitive/connector-register.csv security/no-code/connector-register.csv
cp templates/ai-tool-profiles/bundles/no-code-gdpr-sensitive/release-gate-checklist.md security/no-code/release-gate-checklist.md
cp templates/ai-tool-profiles/bundles/no-code-gdpr-sensitive/privacy-impact-checklist.md security/no-code/privacy-impact-checklist.md
cp templates/ai-tool-profiles/bundles/no-code-gdpr-sensitive/.ai/agent-policy.yaml .ai/agent-policy.yaml
cp templates/ai-tool-profiles/bundles/no-code-gdpr-sensitive/.ai/tool-approval-matrix.csv .ai/tool-approval-matrix.csv
```

---

## 9. Recommended Rollout Order

1. Copy the profile for the AI tool you use every day.
2. Add a posture overlay from `templates/ai-tool-profiles/postures/`.
3. Merge the overlay instructions into the shared security instruction file (`CLAUDE.md`, `AGENTS.md`, or `GEMINI.md`).
4. Commit `.ai/agent-policy.yaml` and `tool-approval-matrix.csv` in the repo.
5. Add secret and dump paths to `.gitignore` and any tool-specific ignore file.
6. Keep dev / staging / prod separated before connecting any real data.
7. Review every auth, billing, webhook, delete, infra, and GDPR flow manually.

---

## 10. Operating Rule

These profiles and bundles are intentionally strict. If the tool blocks work too often, widen access only after:

1. identifying the exact action class that is blocked,
2. deciding the owner for approval,
3. documenting the policy change rather than making an ad hoc exception.

---

## 11. Official References

- Anthropic Claude Code settings: https://docs.anthropic.com/en/docs/claude-code/settings
- OpenAI Codex CLI: https://developers.openai.com/codex/cli
- OpenAI Codex repository `AGENTS.md`: https://raw.githubusercontent.com/openai/codex/main/AGENTS.md
- Gemini CLI configuration: https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/cli/configuration.md
- Cursor ignore files: https://docs.cursor.com/en/context/ignore-files
- Cursor rules and `AGENTS.md`: https://docs.cursor.com/context/rules

