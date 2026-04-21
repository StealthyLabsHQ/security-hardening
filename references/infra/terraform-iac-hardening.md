---
title: "Terraform & IaC Hardening"
slug: terraform-iac-hardening
category: infra
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "Terraform documentation — https://developer.hashicorp.com/terraform/docs"
  - "OpenTofu documentation — https://opentofu.org/docs/"
  - "CIS Benchmarks — https://www.cisecurity.org/cis-benchmarks"
  - "NIST SP 800-53 Rev.5 — https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final"
  - "CycloneDX SBOM — https://cyclonedx.org/specification/overview/"
  - "SPDX SBOM — https://spdx.dev/specifications/"
triggers_strong: ["terraform hardening", "iac security", "state file security", "terraform review", "opentofu security"]
triggers_weak: ["terraform", "iac review", "cloud misconfig"]
related: ["cloud-iam-hardening", "container-k8s-hardening", "supply-chain-security"]
---

# Terraform & IaC Hardening

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (fmt/validate, policy-as-code, secret scans, and drift checks automatable; least-privilege design, module trust, and exception handling manual)

Use this guide when reviewing or building **Terraform**, **OpenTofu**, cloud infrastructure-as-code repositories, or CI pipelines that run `plan` / `apply`.

IaC is production control plane code. A bad merge can create public storage, widen IAM trust, disable logging, or leak secrets through state long before anyone notices in runtime monitoring.

---

## 1. Default Stance

Start with these defaults:

- Separate `plan` and `apply` identities.
- Store remote state in encrypted, access-controlled backends.
- Assume state is sensitive and may contain secrets or secret-adjacent values.
- Pin provider and module versions.
- Use short-lived CI credentials via OIDC where possible.
- Treat `terraform destroy`, force replacement, and privilege-bearing changes as human-approved operations.
- Validate with policy-as-code before apply.

---

## 2. High-Risk Failure Modes

| Failure mode | Example | Impact |
|--------------|---------|--------|
| Sensitive state exposure | state backend readable by too many principals | Secret leakage, topology exposure |
| Over-broad IAM | wildcard principals, admin roles, broad trust policy | Privilege escalation |
| Public exposure by default | storage bucket, database, queue, or service accidentally public | Data exposure |
| Drift hidden from review | console-side changes not detected | False trust in code vs reality |
| Unreviewed module/provider changes | floating versions | Supply-chain compromise or surprise behavior |
| CI over-privilege | apply role used for plan, read-only checks, and prod changes | Pipeline compromise leads to cloud compromise |
| Secret injection into variables | secrets stored in `tfvars`, repo, or outputs | Long-lived secret disclosure |

---

## 3. State Security

Terraform state often contains:

- resource identifiers,
- internal hostnames and network topology,
- generated passwords or connection data,
- rendered templates and interpolated values,
- outputs consumed by later systems.

Controls:

- use remote state, not local workstation state for shared environments,
- enable backend encryption at rest,
- restrict backend read access to the minimum set of humans and automation,
- enable versioning and recovery for the state store,
- log access to state buckets, tables, or services,
- avoid storing secrets in outputs unless truly necessary,
- do not commit `terraform.tfstate`, backup files, or `.terraform/`.

Review questions:

- Who can read state?
- Who can mutate or lock state?
- Are dev and prod states separated?
- Are backend credentials short-lived?
- Are sensitive outputs marked `sensitive = true` and avoided in logs?

---

## 4. Provider and Module Pinning

Pin both providers and modules to reviewed versions.

Recommended patterns:

```hcl
terraform {
  required_version = ">= 1.8.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.46"
    }
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.8.1"
}
```

Avoid:

- unpinned git module refs,
- broad provider constraints with no review process,
- auto-upgrading modules in prod without plan review,
- private modules with weak access control or no provenance.

If using git sources, pin immutable commit SHAs or signed tags where possible.

---

## 5. Secrets and Variables

Rules:

- do not store secrets in `.tfvars` committed to git,
- do not pass secrets through plaintext CI logs,
- do not output secrets unless unavoidable,
- prefer secret managers over in-code secret material.

Common leaks:

- `terraform.tfvars` committed with credentials,
- CI logs printing plan output with sensitive data,
- variables injected from insecure repo secrets instead of short-lived identity,
- module outputs exposing passwords or tokens to downstream jobs.

Safer patterns:

- fetch secrets at runtime from cloud secret manager,
- use OIDC to avoid static cloud keys,
- mark outputs as sensitive when they must exist,
- keep secrets outside plans reviewed by broad engineering audiences.

---

## 6. Identity and Separation of Duties

Separate roles by purpose.

Minimum split:

| Role | Typical permissions |
|------|---------------------|
| Formatter / validation job | no cloud write access |
| Plan job | read-only or narrowly scoped diff permissions |
| Apply job | environment-scoped write permissions |
| Break-glass operator | time-bound elevated access |

Review questions:

- Can every CI branch assume the apply role?
- Is the prod role different from dev/staging?
- Does the plan job really need write access?
- Are manual approvals required before prod apply?
- Are trust policies tied to protected refs or environments?

---

## 7. Resource Patterns to Review Aggressively

### Network exposure

Look for:

- `0.0.0.0/0` or `::/0` on admin ports,
- public load balancers in front of internal services,
- unrestricted egress from sensitive workloads,
- permissive Kubernetes or security-group rules.

### Storage exposure

Look for:

- public object storage,
- disabled encryption,
- missing bucket policies blocking public ACLs,
- missing versioning or access logging.

### IAM and trust

Look for:

- wildcard actions or resources,
- broad `sts:AssumeRole` trust,
- OIDC subject patterns that trust too many branches/repos,
- admin policies attached where task-specific roles would suffice.

### Monitoring and resilience

Look for:

- logging disabled on critical services,
- no alerting on admin activity,
- no deletion protection on critical resources,
- no backup or retention settings for stateful systems.

---

## 8. Policy-as-Code and Validation Pipeline

Minimum pipeline for IaC changes:

1. `fmt`
2. `validate`
3. lint / static checks
4. policy-as-code
5. plan generation
6. human review for risky deltas
7. apply in controlled context

Useful controls:

- `terraform fmt -check`
- `terraform validate`
- `tflint`
- `tfsec`, `Checkov`, or equivalent policy checks
- custom OPA / Conftest / Sentinel policies
- drift detection jobs on schedule

High-value policy checks:

- no public storage without explicit exemption,
- encryption required,
- required tags / ownership metadata present,
- no wildcard IAM on privileged services,
- OIDC trust restricted to approved repos/refs,
- production resources must enable logs and backups.

---

## 9. Plan Review Heuristics

During code review, classify changes into four buckets:

| Bucket | Examples | Review depth |
|--------|----------|--------------|
| Identity | IAM roles, policies, trust docs, service accounts | Highest |
| Exposure | ingress, public endpoints, firewall, SG rules, DNS | Highest |
| Statefulness | databases, queues, buckets, keys, secrets | High |
| Hygiene | tags, naming, minor refactors | Medium |

Escalate when the plan shows:

- resource replacement for stateful systems,
- widened trust or network access,
- disabled logging, encryption, backup, or retention,
- destroy actions on production resources,
- moved state or backend changes,
- provider/module version jumps with broad blast radius.

---

## 10. Drift and Runtime Verification

IaC review is incomplete if runtime drift is ignored.

Recommended practices:

- run scheduled drift detection on critical environments,
- alert on manual console changes,
- reconcile cloud runtime settings against code and policy,
- review import/move operations carefully because they can hide unauthorized changes,
- document exceptions where runtime must differ from code.

If a control exists only in Terraform code but not in the deployed environment, treat it as missing.

---

## 11. Fast Review Checklist

| Check | Expected |
|-------|----------|
| Remote state backend is encrypted and access-controlled | Yes |
| State files and `.tfvars` are not committed | Yes |
| Providers and modules are pinned | Yes |
| Plan and apply identities are separated | Yes |
| OIDC or short-lived credentials used for CI | Yes |
| Public exposure changes are explicit and justified | Yes |
| IAM trust and permissions are least-privilege | Yes |
| Logging, encryption, and backups are enabled where relevant | Yes |
| Policy-as-code blocks known-bad patterns before apply | Yes |
| Prod applies require protected ref or human approval | Yes |

---

## 12. High-Signal Findings to Report First

1. State backend readable by too many principals.
2. Broad OIDC or role trust allowing unintended branches/repos.
3. Wildcard IAM on privileged resources.
4. Public exposure of storage, admin paths, or internal services.
5. Unpinned providers/modules or risky upgrades with no review gate.
6. Apply permissions available in low-trust CI contexts.
7. Missing logs, encryption, or backup on critical stateful resources.

Lead with exploitable path, affected environment, and smallest safe fix.

---

## 13. Related References

- `cloud-iam-hardening.md`
- `container-k8s-hardening.md`
- `supply-chain-security.md`
- `vuln-management.md`
