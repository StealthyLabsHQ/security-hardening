---
title: "AI Bundle Presets"
slug: ai-bundle-presets
category: ai
depth: 1
audit_level: [1, 2, 3]
last_reviewed: 2026-04-14
sources:
  - "templates/ai-tool-profiles/"
  - "Repository bundle presets"
triggers_strong: ["bundle preset", "prod-sensitive preset", "tool posture"]
triggers_weak: ["ai profiles", "bundle selection"]
related: ["ai-tool-profiles", "ai-cli-hardening"]
---

# AI Bundle Presets

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: Essential | Audit Level: 1-3 | Automation: Partial (template sync and policy validation automatable; rollout choice and approval governance manual)

These are **ready-made merged bundles** for common high-security scenarios. Each bundle already combines:

- a base tool profile,
- a risk posture overlay,
- root instruction text,
- policy-as-code,
- approval ownership.

Use them when you do not want to manually merge `tool profile + posture overlay`.

The bundles live under `templates/ai-tool-profiles/bundles/`.

---

## 1. Available Bundles

| Bundle | Path | Best fit |
|--------|------|----------|
| `claude-code-prod-sensitive` | `templates/ai-tool-profiles/bundles/claude-code-prod-sensitive/` | Anthropic-based coding workflows touching prod-adjacent systems |
| `cursor-prod-sensitive` | `templates/ai-tool-profiles/bundles/cursor-prod-sensitive/` | AI IDE workflows where workspace indexing and auto-apply are major concerns |
| `gemini-cli-prod-sensitive` | `templates/ai-tool-profiles/bundles/gemini-cli-prod-sensitive/` | CLI agent workflows that should stay near read/review-only by default |
| `codex-gdpr-sensitive` | `templates/ai-tool-profiles/bundles/codex-gdpr-sensitive/` | Codex usage on repos handling personal data, exports, HR, support, or legal data |
| `no-code-gdpr-sensitive` | `templates/ai-tool-profiles/bundles/no-code-gdpr-sensitive/` | Retool/Bubble/Make/Zapier/n8n/Power Platform style environments with personal data |

---

## 2. Recommended Selection

Use this quick rule:

- Pick `*-prod-sensitive` when the biggest risk is operational or production blast radius.
- Pick `*-gdpr-sensitive` when the biggest risk is confidentiality, personal data, retention/deletion, or processor/vendor exposure.

If both are true, prefer the **more restrictive** bundle or start with `gdpr-sensitive` and then tighten further with prod controls.

---

## 3. Copy Paths

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

## 4. Operating Rule

These bundles are intentionally strict. If a tool keeps asking for approval too often, widen access only after:

1. identifying the exact action class that is blocked,
2. deciding the owner for approval,
3. documenting the change in policy rather than making an ad hoc exception.

---

## 5. Related Files

- `ai-tool-profiles.md`
- `ai-ide-no-code-security.md`
- `ai-cli-hardening.md`
- `gdpr-security-ops.md`
- `defensive-security-baseline.md`

