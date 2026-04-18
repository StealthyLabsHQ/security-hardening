---
title: "GDPR Security Operations"
slug: gdpr-security-ops
category: privacy
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-14
sources:
  - "Regulation (EU) 2016/679 (GDPR)"
  - "EDPB guidance"
  - "CNIL security guidance"
triggers_strong: ["gdpr security", "72 hour breach", "dsar", "retention"]
triggers_weak: ["privacy ops", "gdpr review"]
related: ["privacy-data-minimization", "compliance-mapping"]
---

# GDPR Security Operations

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (asset inventory, retention jobs, DSAR workflow tickets, and breach logging automatable; legal assessment and regulator communications manual)

This guide turns GDPR / RGPD obligations into concrete engineering, security, and operations controls. Use it when you handle personal data of people in the EU and need defensible **technical and organizational measures**, not vague compliance language.

It complements `privacy-data-minimization.md` by focusing on governance, evidence, vendor controls, and incident handling.

---

## 1. GDPR Articles That Matter Technically

| Article | Operational meaning |
|---------|---------------------|
| Article 5 | Collect the minimum data needed, use it only for the stated purpose, keep it accurate, protect it, and delete it on time |
| Article 25 | Privacy by design and by default - secure defaults, minimization, least privilege, no silent over-collection |
| Article 28 | Processors need a DPA and clear instructions |
| Article 30 | Keep a Record of Processing Activities (RoPA) |
| Article 32 | Implement security measures proportionate to risk |
| Articles 33-34 | Detect, assess, and notify breaches within the right timelines |
| Article 35 | Run a DPIA when risk is likely high |
| Chapter V | International transfers need a lawful transfer mechanism and risk assessment |

---

## 2. Minimum Evidence Pack

If you cannot show these items during an incident, customer due-diligence request, or regulator inquiry, your process is not mature enough.

| Artifact | Owner | Minimum content |
|----------|-------|-----------------|
| Data inventory | Engineering + Privacy | Systems, data types, purpose, location, owners |
| RoPA | Privacy / Legal | Categories of data subjects, data, purpose, recipients, transfers, retention |
| Retention schedule | Security + Privacy | Per-data-class retention and deletion method |
| Processor register | Procurement / Privacy | Vendor, DPA status, region, subprocessors, transfer mechanism |
| TOMs register | Security | Access control, encryption, logging, backups, recovery, vendor controls |
| DSAR runbook | Support + Engineering | Identity verification, search locations, delete/export steps, SLA |
| Breach log | Security + Privacy | Incident date, data involved, decision, notification status |
| DPIA register | Product + Privacy | Features or systems requiring high-risk assessment |

---

## 3. Build New Features with Privacy Gates

Before merging a feature that touches personal data, answer these questions:

1. What personal data is collected, generated, inferred, or exported?
2. Why is each field needed? Can we remove or pseudonymize it?
3. What is the lawful basis?
4. Who can access it internally and externally?
5. How long is it retained, and how is deletion enforced?
6. Will it appear in logs, analytics, support tools, backups, or AI prompts?
7. Can the user exercise access, correction, deletion, restriction, or export rights?
8. Is there cross-border transfer or a new processor?
9. Is the change likely high risk and therefore DPIA-worthy?

**Feature gate checklist:**

| Check | Expected |
|-------|----------|
| New personal data fields justified | Yes |
| Secure default is least data, least sharing | Yes |
| Retention/deletion path defined | Yes |
| Logs and analytics reviewed for PII | Yes |
| DSAR impact understood | Yes |
| Vendor / transfer review completed if applicable | Yes |

---

## 4. Article 32 - Technical and Organizational Measures

Article 32 is risk-based. "State of the art", implementation cost, scope, context, and risk all matter. In practice, most modern products handling personal data should have:

- strong authentication and least privilege,
- encryption in transit,
- encryption at rest where compromise would materially harm users,
- pseudonymization or tokenization where full identifiers are not required,
- secret management (not secrets in code or chat),
- logging and alerting without leaking PII,
- vulnerability management and timely patching,
- tested backup and recovery,
- incident response ownership and evidence retention,
- processor controls and contractual notification requirements.

**Examples of proportionate measures by scenario:**

| Scenario | Minimum expected |
|----------|------------------|
| SaaS with account data only | SSO/MFA for admins, encrypted transport, least privilege, backup, retention, breach runbook |
| HR / payroll / finance | Strong MFA, access segregation, enhanced logging, DLP-minded sharing controls, tighter retention |
| Health / special category data | Encryption, strict role scoping, strong monitoring, DPIA, processor scrutiny, reduced local copies |
| Startup using many SaaS tools | Vendor register, DPA review, SSO for priority apps, clear data flow map, personal-data-safe logging |

---

## 5. Processors, Vendors, and International Transfers

Do not let procurement or engineering onboard a new vendor without checking:

- Is there a signed **Data Processing Agreement (DPA)**?
- Where is the data stored and processed?
- Is there a subprocessor list and change-notification mechanism?
- If data leaves the EEA/UK/adequate jurisdictions, what is the transfer mechanism?
- If SCCs are used, has a Transfer Impact Assessment (TIA) been done where needed?
- What is the vendor breach-notification commitment?
- Can data be deleted on termination?
- Are customer support, AI training, analytics, or telemetry terms broader than expected?

**Red flag vendors:**

- no DPA,
- vague retention language,
- no deletion mechanism,
- no audit logs for admin activity,
- silent subprocessor changes,
- broad rights to reuse uploaded data.

---

## 6. Breach Handling and the 72-Hour Clock

The controller must notify the competent supervisory authority without undue delay and, where feasible, within 72 hours when a breach is likely to risk individuals' rights and freedoms.

**Practical timeline:**

| Time | Action |
|------|--------|
| T+0 to T+4h | Confirm incident, preserve evidence, identify affected systems and whether personal data may be involved |
| T+4 to T+24h | Determine data categories, number of records, likely impacted people, processors, and containment status |
| T+24 to T+48h | Assess risk to individuals, draft authority notification, prepare customer/employee comms if needed |
| T+48 to T+72h | Notify supervisory authority if threshold met; record rationale if not notifying |

**Processor contract expectation:** require processors to notify you **without undue delay**, ideally within 24 hours contractually.

Maintain a breach log even when the threshold for notification is not met.

---

## 7. DSAR, Deletion, Export, and Retention Operations

Security teams often discover privacy failures first because they know where the data really lives.

Operational expectations:

- Verify requester identity before disclosing or deleting anything.
- Know every system that may hold user data: DB, object storage, search indexes, analytics, support tools, backups, logs.
- Document what can be deleted immediately vs. what remains until backup rotation.
- Avoid "manual scavenger hunt" DSAR handling for each request; create repeatable workflows.
- Test export and deletion flows at least quarterly for a representative user.
- Keep audit records of the request handling without storing unnecessary extra data.

Related implementation guidance: `privacy-data-minimization.md`.

---

## 8. When a DPIA Is a Serious Candidate

Escalate for DPIA review when you plan to introduce:

- large-scale monitoring or profiling,
- processing of special category or highly sensitive data,
- systematic tracking of employees, students, patients, or vulnerable groups,
- AI features that rank, score, infer, or make significant decisions about people,
- large-scale data combination across systems or vendors,
- new high-risk international transfers.

If in doubt, document why a DPIA was or was not required.

---

## 9. Common Red Flags

| Red flag | Why it matters |
|----------|----------------|
| Production dumps shared in tickets or chat | Immediate confidentiality and transfer risk |
| No RoPA / data inventory | You cannot answer DSARs or scope breaches reliably |
| Logs keep emails, tokens, or IDs forever | Article 5 minimization and storage limitation failure |
| AI tool fed raw customer, HR, or legal data without review | Uncontrolled processor / transfer / confidentiality risk |
| Vendor has no DPA or clear subprocessor list | Weak Article 28 posture |
| Shared admin accounts | No accountability or meaningful access control |
| No breach log because "nothing big happened" | Weak Article 33 accountability |
| Retention says "forever" by default | Usually indefensible |

---

## 10. Minimum Operating Rhythm

### Monthly

- Review new vendors, subprocessors, and admin accounts.
- Review open incidents and privacy-impacting bugs.
- Check whether logs, analytics, or support exports started collecting new fields.

### Quarterly

- Test DSAR export and erasure workflow.
- Test one breach tabletop with personal-data impact.
- Review retention jobs and deletion evidence.

### Annually

- Refresh the RoPA and processor register.
- Review TOMs against current systems and threats.
- Reassess cross-border transfers and SCC/TIA assumptions.

---

## Resources

- `privacy-data-minimization.md`
- `incident-playbooks.md`
- `vuln-management.md`
- CNIL - Security of personal data and developer guidance
- EDPB guidelines on breach notification, controllers/processors, and international transfers
- ENISA recommendations on technical and organizational measures

