---
title: "Temporary Access and Break-Glass Governance"
slug: temporary-access-and-break-glass-governance
category: iam
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-19
sources:
  - "NIST SP 800-53 AC-2, AC-6, and IR guidance on privileged and emergency access"
  - "Microsoft Entra PIM and emergency access account guidance"
  - "AWS emergency access and privileged identity governance guidance"
  - "CISA privileged access and account security recommendations"
triggers_strong: ["break glass account", "temporary access", "emergency admin access", "just in time access", "privileged elevation"]
triggers_weak: ["temporary admin", "emergency access", "jit access"]
related: ["identity-lifecycle-jml", "sso-saml-oidc-hardening", "service-account-inventory-and-ownership", "high-trust-admin-workstations", "incident-playbooks"]
---

# Temporary Access and Break-Glass Governance

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 2-4 | Automation: Partial (JIT grants, expiry enforcement, approval workflows, and access logs partly automatable; emergency-use judgment, post-incident review, and exception governance manual)

Use this guide when you need to control:

- temporary privileged access for engineers, admins, support, or vendors,
- just-in-time elevation for production or control-plane tasks,
- emergency-only break-glass accounts,
- incident-response access that bypasses routine approval paths,
- temporary exceptions where standing privilege would otherwise be created.

The goal is simple: **high-risk access should be rare, attributable, time-bounded, and reviewable**.

---

## 1. Core rule

Treat standing privileged access as the exception, not the baseline.

Any high-impact access path should answer:

1. **who asked for it,**
2. **who approved it,**
3. **what exact scope it grants,**
4. **when it expires,**
5. **what evidence proves how it was used.**

If you cannot answer those five quickly, the organization is carrying avoidable IAM risk.

---

## 2. Temporary access versus break-glass

These are not the same thing.

| Pattern | What it is | Typical use | Expected controls |
|---|---|---|---|
| Temporary access | time-bounded extra privilege for a planned task | production deploy, one-time database change, vendor troubleshooting | ticket, named approver, minimum scope, automatic expiry |
| JIT elevation | temporary access delivered on demand from a governed platform | cloud admin role for 1 hour, support elevation for a customer case | policy-based approval, logs, expiry, recertification |
| Break-glass access | emergency path used when normal control paths fail or are unavailable | IdP outage, lockout of all admins, severe incident containment | separate identity, stronger custody, explicit incident trail, immediate post-use review |
| Standing admin access | long-lived privilege available at all times | convenience admin model | should be minimized or eliminated |

If teams call every urgent request “break glass,” they usually have a weak temporary-access program rather than a real emergency-access design.

---

## 3. When temporary privileged access is justified

Reasonable cases include:

- one-time production troubleshooting,
- approved maintenance or migration work,
- incident response and recovery,
- temporary vendor or contractor support,
- backfill of a role during leave or transition,
- narrowly bounded security investigation.

Weak justifications include:

- “it is easier if I just stay admin,”
- repeating the same temporary grant every day because role design is poor,
- long-lived access for a future project,
- support access with no case number or customer context,
- keeping privileged roles because removal might be annoying later.

Temporary access that repeats predictably should usually become a governed role, a JIT pattern, or a workflow redesign.

---

## 4. Minimum request fields

Every temporary privileged-access request should capture at least:

| Field | Why it matters |
|---|---|
| requester | attribution |
| accountable owner | business and technical ownership |
| system / environment | scope |
| requested role or action | exact privilege |
| reason | necessity |
| ticket / change / incident ID | traceability |
| requested start time | timing |
| requested end time | expiry |
| approving authority | risk acceptance |
| safeguards | monitoring, peer presence, change window, recording |

If the request only says “need admin ASAP,” it is too vague to be safe.

---

## 5. Temporary access workflow

### 5.1 Request

The requester should identify:

- exact environment and systems,
- exact role or permission set,
- expected duration,
- task being performed,
- related change, incident, or customer case.

### 5.2 Review

The reviewer should confirm:

- the request is necessary,
- the scope is the minimum needed,
- the work could not be done with a less privileged path,
- the duration is short and reasonable,
- monitoring or peer review is appropriate.

### 5.3 Approval

Use named approval, not implied approval in chat.

Higher-risk access should often require both:

- service or business-owner approval,
- security, platform, or IAM approval.

### 5.4 Grant

Prefer automated JIT or role activation rather than manual group sprawl.

Good grant patterns:

- PIM / JIT role activation with expiry,
- access packages with automatic end date,
- short-lived cloud role assumption,
- support role elevation bound to a case or ticket.

### 5.5 Use

During use, collect evidence such as:

- activation timestamp,
- operator identity,
- system actions,
- session logs where feasible,
- related change or incident references.

### 5.6 Expiry and review

On expiry:

- revoke the access,
- confirm no related standing grants were left behind,
- review abnormal or high-risk actions,
- keep evidence of completion.

A temporary grant with no automatic end is usually a future standing privilege.

---

## 6. Scope rules

Keep temporary access as narrow as possible.

Prefer:

- one environment over all environments,
- one role over blanket admin,
- one customer case over platform-wide support access,
- one namespace or account over org-wide scope,
- short duration over open-ended windows.

Avoid:

- adding the user to a permanent admin group “for now,”
- granting wildcard privileges for a targeted task,
- using shared admin credentials,
- letting the same grant cover unrelated tasks.

If the operator needs multiple unrelated scopes, review whether the job design is broken.

---

## 7. Break-glass governance

Break-glass access is for emergencies where standard controls are unavailable, too slow, or actively part of the failure.

Examples:

- primary IdP outage,
- lockout of all normal admins,
- urgent containment during compromise,
- failure of normal approval systems during a live incident,
- recovery of a critical system when routine access paths are broken.

A break-glass account is not just a powerful account. It is an **exception path with stricter custody and stronger review**.

---

## 8. Minimum break-glass controls

A real break-glass design should include:

- separate identities not used for daily admin,
- strong phishing-resistant MFA or hardware-backed factors,
- secure credential custody with limited custodians,
- explicit usage conditions,
- logging and alerting on every use,
- documented recovery and rotation process after use,
- regular testing to prove the path actually works.

Bad patterns:

- emergency admin account also used for convenience,
- password written in a shared document,
- no alert on sign-in,
- no owner,
- no test because “we do not want to touch it.”

Untested break-glass is often fake resilience.

---

## 9. Break-glass custody model

Use a model like this:

| Control | Expected pattern |
|---|---|
| Account separation | separate emergency identity, not a primary admin account |
| Factor custody | hardware token, password vault with restricted access, or dual-control retrieval |
| Named custodians | limited, current, and reviewed |
| Alerting | notify security / IAM / incident leads on every authentication attempt |
| Device expectations | use only from high-trust admin workstation or approved emergency environment |
| Rotation | rotate after use, suspected exposure, or custodian change |

Do not let emergency credentials become invisible because “they are rarely used.” Rarely used credentials are exactly the ones that drift.

---

## 10. Break-glass activation workflow

### 10.1 Trigger

Record:

- incident or outage ID,
- systems impacted,
- why normal access path is unavailable or insufficient,
- who authorized activation.

### 10.2 Activation

During activation:

- use named operator identity where possible,
- minimize time window,
- restrict to approved systems,
- capture audit logs and session context.

### 10.3 Use discipline

Expected rules:

- no unrelated admin tasks while emergency access is active,
- no normal browsing or email in the same privileged context,
- no credential sharing over chat,
- no bulk data access unless the incident truly requires it.

### 10.4 Recovery and closure

After emergency use:

- rotate credentials or recovery materials as needed,
- terminate active sessions,
- verify no standing privilege remained,
- preserve evidence,
- review whether the normal access path needs redesign.

Break-glass use should end with less emergency dependence, not more.

---

## 11. Approval models by risk

| Access type | Example | Expected approval |
|---|---|---|
| low-risk temporary operational access | one-hour read-only diagnostic role in staging | manager or service owner |
| production change role | time-bounded write access in prod | service owner plus platform/security depending on risk |
| customer support impersonation or export path | support escalation into customer context | case-linked approval plus audit logging |
| security investigation elevation | security analyst needs broader log or admin access | incident lead or security approver |
| break-glass account use | emergency IdP or production recovery | incident commander, security lead, or designated emergency approver; document any exception if unavailable |

The higher the blast radius, the stronger the approval and the shorter the duration.

---

## 12. Vendor and contractor temporary access

Contractors and vendors should rarely receive indefinite privileged access.

Minimum controls:

- named sponsor,
- explicit end date,
- isolated identity,
- limited environments,
- stronger logging,
- access reviewed on contract renewal,
- rapid revoke path if the engagement changes.

Red flags:

- shared vendor admin accounts,
- no clear sponsor,
- standing support privilege across all customers or environments,
- offboarding tied only to someone remembering.

---

## 13. Monitoring and detection

High-signal alerts include:

- break-glass account authentication,
- emergency-role activation outside business hours,
- temporary grant created with no expiry,
- manual addition to persistent admin group instead of JIT path,
- multiple emergency activations by the same user in a short period,
- use of a break-glass identity from a non-approved device or IP range,
- “temporary” grant renewed repeatedly without redesign.

A pattern of recurring emergency or temporary elevation is often evidence of weak role engineering.

---

## 14. Review cadence

| Item | Minimum cadence |
|---|---|
| break-glass account existence and owner review | quarterly |
| emergency credential or token custody review | quarterly |
| break-glass functionality test | at least annually, often quarterly for critical environments |
| temporary-access policy review | semi-annually |
| high-risk temporary access sample review | monthly or quarterly |
| repeated temporary grants analysis | monthly |

Testing should prove not only that the account works, but also that alerts, logging, and post-use rotation still work.

---

## 15. Evidence for audit and governance

Keep evidence such as:

- temporary access requests and approvals,
- activation logs from JIT or PIM systems,
- break-glass test records,
- access expiry evidence,
- incident-linked emergency access notes,
- review artifacts for break-glass owners and custodians,
- remediation actions when a temporary grant became effectively permanent.

Useful evidence answers both:

1. **was access governed before use,** and
2. **was it cleaned up after use.**

---

## 16. Anti-patterns

Avoid:

- permanent membership in admin groups justified as “temporary,”
- one emergency account shared by many people,
- break-glass passwords in ticket comments or runbooks,
- emergency accounts without MFA because “we need them to be easy,”
- no post-use review because the team was busy,
- using break-glass to bypass normal change control for convenience,
- retaining temporary access after the original task ends.

If break-glass becomes normal, normal governance has failed.

---

## 17. Minimal checklist

Before approving temporary or emergency access, verify:

- requester is named,
- scope is minimal,
- duration is explicit,
- approval is recorded,
- logging exists,
- expiry path is automatic where possible,
- post-use review owner is known,
- break-glass custody and rotation are documented.

---

## 18. See also

- `references/iam/identity-lifecycle-jml.md`
- `references/iam/sso-saml-oidc-hardening.md`
- `references/iam/service-account-inventory-and-ownership.md`
- `references/platform/high-trust-admin-workstations.md`
- `references/ops/incident-playbooks.md`
