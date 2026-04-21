---
title: "Machine Identity and Service Accounts"
slug: machine-identity-and-service-accounts
category: iam
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "NIST SP 800-207 Zero Trust Architecture — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf"
  - "AWS IAM best practices — https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html"
  - "Google Cloud IAM and service account guidance — https://cloud.google.com/iam/docs/best-practices-service-accounts"
  - "Microsoft Entra workload and application identity guidance — https://learn.microsoft.com/entra/workload-id/"
  - "SPIFFE / SPIRE documentation — https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/"
triggers_strong: ["machine identity", "service account sprawl", "non-human identity", "bot account", "service principal review"]
triggers_weak: ["service account", "automation identity", "application credentials"]
related: ["workload-identity-federation", "cloud-iam-hardening", "identity-lifecycle-jml", "github-actions-hardening"]
---

# Machine Identity and Service Accounts

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (inventory, unused credential detection, expiry checks, and key-age reporting partly automatable; ownership validation, exception review, and privilege justification manual)

Use this guide when reviewing **service accounts**, **service principals**, **bot users**, **application identities**, **integration accounts**, or any other **non-human identity**.

The goal is simple: every machine identity should have a clear owner, a narrow purpose, a short trust path, and no standing privilege beyond what the workload actually needs.

---

## 1. Why machine identity is a top-tier risk

Most environments now have more machine identities than human users.

That usually creates four recurring failures:

- long-lived API keys survive long after the app or job changed,
- shared service accounts hide accountability,
- automation roles silently grow into admin roles,
- nobody can quickly answer which machine identity owns which secret, token, or role.

A compromised machine identity is often better than a stolen user account for an attacker because it:

- runs unattended,
- is trusted by default,
- may bypass MFA,
- often has broad network or data access,
- is easy to leave active for a long time.

Treat non-human identities as first-class IAM subjects, not as implementation detail.

---

## 2. Core rule

Every machine identity must answer all of these questions:

1. **What exact workload or integration uses it?**
2. **Who owns it operationally?**
3. **What environment is it allowed to touch?**
4. **How does it authenticate?**
5. **What is the smallest permission set it needs?**
6. **How is it rotated, reviewed, and retired?**

If any answer is unknown, the identity is already under-governed.

---

## 3. Preferred hierarchy of trust

Prefer identity patterns in this order:

| Pattern | Preferred? | Why |
|---|---|---|
| Short-lived workload identity federation | Yes | removes stored secrets and narrows token lifetime |
| Managed identity / instance profile / workload-attached role | Yes | avoids user-managed keys and ties identity to runtime |
| Rotated service account credential in managed vault | Sometimes | acceptable when federation is not available |
| Static API key in CI variable or `.env` file | No by default | easy to leak, hard to govern, often copied widely |
| Shared bot credential across many systems | No | poor accountability and huge blast radius |

Use `workload-identity-federation.md` when the identity can be replaced with short-lived federation.

---

## 4. Types of machine identity

| Type | Example | Main risk |
|---|---|---|
| Runtime workload identity | pod, VM role, serverless function identity | excessive runtime privilege or east-west abuse |
| CI/CD identity | deploy role, artifact publishing role, IaC apply role | pipeline compromise becomes infrastructure compromise |
| Integration identity | SaaS-to-SaaS connector, webhook consumer, sync account | broad third-party data access and hard-to-see persistence |
| Bot user / automation user | ticketing bot, chatops bot, reporting account | drift into human-like broad access without review |
| Break-glass machine identity | emergency automation for restoration or rollback | overuse of highly privileged exceptional account |

Do not apply one policy to all of them. Their privilege and monitoring requirements differ.

---

## 5. Minimum inventory fields

Keep a registry for every machine identity with at least:

| Field | Why it matters |
|---|---|
| identity name / ID | unique tracking |
| identity type | runtime, CI, integration, bot, break-glass |
| owner team and backup owner | accountability |
| business purpose | justifies existence |
| environment scope | dev, staging, prod |
| auth method | federation, managed identity, key, certificate |
| credential location | vault path, provider-managed, none |
| creation date | lifecycle tracking |
| expiry or review date | prevents forgotten standing access |
| permissions / roles | privilege review |
| systems touched | blast radius and incident scoping |
| last used timestamp | stale identity detection |
| exception status | governance visibility |

If you cannot produce this inventory quickly, you do not have real machine identity governance.

---

## 6. Creation standards

Before creating a new service account or application identity, require:

- named owner,
- documented purpose,
- environment-specific scope,
- least-privilege role or policy,
- approved authentication method,
- review date,
- retirement trigger.

### 6.1 Naming rules

Prefer names that encode purpose and environment, for example:

- `svc-billing-export-prod`
- `gha-terraform-plan-staging`
- `bot-support-triage-readonly`

Avoid names like:

- `automation`
- `service-account`
- `prod-admin`
- `temp-bot`

A vague name becomes a vague ownership story later.

---

## 7. Authentication rules

### 7.1 Preferred defaults

- prefer short-lived federated credentials,
- prefer managed identities over downloadable keys,
- disable ad hoc key creation where the platform allows it,
- keep certificate-based auth inventory explicit and reviewed,
- avoid username/password style service accounts unless there is no better option.

### 7.2 If long-lived credentials still exist

Require:

- storage in a managed secret store,
- rotation schedule,
- narrow scope,
- access logging,
- no plaintext copies in repos, screenshots, notes, or ticket comments,
- immediate revocation path.

### 7.3 High-signal red flags

- one credential reused across multiple apps,
- service account password known by several humans,
- integration token copied into local `.env` files across laptops,
- service principal can create more credentials for itself,
- runtime identity also used interactively by operators.

---

## 8. Permission design

Machine identities should be **task-scoped**, not **platform-scoped**.

### 8.1 Good patterns

- artifact uploader can publish only to one repository path,
- billing sync can read the billing export and write only to its target queue,
- deployment identity can deploy one application in one environment,
- reporting bot can read selected cases but cannot change user roles.

### 8.2 Bad patterns

- `AdministratorAccess` because setup was easier,
- one service account for all environments,
- runtime app role can also manage IAM, secrets, and network policy,
- CI identity can deploy, rotate secrets, and modify branch protections.

### 8.3 Segmentation rules

Separate identities for:

- `dev` vs `staging` vs `prod`,
- `plan` vs `apply`,
- `read-only` vs `write`,
- `runtime` vs `operator` automation,
- `human support tooling` vs `backend batch processing`.

If compromise of one identity gives both data access and control-plane access, the design is too broad.

---

## 9. CI/CD and automation identities

CI identities are high-value because they often sit between source code and production.

Rules:

- use federated OIDC or equivalent where possible,
- separate test, build, publish, and deploy identities,
- never let untrusted PR execution inherit deploy credentials,
- keep package publishing identity separate from infrastructure deployment identity,
- make prod deployment identities environment-gated and approval-bound,
- clear credentials and caches on self-hosted runners.

Use `github-actions-hardening.md` and `workload-identity-federation.md` together for CI review.

---

## 10. Runtime workload identities

For pods, VMs, serverless functions, and applications:

- attach identity to the workload rather than embedding keys in config,
- scope network and secret access to the same trust boundary,
- keep one workload identity per service or tightly related service group,
- avoid using default service accounts for production workloads,
- rotate or redeploy when trust assumptions change.

### 10.1 Runtime review questions

- Can the workload read secrets it does not need?
- Can it call control-plane APIs?
- Can it impersonate another identity?
- Can it write to production data stores outside its business function?
- Can one compromised pod reuse the same identity across the whole namespace or cluster?

---

## 11. Third-party integrations and bots

Integration identities are often overlooked because they live in SaaS admin screens instead of cloud IAM.

Minimum expectations:

- register the vendor and business owner,
- document exact data classes the integration can access,
- prefer scoped OAuth app permissions over full admin keys,
- review webhook secrets and token rotation,
- remove unused integrations promptly,
- confirm whether the integration can export data, send email, or impersonate users.

High-risk integrations include:

- CRM and support syncs,
- HR and payroll connectors,
- ticketing or chat bots with broad workspace read access,
- AI tools with broad document access,
- backup and observability platforms with cross-system access.

---

## 12. Monitoring and review

At minimum, monitor for:

- new machine identities created,
- new credentials issued,
- unused identities still enabled,
- privilege increases,
- sign-in or token use from unexpected source context,
- access outside expected environment or time pattern,
- failed auth bursts on service accounts,
- attempts to create subordinate credentials or new trust bindings.

### 12.1 Review cadence

| Identity risk | Review minimum |
|---|---|
| prod admin-equivalent automation | monthly |
| prod write-capable service accounts | monthly or quarterly depending on blast radius |
| sensitive third-party integrations | quarterly |
| low-risk read-only non-prod identities | quarterly or semi-annually |
| dormant or exceptional identities | immediate review or removal |

Use `control-ownership-and-review-cadence.md` when formalizing ownership and overdue review handling.

---

## 13. Common failure modes

| Failure | Why it matters |
|---|---|
| same service account reused across multiple apps | compromise spreads laterally |
| one prod identity shared by CI and runtime | code path compromise becomes runtime compromise |
| long-lived keys copied into repo secrets and local laptops | leak surface multiplies |
| no owner for integration token | no one rotates or retires it |
| service account has no last-used visibility | stale access persists silently |
| machine identity can mint more credentials | self-escalation path |
| break-glass automation used for routine jobs | exception becomes baseline |

---

## 14. First 30 minutes after suspected machine identity compromise

1. Identify the exact identity and all aliases or linked credentials.
2. Determine auth method: token, key, certificate, federated trust, or managed identity.
3. Revoke or disable the identity and any downstream sessions if safe to do so.
4. Enumerate roles, groups, and systems the identity could reach.
5. Check recent activity for unusual regions, runners, branches, workloads, or APIs.
6. Rotate dependent secrets or credentials the identity could access.
7. Verify whether the attacker could create new credentials, tokens, or trust relationships.
8. Contain related automation jobs, workloads, or integrations until trust is re-established.

If the identity was used by CI or an AI-enabled automation path, also review source integrity and recent change history.

---

## 15. Review checklist

| Check | Expected |
|---|---|
| Each machine identity has an owner and purpose | Yes |
| Environments are separated | Yes |
| Auth method avoids long-lived shared secrets where possible | Yes |
| Roles are least privilege and task-scoped | Yes |
| Key creation is restricted or disabled when feasible | Yes |
| Last-used and review dates are visible | Yes |
| Stale identities are removed promptly | Yes |
| CI, runtime, and admin automation identities are separated | Yes |
| Sensitive integrations have vendor and data-class review | Yes |

---

## Resources

- `workload-identity-federation.md`
- `cloud-iam-hardening.md`
- `identity-lifecycle-jml.md`
- `github-actions-hardening.md`
