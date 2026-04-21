---
title: "Workload Identity Federation"
slug: workload-identity-federation
category: iam
depth: 2
audit_level: [3, 4]
last_reviewed: 2026-04-21
sources:
  - "AWS IAM OIDC federation guidance — https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html"
  - "Google Cloud Workload Identity Federation — https://cloud.google.com/iam/docs/workload-identity-federation"
  - "Microsoft Entra workload identity federation — https://learn.microsoft.com/entra/workload-id/workload-identity-federation"
  - "SPIFFE / SPIRE — https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/"
triggers_strong: ["workload identity", "oidc federation", "github actions oidc", "machine identity", "service account federation"]
triggers_weak: ["machine identity", "federation review", "ci identity"]
related: ["cloud-iam-hardening", "github-actions-hardening", "terraform-iac-hardening", "active-directory-hardening"]
---

# Workload Identity Federation

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 3-4 | Automation: Partial (claim matching, role inventory, and drift checks automatable; trust-boundary review, exception approval, and emergency access governance manual)

Use this guide when CI/CD jobs, Kubernetes workloads, serverless functions, or external compute need access to cloud or API resources **without long-lived secrets**.

The goal is simple: the workload proves who it is using a short-lived identity assertion, and the target platform grants only the exact role it needs for a short window.

---

## 1. Why this matters

Static access keys in CI, build runners, and application configs create three recurring failures:

- secrets leak in repos, logs, or artifacts,
- permissions outlive the job or workload that needed them,
- nobody knows which machine identity still exists or who owns it.

Workload identity federation reduces that blast radius by replacing persistent credentials with:

- a trusted issuer,
- narrow claim matching,
- short-lived tokens,
- explicit mapping to a least-privilege role.

This is one of the highest-ROI IAM improvements for modern delivery pipelines.

---

## 2. Recommended defaults

Use these defaults unless you have a strong reason not to:

- Prefer **short-lived federated tokens** over stored API keys.
- Bind access to **issuer + audience + subject + repository/workload identity claims**, not just issuer alone.
- Separate identities for **dev, staging, and prod**.
- Separate identities for **plan, apply, deploy, and admin** actions.
- Give each federated role a named **owner** and business purpose.
- Keep session duration as short as the workflow allows.
- Disable or tightly restrict fallback key creation for the target service account or role.
- Make break-glass access explicit and temporary, not the normal path.

If a team cannot explain why a machine identity exists, it should not exist.

---

## 3. Federation trust model

A federated workload flow usually looks like this:

1. A workload authenticates to a trusted issuer.
2. The issuer produces a signed assertion or token.
3. The target platform validates issuer, audience, subject, and selected claims.
4. The platform exchanges that assertion for short-lived credentials bound to a target role.
5. The workload uses those temporary credentials for a narrow task.

### 3.1 Core objects

| Object | What it is | Security question |
|---|---|---|
| Issuer | system that vouches for the workload | Is it trusted and correctly pinned? |
| Subject / principal | the workload identity asserted by the issuer | Is it specific enough to one repo, service account, or workload? |
| Audience | intended recipient of the token | Is it restricted to the right platform or app? |
| Target role / service account | permission set granted after federation | Is it least privilege and environment-scoped? |
| Session | short-lived credentials after exchange | Is lifetime short and logged? |

### 3.2 Strong design rule

The assertion should answer: **which workload, from which trust boundary, for which action, in which environment**.

If your trust mapping cannot answer all four, it is too broad.

---

## 4. High-signal failure modes

These are the mistakes that matter most in reviews:

### 4.1 Broad subject matching

Bad patterns:

- any branch in any repo can assume prod role,
- any workflow in an organization can deploy,
- wildcard subject patterns include test or forked contexts.

Safer stance:

- bind to one repository,
- bind to one branch, tag, or approved environment when possible,
- bind to one reusable workflow or deployment workflow for sensitive actions.

### 4.2 Shared machine identities

Bad patterns:

- one cloud role used by many repos and environments,
- one Kubernetes service account reused across unrelated workloads,
- one service principal powering both CI and runtime.

Safer stance:

- one identity per workload or tightly related workload group,
- separate build identities from runtime identities,
- separate read-only automation from deployment automation.

### 4.3 Long session duration

Bad patterns:

- tokens valid for hours beyond job completion,
- credentials cached on runners,
- no cleanup on self-hosted runners.

Safer stance:

- shortest viable session duration,
- ephemeral runners for sensitive jobs,
- clear post-job cleanup for caches and credential files.

### 4.4 Federation with admin-equivalent roles

Bad patterns:

- CI gets organization-wide admin,
- deployment role can also manage IAM or billing,
- workload role can mint new credentials for itself.

Safer stance:

- narrowly scoped resource permissions,
- no privilege escalation permissions unless absolutely required,
- separate admin break-glass role with stronger approval.

---

## 5. GitHub Actions OIDC

GitHub Actions is a common first federation target because it removes the need to store cloud keys in repository secrets.

### 5.1 What to bind on

For sensitive roles, evaluate at least:

- repository,
- ref or environment,
- workflow or reusable workflow identity,
- audience,
- event type,
- whether the job runs on trusted runners.

### 5.2 Claim review checklist

| Claim / signal | Why it matters |
|---|---|
| `repository` | prevents unrelated repos from reusing the role |
| `ref` | distinguishes main from feature branches |
| `environment` | supports prod-only approval flow |
| `job_workflow_ref` | constrains privileged access to the intended workflow definition |
| `aud` | prevents token reuse for another consumer |
| event context | helps reject risky flows such as untrusted forks |

### 5.3 AWS-style trust example

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:ORG/REPO:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

This is still only a starting point. For prod-sensitive roles, tighten further with environment or workflow-specific conditions if your platform supports them.

### 5.4 Red flags

- prod role trusted by all branches,
- `pull_request` and deployment role mixed together,
- self-hosted runner with persistent disk and no cleanup,
- one federated role used for both Terraform plan and apply.

---

## 6. Cloud platform patterns

### 6.1 AWS

Use OIDC federation for CI and prefer workload roles for compute.

Key expectations:

- use `AssumeRoleWithWebIdentity` for OIDC-backed flows,
- scope trust policies with exact conditions,
- keep target role permissions resource-specific,
- restrict `iam:PassRole`, `sts:AssumeRole`, and secret access tightly,
- monitor role assumption events in CloudTrail.

### 6.2 GCP

Use Workload Identity Federation or managed workload identity features instead of long-lived service account keys.

Key expectations:

- map external attributes carefully,
- avoid broad `principalSet` bindings without repository or workload constraints,
- disable service account key creation where possible,
- separate read-only service accounts from deployment service accounts,
- review who can impersonate service accounts.

### 6.3 Azure

Use federated credentials on service principals or managed identities where appropriate.

Key expectations:

- bind federated credentials to exact issuer, subject, and audience values,
- keep app registrations and service principals ownership clear,
- separate workload identities from operator/admin roles,
- restrict who can add federated credentials or grant admin consent.

---

## 7. Kubernetes and runtime workloads

Workload identity federation is not just for CI.

Use it for:

- Kubernetes service accounts mapped to cloud roles,
- runtime services calling secrets managers or cloud APIs,
- serverless functions accessing narrow resource sets,
- internal service-to-service auth when backed by strong workload identity.

### 7.1 Kubernetes rules

- one service account per workload or privilege boundary,
- avoid default service account usage,
- disable automatic token mount where it is not needed,
- keep namespace boundaries aligned with trust boundaries,
- do not let a pod identity reach unrelated data stores just because the cluster allows it.

### 7.2 Runtime identity review questions

| Question | Expected answer |
|---|---|
| Which workload uses this identity? | one named service / job |
| Which environment? | explicit dev / staging / prod separation |
| Which resources can it access? | narrow list, not broad wildcard |
| Can it create or mint more credentials? | ideally no |
| How is it revoked? | clear mapping and rollback path |

---

## 8. Ownership and lifecycle

Every workload identity should have:

- named owner,
- purpose statement,
- target resources,
- environment scope,
- approval path for privilege change,
- review cadence,
- emergency revoke method.

A good inventory row looks like this:

| Identity | Issuer | Workload | Environment | Target role | Owner | Review cadence |
|---|---|---|---|---|---|---|
| `gha-repo-x-plan` | GitHub Actions OIDC | Terraform plan workflow | prod | read-only infra plan role | Platform team | quarterly |
| `payments-api-runtime` | Kubernetes workload identity | payments API pods | prod | read access to one secrets path and one queue | Payments owner | quarterly |

If you cannot fill this table, the machine identity program is not mature enough.

---

## 9. Detection and monitoring

Monitor for:

- unexpected issuers,
- assumption of privileged roles from new repos or branches,
- role assumptions outside expected hours or runners,
- sudden spikes in token exchange or service account impersonation,
- changes to trust policies or federated credential objects,
- fallback creation of long-lived keys.

High-value detections include:

- new service account keys created after federation rollout,
- prod deploy role assumed from non-deploy workflow,
- broad wildcard subject added to trust policy,
- workload identity used from an unexpected namespace or service account.

---

## 10. First 30 minutes of a federation review

1. List all federated roles, service principals, and workload identities.
2. Group them by environment and owner.
3. Sample one CI role and one runtime role.
4. Check exact trust conditions and target permissions.
5. Confirm there is no long-lived fallback secret still in use.
6. Verify logging exists for token exchange and privileged actions.
7. Record any role that is shared across unrelated repos, services, or environments.

Most serious issues show up in that first sample.

---

## 11. Minimum checklist

| Check | Expected |
|---|---|
| No long-lived cloud keys in CI for workloads that support federation | Yes |
| Trust mapping binds issuer, audience, and specific workload claims | Yes |
| Dev, staging, and prod identities are separated | Yes |
| Plan, apply, and deploy roles are separated for sensitive infrastructure | Yes |
| Each machine identity has a named owner and review cadence | Yes |
| Privileged roles are not assumable from untrusted branches or forks | Yes |
| Runtime workloads avoid default or shared service accounts | Yes |
| Token exchange and privileged use are logged and reviewable | Yes |

---

## 12. Related references

- `cloud-iam-hardening.md`
- `github-actions-hardening.md`
- `terraform-iac-hardening.md`
- `active-directory-hardening.md`
