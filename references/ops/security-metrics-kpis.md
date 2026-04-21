---
title: "Security Metrics & KPIs"
slug: security-metrics-kpis
category: ops
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "NIST Cybersecurity Framework 2.0 — https://www.nist.gov/cyberframework (2024-02)"
  - "NIST SP 800-55 Rev.2 — https://csrc.nist.gov/pubs/sp/800/55/r2/final"
  - "OpenSSF Scorecard — https://scorecard.dev"
  - "DORA metrics — https://dora.dev"
  - "FIRST EPSS — https://www.first.org/epss/ (coverage/efficiency of exploited vulnerabilities)"
triggers_strong: ["security metrics", "security kpis", "security dashboard", "sla metrics", "security program measurement"]
triggers_weak: ["metrics", "kpi", "security reporting"]
related: ["vuln-management", "security-improvements", "detection-engineering"]
---

# Security Metrics & KPIs

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (collection from scanners, CI, IAM, and logging platforms automatable; interpretation, target setting, and tradeoff decisions manual)

Use this guide when building a **security dashboard**, defining **KPIs**, measuring **security productivity**, or deciding whether security work is actually reducing risk instead of just generating tickets.

Good metrics help teams decide faster. Bad metrics create theater, perverse incentives, and spreadsheet work that crowds out actual hardening.

---

## 1. Principles

A useful metric should be:

- tied to a decision,
- hard to game,
- normalized over time or scope,
- comparable across teams or systems,
- paired with an owner and a review cadence,
- actionable when it crosses a threshold.

Do not measure everything. Measure what changes behavior.

---

## 2. Use Leading and Lagging Indicators Together

| Type | What it tells you | Example |
|------|-------------------|---------|
| Leading | Whether controls are improving before failure happens | % repos with secret scanning enabled |
| Lagging | Whether failure already happened | Number of verified secret leaks this quarter |
| Operational | Whether the team handles work on time | High severity SLA breach rate |
| Outcome | Whether risk is actually reduced | Mean time to contain token abuse |

If you only track lagging indicators, you learn too late.
If you only track leading indicators, you can mistake checkbox completion for real security.

---

## 3. Dashboard by Audience

### Executive / leadership dashboard

Track 5-8 metrics maximum:

- Critical and high finding SLA breach rate
- Mean time to contain active incidents
- % production repos with mandatory security gates
- % crown-jewel systems with phishing-resistant MFA
- % prod cloud roles using OIDC or short-lived credentials
- Verified secret leak count and trend
- Coverage of logging/detection on critical systems

### Engineering leadership dashboard

Track:

- % repos with security CI baseline enabled
- Dependency update latency
- Fix lead time by severity
- % PRs using security checklist
- % critical workflows pinned and least-privileged
- IaC policy failure rate by team

### Security operations dashboard

Track:

- MTTD and MTTC for priority incident classes
- Detection precision / false positive rate
- Investigation volume by source
- Repeat finding rate by category
- Mean time from detection to owner assignment

---

## 4. Core Metrics That Actually Matter

### 4.1 Vulnerability handling

| Metric | Formula | Why it matters |
|--------|---------|----------------|
| Critical SLA breach rate | `critical overdue / total critical open` | Tells you if urgent risk is being ignored |
| High severity median remediation time | median(days from open to verified close) | Measures delivery speed for material risk |
| Reopen rate | `reopened findings / closed findings` | Low-quality fixes or weak verification |
| Repeat pattern rate | `findings in same class / total findings` | Training or guardrail gap |

Recommended review source: `vuln-management.md`.

### 4.2 Secret hygiene

| Metric | Formula | Why it matters |
|--------|---------|----------------|
| Secret leak frequency | leaks per month / quarter | Direct exposure signal |
| Push protection coverage | `% repos with secret blocking on push` | Leading control metric |
| Mean revoke time | time from leak detection to credential revocation | Blast-radius reduction |
| Secret inventory freshness | `% prod secrets with owner + expiry + rotation date` | Governance and recovery quality |

### 4.3 CI / supply chain

| Metric | Formula | Why it matters |
|--------|---------|----------------|
| Action pinning coverage | `% workflow action refs pinned to SHA` | Supply-chain hardening |
| OIDC adoption | `% deploy workflows using OIDC instead of static secrets` | Credential risk reduction |
| SBOM generation coverage | `% release pipelines emitting SBOM` | Inventory and incident response speed |
| Dependency patch latency | median days from advisory to patched deploy | Real-world response speed |

### 4.4 Identity and access

| Metric | Formula | Why it matters |
|--------|---------|----------------|
| Passkey / FIDO2 coverage | `% privileged accounts with phishing-resistant MFA` | Resilience to common compromise paths |
| Stale admin access rate | `% admin accounts unused beyond policy threshold` | Privilege creep |
| Token sprawl | number of long-lived PATs / service tokens | Hidden attack surface |
| Break-glass review compliance | `% break-glass accounts reviewed on schedule` | Emergency path hygiene |

### 4.5 Detection and incident response

| Metric | Formula | Why it matters |
|--------|---------|----------------|
| MTTD | mean time from malicious action to detection | Detection effectiveness |
| MTTC | mean time from detection to containment | Response effectiveness |
| True positive rate | `confirmed alerts / triaged alerts` | Signal quality |
| Coverage of priority detections | `% priority abuse cases with tuned detections` | Blind-spot visibility |

---

## 5. AI / Agent-Specific Metrics

Because this repository covers AI-assisted workflows, track the control plane around agents too.

| Metric | Formula | Why it matters |
|--------|---------|----------------|
| Restrictive profile coverage | `% AI tools/workspaces using approved defensive profile` | Leading control for agent blast radius |
| Human approval rate for high-risk actions | approvals on write/deploy/delete actions | Verifies control is actually used |
| Prompt/data exposure events | count of verified raw sensitive data uploads to AI tools | Confidentiality signal |
| Agent-originated finding rate | findings introduced by AI-generated changes / total findings | Quality and review pressure |
| Tool permission drift | count of agents/workflows widened beyond baseline | Governance signal |

Related references: `ai-tool-profiles.md`, `ai-cli-hardening.md`, `quick-start-ai-coding.md`.

---

## 6. Suggested KPI Set for a Small Security Program

If you can only track ten things, track these:

1. Critical SLA breach rate
2. High severity median remediation time
3. Secret leak frequency
4. Mean revoke time for leaked credentials
5. % repos with Gitleaks + SAST + dependency review in CI
6. % workflow actions pinned to SHA
7. % production identities with passkeys / FIDO2
8. % prod deploy workflows using OIDC
9. MTTD for priority incidents
10. MTTC for token/session compromise incidents

That set balances prevention, delivery, identity, supply chain, and response.

---

## 7. Recommended Targets

Targets depend on context, but these are useful defaults:

| Metric | Baseline target |
|--------|-----------------|
| Critical SLA breach rate | 0% |
| High severity median remediation time | <= 7 days |
| Secret revoke time | <= 1 hour |
| Action pinning coverage | >= 95% |
| Security baseline CI coverage on active repos | >= 90% |
| Passkey coverage for admins | 100% |
| OIDC adoption on prod deploy workflows | >= 90% |
| Repeat finding rate for same class | down quarter over quarter |

Targets should be stricter for crown-jewel systems.

---

## 8. Review Cadence

| Cadence | What to review |
|---------|-----------------|
| Weekly | Critical findings, incidents, secret leaks, SLA breaches |
| Monthly | Program KPIs, CI coverage, access hygiene, patch latency |
| Quarterly | Trend analysis, control gaps, resourcing, benchmark resets |
| Post-incident | Which metric failed to predict or shorten the incident |

A metric with no review meeting is just decoration.

---

## 9. Anti-Patterns

Avoid these common mistakes:

- counting raw scanner findings without triage context,
- measuring only activity (`tickets created`) instead of outcomes,
- aggregating unlike systems without normalization,
- rewarding teams for closing findings regardless of quality,
- using vanity metrics like total policies written or training hours completed,
- ignoring confidence intervals on low-volume incident metrics,
- changing formulas every month so trends become meaningless.

Bad metric examples:

- "number of scans run"
- "number of security comments"
- "number of blocked builds" without severity context
- "total open vulns" across systems with wildly different blast radius

---

## 10. Metric Design Template

Use this template before adding a new KPI:

```yaml
name: Critical SLA breach rate
owner: Security operations
purpose: Detect when urgent remediation is slipping
formula: critical overdue / total critical open
source_systems:
  - vulnerability tracker
  - issue tracker
cadence: weekly
threshold:
  green: 0%
  yellow: 0-5%
  red: >5%
action_if_red: escalate to engineering leadership and freeze risk acceptance extensions
notes: exclude false positives and accepted risks still within review window
```

If you cannot define owner, formula, cadence, and action, the metric is not ready.

---

## 11. Fast Review Checklist

| Check | Expected |
|-------|----------|
| Every KPI maps to a decision or escalation path | Yes |
| Metrics mix leading and lagging indicators | Yes |
| Critical systems are weighted separately from low-risk systems | Yes |
| Owners and cadences are defined | Yes |
| Raw finding counts are not used without context | Yes |
| AI/agent controls are measured where agents are in use | Yes |
| Dashboard size stays small enough to review meaningfully | Yes |

---

## 12. Related References

- `vuln-management.md`
- `security-improvements.md`
- `detection-engineering.md`
- `ai-tool-profiles.md`
