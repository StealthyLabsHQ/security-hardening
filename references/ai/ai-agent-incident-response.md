---
title: "AI Agent Incident Response Playbook"
slug: ai-agent-incident-response
category: ai
depth: 2
audit_level: [3, 4]
last_reviewed: 2026-04-21
sources:
  - "NIST SP 800-61 Rev. 2 — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf (2012, legacy canonical)"
  - "OWASP Top 10 for LLM Applications v2025 — https://genai.owasp.org/llm-top-10 (2024-11)"
  - "ENISA AI Threat Landscape — https://www.enisa.europa.eu/topics/cyber-threats/threat-landscape"
  - "AI Incident Database #1152 Replit Agent destructive commands during code freeze — https://incidentdatabase.ai/cite/1152/ (2025-07)"
  - "MITRE ATLAS — https://atlas.mitre.org"
triggers_strong: ["ai agent incident", "prompt injection incident", "mcp compromise", "agent exfiltration"]
triggers_weak: ["incident response", "agent security"]
related: ["llm-agent-security", "mcp-security"]
---

# AI Agent Incident Response Playbook

> Last reviewed: 2026-04-06 | Next review: 2026-10-06 | Priority: Recommended | Audit Level: 3-4 | Automation: Partial (detection and containment scripts automatable; investigation/communication manual)

Use this playbook when an AI agent (CLI, coding assistant, MCP-enabled bot) may have performed unauthorized or unsafe actions.

---

## 1. Incident Types (Examples)

- Secret exfiltration by prompt injection
- Unauthorized command execution (`rm`, `curl`, `kubectl`, `terraform`)
- Unauthorized code changes or force-push
- Malicious MCP server/tool usage
- Cross-tenant or cross-session context leakage
- Data disclosure in logs, chat transcripts, or tool outputs

---

## 2. Severity Classification

- **Critical:** confirmed data exfiltration, production impact, credential compromise, destructive infra action.
- **High:** attempted exfiltration blocked late, unauthorized write in sensitive repos.
- **Medium:** suspicious tool invocation with limited blast radius.
- **Low:** policy violation without security impact.

Escalate immediately if production credentials, customer data, or privileged admin actions are involved.

---

## 3. First 15 Minutes - Containment

1. **Freeze agent activity:** disable autonomous mode and revoke elevated permissions.
2. **Revoke credentials:** rotate API keys, MCP tokens, cloud creds, CI tokens.
3. **Block egress:** temporarily restrict outbound traffic for affected runner/host.
4. **Disable suspicious MCP servers/tools** from allowlist.
5. **Protect Git state:** block force-push, freeze release branch if integrity is uncertain.

Do not delete evidence while containing.

---

## 4. Evidence Collection (Forensics)

Collect and preserve:

- agent session IDs and timestamps,
- prompt/completion hashes,
- tool invocations (name, params, caller identity),
- approval decisions (who approved, when),
- git refs/commits before and after incident,
- CI logs/artifacts and network telemetry.

Store evidence in immutable storage with access controls.

---

## 5. Investigation Workflow

1. **Timeline reconstruction:** what happened, in what order, with exact UTC times.
2. **Entry point identification:** direct prompt, indirect prompt injection, rogue MCP tool, compromised token.
3. **Blast radius analysis:** repos, environments, datasets, credentials touched.
4. **Integrity validation:** compare commits/artifacts against trusted baseline/signatures.
5. **Abuse confirmation:** determine whether attacker-controlled actions actually executed.

---

## 6. Eradication and Recovery

- Remove malicious prompts/content from indexed sources (RAG, docs, tickets).
- Uninstall or quarantine untrusted MCP servers.
- Patch policy gaps (approval rules, allowlists, command restrictions).
- Rebuild affected artifacts from trusted source and re-sign.
- Restore services with rotated credentials and tighter runtime controls.

Before returning to normal operations:

- confirm CI guardrails pass,
- confirm no unauthorized persistence remains,
- re-enable permissions gradually (Tier 0 -> Tier 1 -> Tier 2 if needed).

---

## 7. Communication Template (Internal)

- **What happened:** concise incident statement.
- **When detected:** exact UTC timestamp.
- **Current status:** contained / investigating / recovering.
- **Potential impact:** data, systems, customers, compliance.
- **Immediate actions:** rotations, blocks, branch freezes.
- **Next update ETA:** e.g., every 60 minutes until containment confirmed.

For external communication, coordinate with legal/compliance requirements.

---

## 8. Post-Incident Hardening Actions

Mandatory follow-up items:

1. Add detection rule for root cause pattern.
2. Update policy-as-code and MCP allowlist.
3. Add regression test (red-team prompt / malicious tool payload).
4. Improve approval UX and security warnings.
5. Run tabletop exercise using the incident scenario.

Track each item with owner and due date.

---

## 8.1 Ownership Model (RACI-lite)

- **Incident Commander (IC):** coordinates decisions, timeline, stakeholder updates.
- **Security Lead:** validates containment, forensics integrity, root cause.
- **Platform/DevOps Lead:** executes credential rotation, egress controls, runner isolation.
- **Application Owner:** validates service recovery and data correctness.
- **Comms/Legal (if required):** handles external notifications and compliance steps.

If ownership is unclear, assign temporary owners immediately during containment.

---

## 9. Quick Commands (Examples)

```bash
# Freeze local git write operations (example workflow control)
git config --local receive.denyNonFastforwards true

# Rotate and verify secrets scanning after incident
gitleaks detect --source . --verbose

# Validate dependency exposure quickly
npm audit --audit-level=high || true
pip-audit || true
```

Adjust commands to your environment and incident scope.

---

## 10. Readiness Checklist

- [ ] Agent action logging includes session/user/tool/model.
- [ ] Incident owner and on-call path are defined.
- [ ] Credential rotation runbooks are documented and tested.
- [ ] MCP emergency disable switch exists.
- [ ] Release freeze process can be triggered quickly.
- [ ] Tabletop exercise completed in last 6 months.

---

## 11. Recovery Exit Criteria

Recovery is complete only if all are true:

- [ ] Rotated credentials are confirmed active and old credentials invalidated.
- [ ] No suspicious agent/tool activity observed during monitoring window.
- [ ] Integrity checks on affected repos/artifacts are clean.
- [ ] Temporary emergency controls are replaced by durable policy updates.
- [ ] Postmortem approved with dated remediation owners.

---

## References

- `references/ai/llm-agent-security.md` (audit logging, prompt injection, tool permission tiers)
- `references/ai/mcp-security.md` (MCP spoofing/injection/path traversal/SSRF)
- `references/ops/secret-leak-prevention.md` (revoke-first credential incidents)
- `references/ops/incident-playbooks.md` (broader IR process patterns)


