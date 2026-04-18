---
title: "Identity Lifecycle: Joiner, Mover, Leaver"
slug: identity-lifecycle-jml
category: iam
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-18
sources:
  - "NIST SP 800-63 and IAM lifecycle guidance"
  - "Microsoft Entra provisioning and access review guidance"
  - "CIS Controls access management practices"
triggers_strong: ["joiner mover leaver", "identity lifecycle", "offboarding", "access review", "jml"]
triggers_weak: ["user lifecycle", "access provisioning", "offboarding review"]
related: ["authorization-rbac", "sso-saml-oidc-hardening", "session-management", "workload-identity-federation", "active-directory-hardening"]
---

# Identity Lifecycle: Joiner, Mover, Leaver

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (provisioning, deprovisioning, dormant-account checks, and some access reviews automatable; exception handling, entitlement design, and emergency ownership review manual)

Use this guide when managing how humans gain, change, and lose access across applications, infrastructure, SaaS tools, support systems, and administrative environments.

This is the operational layer that answers:

- who should get access,
- when they should get it,
- how long they keep it,
- what must change when roles change,
- how quickly access disappears when someone leaves or becomes high-risk.

A strong login stack with weak lifecycle governance is still weak IAM.

---

## 1. Why JML matters

Most real IAM failures come from lifecycle gaps, not cryptography failures.

Typical problems:

- new hires inherit broad default access,
- contractors keep access after the engagement ends,
- internal transfers accumulate permissions without cleanup,
- dormant accounts stay active,
- emergency admin access becomes permanent,
- shared or shadow accounts survive outside the normal process.

JML exists to keep access aligned with current role and current business need.

---

## 2. Core rule

Identity lifecycle decisions should always answer five questions:

1. What business role is this identity tied to?
2. What systems and entitlements are required for that role?
3. Who approved that access?
4. When does the access expire or need review?
5. What event removes or changes the access?

If any answer is unknown, the access path is too informal.

---

## 3. Identity types in scope

| Identity type | Examples | Lifecycle concern |
|---|---|---|
| Workforce user | employee, intern, operator | onboarding, transfers, termination, privileged separation |
| Contractor / vendor user | outsourced support, consultant, agency account | time-bounded access, sponsor ownership, fast revocation |
| Privileged user | cloud admin, finance admin, security admin | stronger approval, JIT or step-up, separate account model |
| Shared service identity linked to people | team mailbox, support console fallback | ownership, approvals, audit trail, reduction over time |
| Break-glass human account | emergency-only admin access | strong custody, explicit testing, exceptional use only |

This guide is for human-linked identities. Use `workload-identity-federation.md` for machine identities.

---

## 4. Joiner controls

A joiner flow should provision access from a role model, not from ad hoc requests.

### 4.1 Minimum joiner inputs

Before access is created, you should know:

- legal identity or HR-approved person record,
- worker type: employee, contractor, vendor, temp,
- manager or sponsor,
- role or job family,
- start date,
- department and location where relevant,
- whether privileged access is actually needed,
- end date if non-permanent.

### 4.2 Good joiner defaults

- Create one standard workforce identity for daily work.
- Provision only baseline apps required for the role.
- Keep admin access separate from daily-use identity.
- Require stronger review for production, finance, HR, legal, or customer-data access.
- Set end dates for contractor and temporary access by default.

### 4.3 Red flags

- broad access based on department alone,
- local admin or cloud admin granted on day one without justification,
- no sponsor for contractors,
- no expiration on temporary access,
- no initial MFA or phishing-resistant auth requirement for sensitive roles.

---

## 5. Mover controls

Movers are where entitlement creep usually happens.

### 5.1 Trigger events

Mover review should happen on:

- department change,
- manager change for sensitive roles,
- promotion to privileged function,
- transfer between business units,
- move from contractor to employee or vice versa,
- environment access change such as dev to prod eligibility.

### 5.2 Core mover rule

Do not only add new access. Compare old role versus new role and remove what is no longer needed.

### 5.3 What to review during a move

| Review area | Expected question |
|---|---|
| Core apps | does the new role still need the old app set? |
| Group memberships | which groups should be removed now? |
| Admin roles | should elevated roles be removed, narrowed, or converted to JIT? |
| Data access | does the user still need access to old-team customer or employee data? |
| Local exceptions | are there ticket-based grants that should expire now? |
| Devices and browser contexts | does privileged segregation still match the new role? |

Mover processes fail when the old access is invisible or too annoying to remove.

---

## 6. Leaver controls

Leaver controls are about speed, completeness, and evidence.

### 6.1 Trigger events

Leaver flow should trigger on:

- employment termination,
- contract end,
- immediate suspension for risk or investigation,
- role conversion where old identity must be retired,
- vendor disengagement.

### 6.2 Minimum leaver actions

1. disable primary authentication path,
2. revoke active sessions and refresh tokens,
3. remove or suspend federated access,
4. disable privileged accounts and shared-access paths linked to the person,
5. transfer ownership of data, tickets, repos, alerts, and automation where needed,
6. recover or rotate credentials the person could still know,
7. record completion evidence.

### 6.3 What people often forget

- personal access tokens,
- cloud CLI sessions,
- local VPN or device certificates,
- API keys generated in SaaS tools,
- emergency admin groups,
- support impersonation privileges,
- SSH keys and signing keys,
- ownership of scheduled jobs, pages, dashboards, and alert routes.

The visible SSO account is rarely the whole picture.

---

## 7. Suspensions and high-risk users

Not every lifecycle event is a normal offboarding.

For urgent cases such as suspected compromise, insider risk, or fraud investigation:

- suspend access quickly,
- revoke sessions before debating every downstream cleanup detail,
- preserve evidence of current entitlements,
- restrict access to HR, legal, security, and case systems appropriately,
- separate containment from final deletion of accounts or evidence.

A high-risk suspension path must be faster than the standard HR offboarding path.

---

## 8. Dormant accounts and orphaned access

A mature JML program actively looks for access that no longer matches a real need.

### 8.1 Common stale-access categories

- accounts with no recent logon,
- contractors past end date,
- disabled HR record but active SaaS account,
- former admins still in privileged groups,
- tool-specific local accounts bypassing SSO,
- shared accounts with no clear owner,
- distribution lists or support roles with departed members.

### 8.2 Minimum review cadence

| Access type | Review cadence |
|---|---|
| Privileged admin access | monthly or quarterly depending on blast radius |
| Contractor and vendor access | monthly |
| Sensitive business apps | quarterly |
| General workforce entitlements | quarterly or semiannual |
| Break-glass accounts | every test cycle and at least quarterly |

If access review happens once a year in a high-change environment, it is probably too slow.

---

## 9. Access review design

A good access review asks reviewers to make real decisions, not click approve on giant entitlement lists.

Expected design:

- show user, role, manager/sponsor, last use, and business context,
- separate privileged access from baseline access,
- highlight end dates and dormant activity,
- make removal as easy as approval,
- track reviewer identity and timestamps,
- escalate non-responses.

Bad design:

- one giant CSV with no context,
- review assigned to someone who does not know the user,
- approvals that do not trigger actual removal for rejected entitlements.

---

## 10. Temporary and exceptional access

Some access should expire by design.

Examples:

- incident response access,
- production support elevation,
- migration-related admin rights,
- third-party troubleshooting access,
- emergency finance or payroll operations.

Rules:

- use explicit start and end time,
- require named owner and justification,
- prefer JIT or activation-based elevation,
- log activation and use,
- review any extension instead of silently renewing it.

Temporary access that never expires becomes permanent risk.

---

## 11. Shared and shadow accounts

Reduce these aggressively.

### 11.1 Shared accounts

If a shared account exists:

- document why it still exists,
- assign an accountable owner,
- restrict where it can be used,
- minimize its privileges,
- rotate credentials after personnel changes,
- log use and prefer check-out style access where possible.

### 11.2 Shadow local accounts

These include:

- local app admin users outside SSO,
- forgotten bootstrap accounts,
- vendor-created fallback accounts,
- default appliance credentials not retired.

A strong IdP does not help if shadow access paths remain invisible.

---

## 12. First 30 minutes of a JML review

1. Identify authoritative identity sources: HR, vendor register, directory, IdP.
2. Map core role types and privileged role types.
3. Check how joiners get baseline versus privileged access.
4. Check one mover example for entitlement cleanup.
5. Check one leaver example for session revocation and downstream removal.
6. Look for dormant, shadow, and contractor accounts.
7. Record where approvals, expirations, and evidence are missing.

That first pass usually shows whether lifecycle is role-based or just ticket-based improvisation.

---

## 13. Common red flags

| Red flag | Why it matters |
|---|---|
| contractors have no sponsor or end date | likely stale access |
| movers only gain permissions and never lose them | entitlement creep |
| offboarding disables SSO but not sessions, tokens, or local accounts | incomplete revocation |
| privileged access rides on the daily-use account | higher phishing and lateral-movement risk |
| shared accounts persist after staff changes | weak accountability |
| access reviews have no last-used or business context | reviewers rubber-stamp |
| emergency access is permanent | break-glass becomes standing privilege |

---

## 14. Minimum checklist

| Check | Expected |
|---|---|
| Joiners receive role-based baseline access rather than broad default access | Yes |
| Contractors and temporary users have sponsor and end date | Yes |
| Movers trigger entitlement comparison and old-access cleanup | Yes |
| Leavers lose sessions, tokens, federated access, and downstream access quickly | Yes |
| Privileged access is separate, reviewed, and preferably time-bounded | Yes |
| Dormant and orphaned accounts are reviewed on a defined cadence | Yes |
| Shared and shadow accounts are minimized and owned | Yes |
| Access reviews are contextual and produce real removals | Yes |

---

## 15. Related references

- `authorization-rbac.md`
- `sso-saml-oidc-hardening.md`
- `session-management.md`
- `workload-identity-federation.md`
- `active-directory-hardening.md`
