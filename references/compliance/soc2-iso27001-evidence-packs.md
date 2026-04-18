---
title: "SOC 2 & ISO 27001 Evidence Packs"
slug: soc2-iso27001-evidence-packs
category: compliance
depth: 3
audit_level: [3, 4]
last_reviewed: 2026-04-18
sources:
  - "SOC 2 Trust Services Criteria"
  - "AICPA SOC 2 examination expectations"
  - "ISO/IEC 27001:2022"
  - "ISO/IEC 27002:2022"
triggers_strong: ["soc 2 evidence pack", "iso 27001 evidence", "audit evidence pack", "control evidence pack", "soc2 iso evidence"]
triggers_weak: ["audit evidence", "evidence pack", "control evidence"]
related: ["compliance-mapping", "nis2-dora-operational-evidence", "security-metrics-kpis", "identity-lifecycle-jml", "secure-workstation-builds"]
---

# SOC 2 & ISO 27001 Evidence Packs

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Recommended | Audit Level: 3-4 | Automation: Partial (exports, control snapshots, ticket links, and ownership metadata automatable; scoping, auditor interpretation, and adequacy judgment manual)

Use this guide when a team already knows **which controls exist** and now needs to assemble an evidence pack that an auditor can actually review for **SOC 2** or **ISO 27001**.

This file is intentionally operational. It does **not** replace the actual audit methodology, Statement of Applicability, or auditor sampling. It helps teams organize evidence so the audit does not collapse into a last-minute screenshot hunt.

---

## 1. What an evidence pack is

An evidence pack is the **organized proof** that a control exists, has an owner, operates on a known cadence, and can be traced to real systems and real review activity.

A strong evidence pack usually contains:

- the control objective,
- the control owner,
- the systems or processes in scope,
- the review cadence,
- the evidence items for the audit period,
- any exceptions and compensating controls,
- a clear gap note where evidence is incomplete.

Weak evidence packs usually look like:

- policy PDFs with no operating proof,
- screenshots with no date, no tenant, and no owner,
- exports that nobody can explain,
- controls described as "covered by engineering" without links,
- a single annual artifact for a control that should operate continuously.

---

## 2. Core rule

Do not collect evidence by document type alone.

Collect evidence by this chain:

1. **control objective**,
2. **owner**,
3. **system / process in scope**,
4. **cadence**,
5. **evidence from the audit period**,
6. **exceptions and remediation**.

If the evidence does not show that the control operated during the period, it is usually only design evidence.

---

## 3. Minimal evidence register format

Track packs in a table like this:

| Control family | Framework | Control objective | Owner | System / process | Evidence item | Frequency | Audit-period sample | Notes / gaps |
|---|---|---|---|---|---|---|---|---|
| Access reviews | SOC 2 / ISO 27001 | privileged access is reviewed and stale access removed | IAM owner | IdP + cloud admin roles | quarterly review export + approvals | Quarterly | Q1, Q2, Q3, Q4 review tickets | one break-glass account overdue |
| Secure SDLC | SOC 2 / ISO 27001 | code changes are reviewed and scanned before merge | Engineering platform | source repos + CI | branch protection + CI gate screenshots + workflow config | Continuous | sample PRs from period | one legacy repo exempted |
| Logging and monitoring | SOC 2 / ISO 27001 | critical systems generate and retain actionable security logs | Security operations | SIEM + priority services | log onboarding checklist + alert evidence | Monthly review | alert tuning tickets | one service missing parsing |

If the evidence cannot be represented with owner, cadence, and period sample, it is not mature enough.

---

## 4. How SOC 2 and ISO 27001 differ in practice

| Area | SOC 2 tendency | ISO 27001 tendency |
|---|---|---|
| Main lens | control design and operating effectiveness over a defined period | ISMS, risk treatment, applicability, governance, and operation |
| Common question | did the control operate consistently during the report period? | is the control selected, justified, owned, and integrated into the management system? |
| Evidence style | period samples, tickets, exports, logs, approvals | policy + risk + SoA + operating evidence + review records |
| Frequent failure | control exists but no period sample or no owner | policy exists but SoA, risk treatment, or review governance is weak |

In reality, strong operational evidence helps both frameworks. The difference is mostly in the emphasis and how the auditor follows the trail.

---

## 5. Suggested pack structure

For each major control family, build one repeatable pack with these sections:

### 5.1 Control summary

Include:

- control name,
- control objective,
- framework mapping,
- owner and backup owner,
- systems in scope,
- review cadence,
- last review date.

### 5.2 Evidence inventory

Include:

- config or policy reference,
- dashboard / export source,
- runbook or procedure,
- approval or review tickets,
- sample logs or alerts,
- exception register,
- remediation history.

### 5.3 Period samples

For period-based audits, include sample evidence from the actual review period, not just the current state.

Examples:

- quarterly access review records,
- monthly vulnerability triage export,
- sample PRs showing code review and CI,
- incident postmortems and exercise records,
- weekly backup verification results.

### 5.4 Gaps and exceptions

Always include:

- known gap,
- risk statement,
- temporary compensating control,
- remediation owner,
- target date.

Auditors usually react better to an explicit tracked gap than to improvised answers during fieldwork.

---

## 6. High-value evidence packs to maintain

### 6.1 Identity and access

Expected contents:

- user lifecycle process,
- privileged role inventory,
- MFA coverage export,
- access review cadence,
- break-glass governance,
- SSO / federation configuration baseline,
- stale-account cleanup evidence.

Good artifacts:

- IdP screenshots with tenant and date,
- CSV export of privileged users,
- quarterly review tickets with approver comments,
- offboarding sample tickets,
- enforcement policy screenshots.

Use related references:

- `identity-lifecycle-jml`,
- `sso-saml-oidc-hardening`,
- `workload-identity-federation`.

### 6.2 Secure development and change management

Expected contents:

- branch protection configuration,
- required reviewers,
- CI security gates,
- vulnerability or dependency review workflow,
- deployment approval path,
- emergency change process.

Good artifacts:

- repository rules screenshots,
- CI workflow files,
- sample merged PRs with review history,
- failed security gate evidence,
- exception ticket for emergency changes.

### 6.3 Logging, detection, and incident response

Expected contents:

- priority log source inventory,
- detection coverage,
- incident severity and escalation matrix,
- on-call ownership,
- exercise evidence,
- post-incident corrective action tracking.

Good artifacts:

- SIEM dashboards,
- alert samples,
- tabletop agenda and notes,
- incident tickets,
- remediation tracker.

### 6.4 Endpoint and workstation security

Expected contents:

- device management baseline,
- encryption coverage,
- endpoint protection posture,
- admin workstation rules,
- browser profile segmentation baseline,
- lost-device response procedure.

Good artifacts:

- MDM compliance export,
- encryption dashboard screenshots,
- endpoint policy screenshots,
- device exception register,
- admin workstation approval records.

Use `secure-workstation-builds` when preparing this pack.

### 6.5 Vulnerability and patch management

Expected contents:

- scanner coverage inventory,
- severity and SLA policy,
- triage cadence,
- remediation metrics,
- exception or risk acceptance process,
- verification of closure.

Good artifacts:

- scanner exports,
- remediation tickets,
- SLA dashboard,
- risk acceptance approvals,
- sample re-test evidence.

### 6.6 Supplier and processor oversight

Expected contents:

- supplier inventory,
- critical supplier classification,
- review criteria,
- contract or DPA references,
- onboarding and reassessment evidence,
- issue follow-up for weak suppliers.

Good artifacts:

- vendor review checklist,
- risk scoring sheet,
- reassessment ticket,
- copy of approval workflow,
- exception register for unavoidable gaps.

---

## 7. SOC 2 evidence expectations

For SOC 2, expect recurring focus on whether controls **operated during the period**.

### 7.1 Typical SOC 2 questions

Be ready to answer:

- who owns this control,
- how often it runs,
- how you know it ran during the audit period,
- how exceptions are tracked,
- how changes to the control are approved,
- what sample evidence proves operation.

### 7.2 Common SOC 2 sample artifacts

| Control area | Useful artifacts |
|---|---|
| User access | user provisioning ticket, deprovisioning ticket, quarterly review evidence |
| Change management | sample PR, approval history, CI results, deployment log |
| Incident response | incident ticket, timeline, containment record, lessons learned |
| Monitoring | alert sample, tuning note, reviewed dashboard screenshot |
| Backup / recovery | backup success logs, restore test record, issue follow-up |

### 7.3 Common SOC 2 failures

- only current screenshots, no period evidence,
- control described in policy but not tied to real systems,
- missing approvals on sampled changes,
- stale access review evidence,
- no exception handling trail.

---

## 8. ISO 27001 evidence expectations

For ISO 27001, expect more attention on the **management system** around the control.

### 8.1 Expected supporting governance

A strong ISO-oriented pack usually links the control to:

- risk register entries,
- treatment decision,
- Statement of Applicability mapping,
- policy or standard,
- operating procedure,
- periodic review,
- corrective action when things fail.

### 8.2 Typical ISO 27001 supporting artifacts

| Area | Useful artifacts |
|---|---|
| Risk treatment | risk register row, treatment owner, due date |
| Applicability | SoA row and applicability rationale |
| Governance | management review notes, internal audit finding status |
| Operations | runbook, tickets, logs, exports, control checks |
| Improvement | corrective action tracker, reopened issue analysis |

### 8.3 Common ISO 27001 failures

- no clear connection from risk to selected control,
- SoA says a control applies but no operating evidence exists,
- control is owned by a team but not a named person,
- policy review is stale,
- internal audit or management review trail is weak.

---

## 9. Control ownership and cadence model

Use a simple recurring model.

| Cadence | Typical evidence |
|---|---|
| Continuous | CI logs, workflow configs, automated enforcement status |
| Weekly | triage notes, alert reviews, open risk review |
| Monthly | KPI dashboard, privileged-account inventory, patch status |
| Quarterly | access review, supplier review, tabletop, policy review |
| Annual | risk treatment refresh, internal audit, management review |

For every recurring control, define:

- exact owner,
- backup owner,
- evidence source,
- storage location,
- review month or cycle,
- escalation path when missed.

---

## 10. Evidence quality rules

Stronger evidence is:

- versioned,
- timestamped,
- attributable to a named system and owner,
- scoped to the relevant environment,
- reproducible from a known source,
- linked to remediation when something failed.

Weaker evidence is:

- copied into slide decks,
- manually edited exports with no source link,
- screenshots with hidden tenant or date,
- statements like "engineering does this automatically" with no proof.

---

## 11. Pre-audit assembly checklist

Before fieldwork, verify:

| Check | Expected |
|---|---|
| Every major control has a named owner | Yes |
| Every evidence item has a source system | Yes |
| Evidence covers the audit period, not only today | Yes |
| Open gaps and exceptions are tracked explicitly | Yes |
| Stale policies and missing reviews are identified before auditor asks | Yes |
| Sampling candidates are easy to retrieve by date | Yes |
| Shared drives and folders are not the only system of record | Yes |

If retrieving one access-review sample takes 30 minutes of human memory, the evidence system is too fragile.

---

## 12. What not to do

Avoid these anti-patterns:

- assembling evidence only after the audit request arrives,
- mixing draft policy documents with operating proof and calling both "evidence",
- collecting screenshots without capturing environment and date,
- overproducing documents while underproducing owner accountability,
- hiding exceptions instead of tracking them,
- treating one-time evidence as proof of a continuous control.

---

## 13. Operating model recommendation

The highest-ROI model is usually:

1. maintain one lightweight evidence register,
2. store links to source systems instead of duplicating everything,
3. review evidence monthly for critical controls,
4. use quarterly control-owner reviews to close gaps,
5. pre-build sample sets for likely auditor requests,
6. feed repeated evidence failures into `security-metrics-kpis`.

That turns compliance work from a scramble into a repeatable operating rhythm.
