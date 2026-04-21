---
title: "Service Account Inventory and Ownership"
slug: service-account-inventory-and-ownership
category: iam
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "NIST SP 800-53 Rev.5 (CM-8, AC-2) — https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final"
  - "AWS IAM service-account and role governance guidance — https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html"
  - "Google Cloud service-account security best practices — https://cloud.google.com/iam/docs/best-practices-service-accounts"
  - "Microsoft Entra workload identity guidance — https://learn.microsoft.com/entra/workload-id/"
  - "SPIFFE / SPIRE inventory concepts — https://spiffe.io"
  - "CIS Controls v8.1 (controls 5 & 6) — https://www.cisecurity.org/controls/v8-1 (adds Govern function aligned with NIST CSF 2.0)"
triggers_strong: ["service account inventory", "orphaned service account", "service account owner", "non-human identity inventory", "service principal ownership"]
triggers_weak: ["service account review", "application account", "machine identity inventory"]
related: ["machine-identity-and-service-accounts", "workload-identity-federation", "identity-lifecycle-jml", "control-ownership-and-review-cadence"]
---

# Service Account Inventory and Ownership

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 2-4 | Automation: Partial (inventory exports, last-used telemetry, secret-age reporting, and review reminders partly automatable; business-purpose validation, ownership confirmation, and retirement decisions manual)

Use this guide when teams ask questions like:

- how many service accounts or service principals exist,
- who owns an old integration account,
- which non-human identities still have active credentials,
- whether a machine identity can be retired, narrowed, or replaced,
- how to prove to auditors that service-account governance is real.

This guide focuses on one operational goal: **every non-human identity must be discoverable, attributable, and reviewable**.

---

## 1. Core rule

If a machine identity exists, you should be able to answer all of these quickly:

1. **what exact system or workflow uses it,**
2. **who is accountable for it,**
3. **what credentials or trust path it uses,**
4. **what permissions it has,**
5. **when it was last reviewed,**
6. **how it will be retired.**

If any answer is missing, the identity is under-governed even if it technically still works.

---

## 2. What belongs in scope

Do not limit the inventory to cloud IAM objects alone.

Include at least:

- cloud service accounts and workload identities,
- CI/CD deploy roles and artifact-publishing identities,
- IdP app registrations and service principals,
- bot users in ticketing, chat, support, and observability tools,
- integration accounts in SaaS admin consoles,
- long-lived API keys that act as application identities,
- break-glass automation identities,
- Kubernetes service accounts used by production workloads,
- vendor-managed identities that still operate against your environment.

A common failure is having a clean cloud inventory while forgotten SaaS bots and webhook credentials stay invisible.

---

## 3. Why inventories break down

Most service-account inventories fail for predictable reasons:

- teams track human accounts well but treat non-human identities as implementation detail,
- one team creates the identity while another team operates the system,
- identities exist in many control planes with no shared registry,
- “temporary” integration accounts never get retirement dates,
- the inventory records the name but not the actual credential or trust mechanism,
- nobody records backup owners, so the account becomes orphaned after re-orgs.

The most dangerous result is the orphaned identity that still has working credentials and broad access.

---

## 4. Minimum inventory schema

Track every service account or non-human identity in a register with fields like these:

| Field | Why it matters |
|---|---|
| identity name / unique ID | prevents ambiguity |
| identity type | runtime, CI, integration, bot, emergency automation |
| platform / control plane | cloud IAM, IdP, SaaS admin console, Kubernetes, vault, CI |
| accountable owner | person who answers for the identity |
| backup owner | prevents orphaning during absence or re-org |
| owning team | operational context |
| business purpose | justifies why the identity exists |
| environments in scope | dev, staging, prod separation |
| auth method | federation, managed identity, certificate, API key, password |
| credential location | provider-managed, vault path, secret store, none |
| privilege summary | fast blast-radius view |
| systems touched | incident-scoping support |
| creation date | lifecycle tracking |
| last used | stale identity detection |
| last reviewed | governance proof |
| next review | cadence enforcement |
| retirement trigger | planned end state |
| exception status | visibility for risky edge cases |

If the inventory only stores the account name and platform, it is not yet useful for governance.

---

## 5. Ownership model

Separate ownership clearly.

| Role | What it means |
|---|---|
| Accountable owner | person responsible for why the identity exists and whether it still should |
| Operator | team running the workload or integration day to day |
| Platform owner | owner of the control plane where the identity lives |
| Reviewer | person or team validating privilege and continued need |
| Approver | person authorizing exceptions, high privilege, or overdue retention |

### Weak ownership patterns

- owner is a generic mailbox,
- owner is a vendor name rather than an internal person,
- ownership is “shared” with no primary accountable person,
- the identity belongs to a departed employee with no transfer record,
- the account is tagged only with a project codename nobody recognizes anymore.

### Better ownership patterns

- accountable owner is the service owner or engineering manager,
- backup owner is named,
- platform owner is separate from service owner,
- the inventory record links to the actual system or repo using the identity,
- retirement trigger is known up front.

---

## 6. Data sources to reconcile

A good inventory is assembled from multiple systems, not from a single spreadsheet.

Common sources include:

- cloud IAM exports,
- IdP enterprise apps and app registrations,
- Kubernetes service-account listings,
- CI/CD environment and secret configuration,
- secrets managers and vault paths,
- SaaS admin consoles for integrations and bots,
- repository search for credential references or identity names,
- observability or audit logs showing actual usage.

### 6.1 Reconciliation rule

Do not trust one source of truth blindly.

Reconcile at least three views where possible:

1. **identity object exists**,
2. **credential or trust path exists**,
3. **real workload or integration activity exists**.

An account that exists in IAM but shows no recent use or mapped workload should be reviewed aggressively.

---

## 7. Inventory review workflow

A practical monthly or quarterly review usually looks like this:

### 7.1 Export

Gather current identities from each major platform.

### 7.2 Normalize

Map naming differences, duplicate objects, and aliases into one register.

### 7.3 Attribute

Confirm or fill:

- accountable owner,
- purpose,
- environment,
- privilege summary,
- credential method.

### 7.4 Compare

Check for:

- missing owners,
- missing review dates,
- duplicate or overlapping identities,
- accounts with no recent usage,
- long-lived credentials where federation is available,
- one identity spanning too many environments.

### 7.5 Decide

For each identity choose one:

- **keep as-is**,
- **narrow permissions**,
- **replace with better auth**,
- **retire**,
- **mark as temporary exception**.

### 7.6 Record evidence

Keep the export, reviewer notes, decisions, and remediation tickets.

Without dated evidence, the inventory will not help much during audit or incident response.

---

## 8. High-signal orphan indicators

Treat these as strong warnings:

- no accountable owner,
- owner left the company or changed teams long ago,
- no last-used data and nobody can explain why,
- service account exists for a decommissioned app,
- identity name is vague like `automation-prod`, `integration`, or `bot`,
- same credential reused across several services,
- account has standing admin-like privilege with no exception record,
- identity is referenced in old CI variables or `.env` files but not in current deployment config,
- service principal can mint or rotate more credentials for itself.

Orphaned identities are rarely discovered through policy review alone. You find them by reconciliation and follow-up.

---

## 9. Privilege review questions

For every identity under review, ask:

- does it need write access or only read access,
- does it need production access or only lower environments,
- does it need control-plane privilege or only workload-scoped privilege,
- can it export data in bulk,
- can it grant new permissions or create credentials,
- can it cross tenant, account, or namespace boundaries,
- can it be replaced by federation or managed identity.

If the same identity can deploy code, read sensitive data, and rotate secrets, the blast radius is usually too broad.

---

## 10. Credential governance fields

Inventory the identity and its credential posture together.

| Credential question | Why it matters |
|---|---|
| is the credential long-lived or short-lived | exposure duration |
| who can read or mint it | insider and escalation risk |
| where is it stored | sprawl detection |
| when was it last rotated | aging risk |
| is issuance tied to workload identity | trust quality |
| can it be disabled centrally | containment speed |
| is there audit logging for use and issuance | incident response |

A service account with a good owner but an unmanaged credential is still risky.

---

## 11. Review cadence guidance

Use risk-based cadence.

| Identity type | Suggested review cadence |
|---|---|
| CI/CD deploy and publish identities | monthly plus per major workflow change |
| production runtime identities | monthly or quarterly depending on blast radius |
| sensitive vendor integrations | monthly or quarterly |
| lower-risk internal automation | quarterly |
| break-glass automation | quarterly at minimum and after every use |
| dormant / pending retirement identities | weekly or monthly until removed |

Increase cadence when:

- privileges are broad,
- sensitive data is accessible,
- the identity can affect production,
- credential form is long-lived,
- multiple teams depend on it.

---

## 12. Retirement and transfer workflow

Retirement should be explicit, not passive neglect.

When decommissioning a service account:

1. confirm the workload or integration no longer needs it,
2. remove downstream references in CI, vault, apps, and SaaS settings,
3. disable or delete credentials,
4. revoke tokens, certificates, and API keys,
5. remove permissions and memberships,
6. archive the review evidence,
7. mark the inventory entry retired with date and owner.

### 12.1 Ownership transfer

When the service continues but the team changes:

- update accountable owner and backup owner,
- reconfirm purpose and privilege scope,
- verify the new team can actually access the control plane,
- do not let the identity keep the departed owner indefinitely.

---

## 13. Exceptions that need stronger handling

Some identities cannot yet meet the preferred model.

Examples:

- third-party product requires a static API key,
- legacy app cannot consume workload federation,
- emergency automation requires higher privilege than normal,
- integration account lives in a vendor platform with weak ownership controls.

For these, record:

- why the exception exists,
- compensating controls,
- expiry or revisit date,
- explicit approver,
- migration path.

No exception should be “permanent by silence.”

---

## 14. Metrics worth tracking

A mature inventory program can report at least:

- total machine identities by type,
- identities without named owners,
- identities with long-lived credentials,
- identities not reviewed on time,
- identities with admin or wildcard privilege,
- identities with no recent use,
- identities retired per quarter,
- percentage migrated to federation or managed identity.

These metrics are useful because they point to governance quality, not just object count.

---

## 15. Good and bad evidence

### Good evidence

- dated inventory export,
- named reviewer and owner confirmation,
- privilege summary and exception notes,
- remediation tickets for orphaned or broad accounts,
- proof of retirement or credential revocation.

### Bad evidence

- undated spreadsheet with unclear source,
- list of service accounts with no ownership column,
- screenshot of one console page and no follow-up,
- “we review these when needed” with no history.

---

## 16. Quick review checklist

Ask these before approving the inventory state:

- can we enumerate all major non-human identity types,
- does every entry have an accountable owner and backup owner,
- do we know the auth method and credential location,
- can we see last-used or equivalent activity data,
- are prod identities separated from non-prod,
- are exception identities explicit and time-bound,
- is retirement tracked and evidenced,
- can incident responders use this inventory quickly.

If not, fix the inventory before assuming machine identity is under control.
