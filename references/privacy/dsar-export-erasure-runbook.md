---
title: "DSAR Export & Erasure Runbook"
slug: dsar-export-erasure-runbook
category: privacy
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-18
sources:
  - "GDPR Articles 12, 15, 17, 19, 25, 30, 32"
  - "EDPB guidance on data subject rights"
  - "ICO guidance on right of access and erasure"
triggers_strong: ["DSAR", "data export request", "right to erasure", "privacy runbook", "delete my data"]
triggers_weak: ["data subject request", "export user data", "erase account"]
related: ["gdpr-security-ops", "data-classification-and-handling", "privacy-data-minimization"]
---

# DSAR Export & Erasure Runbook

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (identity verification, exports, and deletion workflows partially automatable; legal review, exceptions handling, and evidence quality manual)

Use this runbook when a person asks to:

- access their data,
- export their data,
- erase their data,
- close an account and remove associated personal data.

This is an **operations guide** for handling requests in a way that is consistent, evidence-backed, and less likely to miss hidden copies.

It is not enough to delete a row in the main app database and call the request done.

---

## 1. Outcome to achieve

For each request, you should be able to show:

- who made the request,
- how identity was verified,
- which systems were searched,
- what data was exported or deleted,
- what exceptions were applied,
- which processors or downstream systems were notified,
- when the request was completed.

If you cannot explain those seven points, the process is not mature enough.

---

## 2. Request types

| Request type | What it means operationally |
|---|---|
| Access / export | locate and provide relevant personal data in intelligible form |
| Erasure | delete or irreversibly de-identify personal data unless a documented exception applies |
| Rectification support | correct inaccurate data and propagate updates where needed |
| Restriction / objection support | stop or limit certain processing while retaining evidence and legal context |

This runbook focuses on **export** and **erasure**, but the same inventory discipline supports the other rights too.

---

## 3. Before touching data

### 3.1 Verify identity

Do not export or erase data based only on an email sent from a known address.

Use verification appropriate to the risk level:

- logged-in self-service request for standard consumer accounts,
- re-authentication for sensitive requests,
- support-assisted verification for account recovery edge cases,
- explicit approval path for requests involving minors, employees, or delegated representatives.

Avoid collecting more identity evidence than needed. Verification should reduce abuse risk, not create a second privacy problem.

### 3.2 Open a tracked case

Track each request with at least:

- request ID,
- requester identity handle,
- request type,
- intake timestamp,
- due date,
- owner,
- legal/privacy escalation flag,
- completion evidence.

### 3.3 Freeze destructive mistakes

Before erasure runs:

- confirm the account or subject record is correct,
- confirm whether there are fraud, abuse, safety, employment, tax, accounting, or litigation holds,
- confirm what must be deleted versus retained with justification,
- confirm whether account disablement must happen before data deletion.

---

## 4. System inventory to search

A defensible DSAR process needs a system map. Search at least these classes:

| System class | Typical examples |
|---|---|
| Primary product databases | users, profiles, settings, billing records |
| Authentication systems | IdP, session store, MFA enrollment, audit login history |
| Support systems | ticketing, CRM notes, call/chat transcripts |
| Analytics and telemetry | product analytics, feature flags, event pipelines |
| Logging and observability | application logs, SIEM, traces, error monitoring |
| File/object storage | uploads, attachments, exported reports, backups of user-generated content |
| Communications | email providers, SMS providers, notification logs |
| Third-party processors | payments, KYC, fraud, marketing, customer support |
| Internal work products | spreadsheets, case notes, screenshots if they contain personal data |

If your process only checks the primary app database, it is incomplete.

---

## 5. Export workflow

### 5.1 Export principles

The export should be:

- scoped to the verified subject,
- intelligible enough for a reasonable person to understand,
- redacted for third-party personal data where needed,
- delivered through a secure mechanism,
- logged as an auditable event.

### 5.2 Export steps

1. Verify identity and open the case.
2. Query the subject across all in-scope systems.
3. Normalize identifiers and reconcile aliases.
4. Remove unrelated third-party data where necessary.
5. Package the export in a stable structure.
6. Deliver it through an authenticated or time-limited secure channel.
7. Record delivery timestamp and evidence.

### 5.3 Practical export structure

A useful export package often includes:

- profile data,
- account settings,
- security history relevant to the subject,
- support history,
- uploaded content the subject owns,
- transaction history where applicable,
- explanation of categories and sources.

Do not dump raw internal tables with unexplained column names if a clearer export can be produced.

---

## 6. Erasure workflow

### 6.1 Erasure principles

Erasure should be:

- precise,
- irreversible where deletion is claimed,
- propagated to downstream systems where required,
- documented when exceptions apply,
- verified after execution.

### 6.2 Common erasure targets

| Target | Typical action |
|---|---|
| active user profile | delete or de-identify |
| sessions and tokens | revoke and invalidate |
| stored content | delete if owned by the subject unless retention exception applies |
| support records | redact or minimize if direct deletion is not feasible |
| analytics identifiers | delete or sever linkability |
| logs | delete where feasible or age out per retention policy; otherwise document exception |
| backups | do not restore deleted data except under controlled recovery; ensure backup expiry path exists |

### 6.3 Erasure steps

1. Verify identity and any legal exceptions.
2. Disable interactive access if needed.
3. Revoke sessions, refresh tokens, API keys, and device links.
4. Delete or de-identify the subject in primary systems.
5. Trigger downstream processor deletion where contractually required.
6. Mark records for delayed purge where immediate deletion is not technically feasible.
7. Verify deletion or de-identification completed.
8. Record evidence and close the case.

### 6.4 De-identification versus deletion

If you retain data in de-identified form, make sure:

- the subject is no longer reasonably re-identifiable,
- join keys are removed or strongly segregated,
- retained aggregates are actually needed,
- the rationale is documented.

"We removed the name" is usually not enough.

---

## 7. Exceptions and legal holds

Not all requested data can always be erased immediately.

Typical exceptions may involve:

- security investigations,
- fraud prevention,
- financial reporting and tax retention,
- employment record obligations,
- litigation or regulatory hold,
- public-interest or safety obligations.

Rules:

- document the exception precisely,
- retain only what is justified,
- restrict access to retained data,
- communicate clearly what was retained and why if disclosure rules require it.

A vague "for compliance reasons" note is not a sufficient exception record.

---

## 8. Identity resolution pitfalls

DSAR failures often come from poor identity resolution, not bad intent.

Watch for:

- multiple emails for one account,
- merged or split accounts,
- guest versus registered identities,
- email aliases,
- phone number changes,
- internal support-created records,
- deleted-but-restorable shadow data.

A reliable process maintains a mapping of stable identifiers and aliases used during the search.

---

## 9. Processors and downstream systems

You must know which vendors or subprocessors hold personal data for the subject.

For each relevant processor, track:

- system name,
- data category involved,
- controller/processor relationship,
- deletion/export mechanism,
- expected turnaround,
- evidence returned.

Examples:

- support platform ticket data,
- email delivery logs,
- analytics vendors,
- payment processors,
- KYC or fraud providers,
- cloud storage containing user uploads.

If deletion depends on a vendor, the case is not complete until that dependency is tracked and evidenced.

---

## 10. Backups, logs, and immutable systems

These are the most common trouble spots.

### 10.1 Backups

Expected stance:

- do not selectively edit immutable backups unless your process explicitly supports it,
- ensure deleted data will age out with backup retention,
- do not reintroduce erased data during restoration except under controlled emergency procedures.

### 10.2 Logs

Expected stance:

- avoid placing raw personal data in logs in the first place,
- when present, delete if feasible or age out quickly,
- if not feasible, document the exception, retention window, and access restrictions.

### 10.3 Screenshots and attachments

These are often forgotten. Search support tools, incident tickets, and shared workspaces where screenshots or exported CSVs may exist.

---

## 11. Secure delivery of exports

Use delivery methods such as:

- authenticated self-service download,
- short-lived signed download links tied to the case,
- encrypted transfer with separate out-of-band secret exchange when warranted.

Do not email large unencrypted exports containing sensitive personal data as a default pattern.

---

## 12. Evidence to retain

For each request, retain operational evidence such as:

- request intake record,
- identity verification record,
- systems searched checklist,
- export manifest or deletion manifest,
- processor notifications,
- exceptions or legal-hold notes,
- completion timestamp,
- approver or reviewer where needed.

Keep the evidence minimal and access-controlled. A privacy process should not create unnecessary new copies of personal data.

---

## 13. First 30 minutes of a DSAR case

1. Classify the request: export, erasure, or both.
2. Verify the requester identity at the right assurance level.
3. Open the case with due date and owner.
4. Pull the subject identifier map and alias list.
5. Check legal holds and mandatory retention constraints.
6. Enumerate systems and processors touched by the account.
7. Start collection or deletion with a tracked checklist.

A case that starts with a searchable checklist finishes faster and with fewer misses.

---

## 14. Common red flags

| Red flag | Why it matters |
|---|---|
| support handles the request ad hoc in email | no evidence, easy misses |
| only main DB is searched | incomplete export / erasure |
| deletion means just `is_deleted = true` forever | not true erasure without policy justification |
| logs and screenshots ignored | common hidden personal data copies |
| vendor-held data not tracked | incomplete response |
| no identity verification beyond inbox access | abuse risk |
| backup handling undefined | deleted data may reappear |

---

## 15. Minimum checklist

| Check | Expected |
|---|---|
| Request is tracked with ID, owner, and due date | Yes |
| Identity is verified appropriately before export or erasure | Yes |
| All relevant systems and processors are searched | Yes |
| Exceptions and legal holds are documented precisely | Yes |
| Export is intelligible, scoped, and securely delivered | Yes |
| Erasure includes sessions, downstream systems, and verification | Yes |
| Backups, logs, screenshots, and attachments are explicitly handled | Yes |
| Completion evidence is retained with restricted access | Yes |

---

## 16. Related references

- `gdpr-security-ops.md`
- `data-classification-and-handling.md`
- `privacy-data-minimization.md`
