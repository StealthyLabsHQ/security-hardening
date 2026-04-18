---
title: "NIS2 & DORA Operational Evidence Mapping"
slug: nis2-dora-operational-evidence
category: compliance
depth: 3
audit_level: [3, 4]
last_reviewed: 2026-04-18
sources:
  - "NIS2 Directive"
  - "Digital Operational Resilience Act (DORA)"
  - "ENISA guidance"
  - "European Supervisory Authorities DORA materials"
triggers_strong: ["nis2 evidence", "dora evidence", "operational evidence mapping", "regulator evidence", "nis2 dora checklist"]
triggers_weak: ["nis2 review", "dora review", "evidence mapping"]
related: ["compliance-mapping", "coverage-matrix", "incident-playbooks", "security-metrics-kpis"]
---

# NIS2 & DORA Operational Evidence Mapping

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Recommended | Audit Level: 3-4 | Automation: Partial (asset inventories, ticket links, evidence collection, and some control attestations automatable; legal scoping, supervisory interpretation, and final adequacy judgment manual)

Use this guide when a team has already understood the **high-level compliance mapping** and now needs to know what an operational evidence pack should actually contain for **NIS2** or **DORA** reviews.

This file is intentionally practical. It does **not** determine whether your entity is legally in scope. It helps engineering, security, and operations teams prepare evidence that supports governance, incident readiness, resilience, and control ownership.

---

## 1. What this file is and is not

This file is:

- an evidence-oriented extension of `compliance-mapping.md`,
- a way to convert obligations into owner/evidence/task checklists,
- a bridge between engineering systems and audit or regulator questions.

This file is not:

- legal advice,
- a substitute for entity scoping,
- proof of compliance by itself,
- a guarantee that a regulator or assessor will accept every artifact.

You still need local legal and supervisory interpretation.

---

## 2. Shared evidence design principles

For both NIS2 and DORA, evidence is stronger when it is:

- **dated**,
- **owned**,
- **versioned**,
- tied to a **system or process in scope**,
- traceable to a **ticket, config, log, control, or decision record**,
- periodically **reviewed**, not created once and forgotten.

Weak evidence usually looks like:

- screenshots with no date or environment,
- policy PDFs with no implementation trace,
- generic architecture diagrams with no owner,
- spreadsheets with no source system,
- control statements with no operating evidence.

---

## 3. Minimal evidence register format

Track evidence in a table like this:

| Control area | Framework | Evidence item | System / process | Owner | Frequency | Source | Notes / gaps |
|---|---|---|---|---|---|---|---|
| Incident handling | NIS2 / DORA | Incident classification runbook | Security operations | IR lead | Quarterly review | runbook repo + ticket system | needs regulator contact appendix |
| Access control | NIS2 / DORA | Admin MFA coverage export | IAM platform | IAM owner | Monthly | IdP dashboard | break-glass accounts pending review |
| ICT risk management | DORA | Critical asset inventory | CMDB / cloud inventory | Platform owner | Monthly | asset export | customer-managed systems not fully tagged |

If evidence cannot be placed in a table with owner and cadence, it is probably not mature enough.

---

## 4. NIS2 operational evidence areas

NIS2 reviews usually care about whether the organization can demonstrate **risk-management measures** and **incident readiness** with enough operational discipline.

### 4.1 Risk analysis and security policies

Expected evidence:

- policy set covering security governance, risk, incident handling, vulnerability management, access control, and continuity,
- risk register with owners, severity, treatment decisions, and review cadence,
- evidence that high-risk items become tracked actions,
- management review or approval trail.

Good artifacts:

- risk register export,
- policy review tickets,
- meeting notes with explicit approvals,
- issue tracker items linked to top risks.

### 4.2 Incident handling and reporting readiness

Expected evidence:

- incident classification matrix,
- on-call and escalation model,
- regulator notification path,
- breach / incident log,
- containment and recovery runbooks,
- tabletop exercise evidence.

Good artifacts:

- incident playbooks,
- postmortems,
- alert escalation screenshots,
- tabletop invite, notes, and follow-up actions,
- evidence that material incidents are logged even when not reportable.

### 4.3 Business continuity and crisis management

Expected evidence:

- backup and recovery policy,
- restoration test results,
- critical-service dependency map,
- continuity and crisis communications plan,
- evidence of recovery exercises.

Good artifacts:

- backup verification logs,
- recovery test tickets,
- dependency diagrams,
- continuity runbooks,
- exercise after-action reports.

### 4.4 Supply chain and third-party risk

Expected evidence:

- supplier register,
- critical supplier identification,
- security review criteria,
- contract or questionnaire trace,
- incident notification expectations for suppliers.

Good artifacts:

- vendor review checklist,
- DPA / security addendum references,
- supplier risk ratings,
- remediation follow-ups for weak suppliers.

### 4.5 Secure development and vulnerability handling

Expected evidence:

- SDLC controls,
- security review and testing gates,
- vulnerability triage and SLA workflow,
- patching evidence,
- exceptions and risk acceptance records.

Good artifacts:

- CI workflow outputs,
- PR checklist evidence,
- vulnerability tracker export,
- remediation tickets,
- scanner coverage dashboard.

### 4.6 Access control and identity hygiene

Expected evidence:

- privileged access model,
- MFA coverage reports,
- JML or access review process,
- break-glass account governance,
- admin role review evidence.

Good artifacts:

- IdP exports,
- quarterly access review records,
- approval tickets,
- role inventory with owner and justification.

---

## 5. DORA operational evidence areas

DORA expects stronger emphasis on **ICT risk management**, **resilience**, **incident classification**, **testing**, and **third-party ICT oversight**, especially for regulated financial contexts.

### 5.1 ICT risk-management framework

Expected evidence:

- ICT asset inventory,
- classification of critical or important functions,
- governance structure and responsibilities,
- documented ICT risk framework,
- implementation trace from policy to operational control.

Good artifacts:

- CMDB or asset inventory export,
- architecture ownership map,
- platform ownership table,
- governance RACI,
- quarterly risk review pack.

### 5.2 Protection and prevention controls

Expected evidence:

- hardening baselines,
- IAM controls,
- network and endpoint controls,
- secrets management,
- change management with approvals,
- monitoring of critical systems.

Good artifacts:

- baseline configuration exports,
- branch protection and workflow controls,
- MFA / OIDC metrics,
- secret scanning outputs,
- privileged change tickets.

### 5.3 Detection and incident management

Expected evidence:

- detection coverage for critical abuse cases,
- incident severity model,
- incident register,
- coordination between technical and regulatory reporting workflows,
- timelines from detection to containment.

Good artifacts:

- SIEM detections,
- ticket timelines,
- incident commander logs,
- exercises that include regulatory timeline decisions.

### 5.4 Digital operational resilience testing

Expected evidence:

- security testing program,
- periodic vulnerability scanning and remediation,
- resilience test records,
- evidence of lessons learned and fixes,
- where required, stronger forms of scenario-led or threat-led testing preparation.

Good artifacts:

- pentest reports,
- remediation closure tickets,
- tabletop or resilience test results,
- security-testing examples adapted to production systems.

### 5.5 ICT third-party risk management

Expected evidence:

- ICT vendor inventory,
- classification of critical third parties,
- onboarding and review process,
- exit and fallback planning,
- incident and concentration-risk awareness.

Good artifacts:

- third-party register,
- criticality rating rationale,
- service dependency map,
- contract review checklist,
- exit planning notes for material providers.

---

## 6. NIS2 vs DORA: evidence emphasis differences

| Area | NIS2 emphasis | DORA emphasis |
|---|---|---|
| Governance | entity-level cyber risk measures | ICT risk-management framework tied to financial resilience |
| Incident reporting | significant incident readiness and timelines | incident classification plus regulated financial-sector reporting discipline |
| Testing | practical preparedness and risk reduction | more formal resilience and testing program expectations |
| Third parties | supply-chain and dependency risk | ICT third-party governance and concentration risk |
| Asset scope | important systems and services | ICT assets supporting critical or important functions |

Do not force identical evidence packs for both. Reuse artifacts, but tailor narrative and ownership.

---

## 7. Evidence pack structure to actually use

A practical pack should include these folders or sections:

1. **Scope and ownership**
   - in-scope services or functions
   - owners
   - contact points
2. **Policies and governance**
   - approved policies
   - review cadence
   - committee or management approvals
3. **Operational controls**
   - IAM, hardening, CI/CD, vulnerability, logging, backup
4. **Incident readiness**
   - playbooks, classification matrix, notification paths
5. **Testing and assurance**
   - scans, tests, pentests, resilience exercises
6. **Third-party oversight**
   - supplier register, reviews, critical-provider tracking
7. **Gaps and remediation**
   - open risks, deadlines, compensating controls

Without a gap section, the pack will look unrealistically perfect and less credible.

---

## 8. Owner map

Use an owner map like this:

| Evidence domain | Typical owner |
|---|---|
| ICT asset inventory | Platform / infrastructure lead |
| IAM and privileged access | IAM / identity owner |
| Incident runbooks and logs | Security operations |
| Vulnerability remediation metrics | Security + engineering management |
| Vendor and third-party register | Procurement / risk / privacy |
| Continuity and recovery tests | Platform / SRE |
| Regulatory communications support | Legal / compliance |

If ownership is vague, the evidence pack will drift immediately.

---

## 9. Common evidence gaps

High-signal recurring gaps include:

- policy exists but no review history,
- asset inventory exists but is not tied to owners,
- incident playbook exists but no exercise has been run,
- MFA metric excludes break-glass or service-admin paths,
- third-party inventory exists but no criticality model,
- backups exist but restore test evidence is absent,
- risk register exists but remediation is not linked to delivery work,
- reporting workflow exists but contact timelines are not tested.

These are exactly the kinds of failures that create poor audit outcomes.

---

## 10. First 30 minutes of a NIS2 / DORA evidence review

1. Identify the in-scope services, entities, or critical functions.
2. Pull the owner map.
3. Confirm there is an asset inventory and incident register.
4. Check whether privileged access, backups, and third-party inventories are current.
5. Sample one recent incident, one recent access review, and one recent resilience or backup test.
6. Record evidence gaps immediately in a tracked register.

If steps 1 to 4 cannot be completed quickly, the compliance problem is usually operational, not documentary.

---

## 11. Review output format

When summarizing a control area, use this structure:

```text
Control area: Incident handling and reporting readiness
Framework: NIS2 / DORA
Owner: Security operations lead
Evidence reviewed: incident classification matrix, on-call rota, tabletop notes, breach log
Confidence: Medium
Gap: regulator contact escalation path not versioned and no recent reporting rehearsal
Next action: add notification appendix and run reporting timeline tabletop this quarter
```

This format is much more useful than generic "control partially implemented" language.

---

## 12. Minimal checklist

| Check | Expected |
|---|---|
| Every evidence item has owner, source, and review cadence | Yes |
| Incident readiness includes both technical and reporting workflow evidence | Yes |
| Asset inventory is tied to critical systems or functions | Yes |
| Third-party evidence includes criticality and oversight, not just vendor names | Yes |
| Testing evidence shows execution and remediation, not only policy intent | Yes |
| Gaps and compensating controls are tracked openly | Yes |
| NIS2 and DORA narratives are tailored, not blindly merged | Yes |
