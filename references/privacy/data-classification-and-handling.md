---
title: "Data Classification and Handling"
slug: data-classification-and-handling
category: privacy
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-18
sources:
  - "GDPR Article 5 and Article 32"
  - "NIST Privacy Framework"
  - "ISO/IEC 27001 information classification guidance"
triggers_strong: ["data classification", "data handling", "sensitive data in prompts", "pii handling rules", "log ticket prompt policy"]
triggers_weak: ["data handling review", "classification policy", "sensitive data"]
related: ["privacy-data-minimization", "gdpr-security-ops", "production-error-handling", "ai-tool-profiles"]
---

# Data Classification and Handling

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (classification labels, DLP rules, and scanner-based checks automatable; business classification decisions, exceptions, and lawful-use review manual)

Use this guide when a team needs an operational answer to: **what kind of data is this, where may it go, and what safeguards are required before it is logged, exported, shared, or pasted into tools**.

This file complements `privacy-data-minimization.md` and `gdpr-security-ops.md` by turning privacy and confidentiality requirements into **handling rules** that engineering, support, operations, and AI-assisted workflows can follow consistently.

---

## 1. Why classification matters

Teams usually do not fail because they have no privacy principles. They fail because they cannot answer quickly:

- Can this field go into logs?
- Can this export be attached to a ticket?
- Can this CSV be uploaded to an AI tool?
- Can support keep this screenshot?
- Does this data need deletion, masking, approval, or a processor review?

Classification is the bridge between abstract obligations and day-to-day engineering decisions.

---

## 2. Recommended data classes

Use a small number of classes. Too many labels create friction and inconsistent usage.

| Class | Meaning | Typical examples | Default stance |
|------|---------|------------------|----------------|
| `Public` | Safe for public disclosure | marketing copy, public docs, open-source code | may be shared openly |
| `Internal` | Non-public business data with limited harm if exposed | roadmaps, non-sensitive tickets, internal runbooks | share only inside approved org systems |
| `Confidential` | Data that can materially harm users, customers, employees, or the company if exposed | customer emails, internal metrics, non-public contracts, API responses with identifiers | restrict to business need; mask before broad sharing |
| `Restricted` | Highly sensitive, regulated, or high-blast-radius data | credentials, session tokens, payroll, HR cases, support exports, legal files, health data, card data, production DB dumps | least privilege, strong approval, strong logging controls, no casual copying |

When in doubt, classify upward until the owner explicitly downgrades.

---

## 3. Typical data types by class

| Data type | Default class | Notes |
|----------|---------------|-------|
| Public website content | `Public` | Unless unreleased or embargoed |
| Internal architecture diagrams | `Internal` or `Confidential` | Upgrade if they expose trust boundaries or secrets locations |
| Email address, phone number, postal address | `Confidential` | Personal data; may be regulated |
| Session token, refresh token, API key, SSH key | `Restricted` | Never place in tickets, chat, or prompts |
| Customer support export | `Restricted` | Often contains account history and free-text disclosures |
| HR performance or disciplinary records | `Restricted` | Sensitive workforce data |
| Production database snapshot | `Restricted` | Treat as crown-jewel artifact |
| Aggregated, anonymized product metrics | `Internal` | Confirm re-identification risk is low |
| Source code | `Internal` by default | Upgrade if it contains secrets, proprietary models, or regulated logic |
| Security findings or incident notes | `Confidential` or `Restricted` | Upgrade when they include exploit paths, customer impact, or credentials |

---

## 4. Allowed handling matrix

Use this as the default decision table.

| Destination / use | Public | Internal | Confidential | Restricted |
|---|---|---|---|---|
| Standard application logs | Yes | Usually | Only masked/minimized | No |
| Security logs with limited access | Yes | Yes | Minimized only | Rare, with explicit justification |
| Internal ticket | Yes | Yes | Yes, if access is scoped | Only summary or redacted artifact link |
| Email | Yes | Yes | Prefer approved recipients only | Avoid; use secure portal or controlled share |
| Chat / messaging | Yes | Yes | Redacted summary only | No raw data |
| AI prompt to approved restricted-profile tool | Yes | Yes | Masked, purpose-limited | No raw data unless explicitly approved and contractually covered |
| Third-party SaaS without DPA / review | Yes | Maybe | No | No |
| Analytics / telemetry | Yes | Yes | Only if minimized and justified | No |
| Test fixtures | Yes | Yes | Synthetic or masked only | No raw production data |
| Screenshots | Yes | Yes | Crop or blur identifiers | Avoid; if necessary, redact first |
| Local downloads to unmanaged device | Yes | Maybe | Avoid | No |

If your environment cannot enforce access control, assume the destination is lower trust than intended and classify upward.

---

## 5. Rules by workflow

### 5.1 Logging

Rules:

- Log identifiers only when they are necessary for debugging, triage, or audit.
- Prefer stable internal IDs over direct identifiers like email or phone.
- Do not log passwords, tokens, cookies, secrets, access keys, or full request bodies by default.
- Treat request/response dumps as `Restricted` unless proven otherwise.
- Apply retention and access controls proportionate to the classification.

Examples:

| Bad | Better |
|---|---|
| full user object in log line | internal user ID and event type |
| entire webhook payload | event ID, provider, signature status |
| full support request body | ticket ID and selected non-sensitive fields |

See `privacy-data-minimization.md` and `production-error-handling.md` for implementation patterns.

### 5.2 Tickets and case systems

Rules:

- Tickets should contain the minimum raw data needed to complete the work.
- Prefer links to controlled systems over copy-pasted datasets.
- Use field-level redaction for screenshots, exports, and pasted payloads.
- Separate customer-facing context from secrets, exploit notes, and internal-only remediation details.
- Expire attachments or move them to controlled evidence storage when the case closes.

### 5.3 Email and chat

Rules:

- Do not send `Restricted` data over normal email or chat unless the approved process explicitly allows it.
- For `Confidential` data, share summary and secure reference, not raw export.
- Do not paste tokens, database rows, or support exports into ad hoc chats.
- Assume chat tools are broadly visible, retained, and searchable.

### 5.4 Analytics and telemetry

Rules:

- Analytics should default to event semantics, not identity richness.
- Use pseudonymous identifiers where possible.
- Avoid recording free-text fields unless absolutely necessary.
- Review every new field before it enters product telemetry.
- Ensure deletion and retention behavior is documented when personal data is present.

### 5.5 Prompts and AI-assisted workflows

Rules:

- `Public` and `Internal` data may be used in approved tools according to normal project policy.
- `Confidential` data should be masked, minimized, and purpose-limited before prompting.
- `Restricted` data should not be pasted into AI tools by default, even when the tool is approved, unless a documented exception exists with processor, retention, and access review.
- Never paste credentials, raw support exports, payroll files, legal case files, or production DB dumps into prompts.
- Keep prompt traces and transcripts subject to the same classification as the data they contain.

This is where many privacy failures now occur. A tool may be convenient and still be the wrong destination for the data.

---

## 6. Prompt and AI handling rules

Use this quick decision matrix before copying data into an AI tool.

| Question | If answer is "yes" |
|---|---|
| Does the material contain credentials, tokens, or secrets? | Stop. Remove or rotate first. |
| Does it include personal data about customers, employees, applicants, or patients? | Minimize and check approved profile / processor coverage. |
| Is it a raw export, transcript, or database dump? | Do not paste raw. Create a redacted subset. |
| Is the tool configured with a restrictive approved profile? | If not, stop and use an approved environment. |
| Would you be comfortable attaching the exact prompt to an audit ticket? | If not, reduce or redact the data further. |

For AI-specific operational controls, also see `ai-tool-profiles.md`.

---

## 7. Minimum metadata to carry with classified data

When storing or exporting sensitive artifacts, keep these fields with the data or its container:

- classification,
- owner,
- purpose,
- source system,
- retention period,
- sharing restrictions,
- deletion path,
- whether third parties or AI tools are allowed.

A file with no label and no owner becomes shadow data very quickly.

---

## 8. Default handling standards by class

### `Public`

- No confidentiality restriction.
- Integrity still matters.
- Keep authoritative version and publication owner.

### `Internal`

- Share within approved organization systems only.
- Avoid anonymous public links.
- Retention based on business need.

### `Confidential`

- Limit to named roles or teams.
- Mask before broad internal sharing.
- Require review before export to vendors or AI systems.
- Retention and deletion must be explicit.

### `Restricted`

- Need-to-know only.
- Strong authentication and access logging expected.
- Prefer secure portals, vaults, or controlled evidence stores.
- No casual copy-paste into tickets, chat, or prompts.
- Local downloads, screenshots, and broad duplication should be exceptional.

---

## 9. Masking and redaction patterns

Use redaction before sharing unless the full value is required for the task.

| Data type | Recommended redaction |
|----------|------------------------|
| Email | keep domain, partially mask local part |
| Card number | last four only |
| Phone number | last two to four digits only |
| Address | city/country only unless exact address needed |
| Access token | never share raw; refer to token ID or issue tracker item |
| Session cookie | never share raw |
| User name | internal ID or initials depending on context |

Principles:

- Redact as close to the source as possible.
- Keep the minimum context required for the task.
- Do not invent fake redaction by moving raw data into a screenshot or archive.

---

## 10. Retention and deletion expectations

Classification is incomplete without lifecycle rules.

| Class | Default retention expectation |
|------|-------------------------------|
| `Public` | based on publication lifecycle |
| `Internal` | business need with periodic review |
| `Confidential` | defined retention plus deletion or anonymization path |
| `Restricted` | shortest justified retention, tightly controlled storage, explicit deletion or archive rules |

Questions to answer for every `Confidential` or `Restricted` system:

- What is the default retention?
- Who approves exceptions?
- How is deletion enforced?
- Are backups, logs, caches, search indexes, and prompt traces included?

---

## 11. Ownership and approval model

Use a lightweight ownership model:

| Role | Responsibility |
|---|---|
| Data owner | decides classification and allowed use |
| System owner | implements controls in the system |
| Security / privacy reviewer | validates high-risk sharing, tooling, and exceptions |
| Support / operations handler | follows handling rules in tickets, exports, and incident workflows |

Do not let classification become purely theoretical. Someone must own the decision.

---

## 12. Common failure modes

High-signal failures include:

- everything labeled `Internal` to avoid friction,
- raw production exports attached to tickets,
- support screenshots containing session cookies or full email addresses,
- logs capturing `Confidential` data for convenience,
- `Restricted` data pasted into AI tools or chat,
- no owner or retention for exported CSV files,
- synthetic test data mixed with real customer records,
- relying on private links instead of actual access control.

---

## 13. First-pass review checklist

Use this when classifying a new workflow or data set.

| Check | Expected |
|---|---|
| Data classes are defined and simple enough to use | Yes |
| Each new field or export has an owner and purpose | Yes |
| Logs, tickets, prompts, and analytics have explicit handling rules | Yes |
| `Restricted` data is blocked from casual copy-paste workflows | Yes |
| Retention and deletion path exist for `Confidential` and `Restricted` data | Yes |
| AI tool usage is tied to approved profiles and processor review | Yes |
| Redaction pattern exists before sharing or escalation | Yes |

---

## 14. Minimal output format for reviews

When reviewing a workflow, report decisions like this:

```text
Data class: Confidential
Fields in scope: name, email, account status, billing summary
Allowed destinations: scoped ticket, approved support tool, redacted AI prompt
Blocked destinations: chat paste, raw logs, unmanaged local download
Retention: 90 days in case system, 30 days for attachments
Owner: Support operations manager
Open gap: screenshots currently expose full email address
```

That format reduces ambiguity and makes exceptions visible.
