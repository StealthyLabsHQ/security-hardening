---
title: "Terraform Policy as Code Recipes"
slug: terraform-policy-as-code-recipes
category: infra
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-19
sources:
  - "Terraform documentation"
  - "OpenTofu documentation"
  - "OPA / Conftest documentation"
  - "Checkov policy authoring guidance"
  - "Kyverno and admission-control policy patterns"
triggers_strong: ["terraform policy as code", "conftest terraform", "opa terraform policy", "iac policy recipes", "terraform guardrail rules"]
triggers_weak: ["policy as code", "terraform policy", "iac guardrails"]
related: ["terraform-iac-hardening", "cloud-container-runnable-hardening-tests", "policy-exception-handling", "github-actions-hardening", "workload-identity-federation"]
---

# Terraform Policy as Code Recipes

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 2-4 | Automation: High (plan JSON export, policy evaluation, CI gates, and exception metadata checks highly automatable; blast-radius judgment, waiver approval, and business-risk acceptance manual)

Use this guide when a team already runs Terraform or OpenTofu, but needs **organization-specific policy checks** that go beyond generic scanners.

This file is for the moment where teams say:

- "scanner output is too generic,"
- "we need rules for our trust model,"
- "we want CI to reject unsafe plans before apply,"
- "we need a repeatable way to express exceptions without deleting guardrails."

---

## 1. Core rule

Policy as code should encode the **non-negotiable decisions** that reviewers otherwise repeat manually:

1. which trust relationships are forbidden,
2. which environments require stronger approval boundaries,
3. which resource patterns must never ship,
4. which exceptions are allowed and how they expire.

If a critical Terraform rule depends only on memory or reviewer discipline, it will drift.

---

## 2. What policy as code is best at

Use it for rules that are:

- objective,
- testable from plan or config data,
- repeated across many repositories,
- expensive to check manually,
- dangerous when missed once.

Good policy targets:

- prod deploy trust limited to protected refs,
- no public storage by default,
- no wildcard IAM privileges,
- no world-open admin ports,
- mandatory encryption and logging on critical resources,
- no prod apply from pull request contexts,
- no long-lived cloud credentials in CI.

Bad policy targets:

- whether a business justification is persuasive,
- whether a new vendor is strategically acceptable,
- whether a broad but technically valid role is still too risky in context,
- whether an exception should be approved.

Use code for mechanical enforcement, then review exceptions and tradeoffs manually.

---

## 3. Where to evaluate policy

You usually need two layers.

### 3.1 Configuration-level checks

Run on source files before plan generation.

Useful for:

- required version pinning,
- banned module sources,
- unsafe defaults in known blocks,
- missing backend or encryption settings.

### 3.2 Plan-level checks

Run against `terraform show -json` output.

Useful for:

- effective IAM policy contents,
- final network exposure,
- trust conditions after interpolation,
- resource deltas that matter only after planning,
- delete or replace actions.

When in doubt, prefer plan evaluation for security-significant decisions because it reflects the rendered change, not just the author’s source intent.

---

## 4. Minimal pipeline pattern

A practical baseline:

1. `terraform fmt -check`
2. `terraform validate`
3. scanner pass such as Checkov or Trivy config
4. custom policy pack via Conftest or equivalent
5. human review for risky deltas
6. controlled apply context

Example flow:

```bash
terraform init -backend=false
terraform fmt -check
terraform validate
terraform plan -out tfplan.bin
terraform show -json tfplan.bin > tfplan.json
conftest test tfplan.json -p policy/
```

If policy runs only after merge or only on production apply, the feedback loop is too late.

---

## 5. Design rules for useful Terraform policy packs

### 5.1 Keep policy statements small

One rule should answer one clear question.

Prefer:

- "prod roles must require exact GitHub OIDC subject scoping"
- "S3 buckets must block public access"
- "security groups must not expose SSH to the world"

Avoid giant rules that combine unrelated concerns.

### 5.2 Separate baseline rules from organization overlays

Use layers such as:

- generic cloud hygiene,
- environment-specific trust rules,
- crown-jewel or regulated-data overlays.

This keeps rule packs reusable without weakening high-risk systems.

### 5.3 Write violation text for humans

The error should explain:

- what resource failed,
- what rule was violated,
- what safer pattern is expected.

Weak message:

- `deny[3]`

Strong message:

- `prod-deploy role allows GitHub OIDC subject wildcard and must be restricted to protected branch or environment`

### 5.4 Plan for exceptions explicitly

Do not force teams to comment out policies. Pair policy packs with exception metadata and expiry review using `policy-exception-handling`.

---

## 6. Recipes worth encoding first

### 6.1 GitHub OIDC trust must be narrowly scoped

High-risk failure:

- trusting any branch,
- trusting forks,
- trusting an entire org or repo set,
- using static secrets instead of OIDC.

Example Rego pattern:

```rego
package terraform.oidc

deny[msg] {
  rc := input.resource_changes[_]
  rc.type == "aws_iam_role"
  policy := json.unmarshal(rc.change.after.assume_role_policy)
  stmt := policy.Statement[_]
  stmt.Action == "sts:AssumeRoleWithWebIdentity"
  not stmt.Condition.StringEquals["token.actions.githubusercontent.com:sub"]
  msg := sprintf("%s is missing exact GitHub OIDC subject scoping", [rc.address])
}
```

Tighten further when possible by checking:

- exact repository,
- protected branch,
- protected environment,
- expected audience.

### 6.2 No wildcard administrative IAM permissions

High-risk failure:

- `Action: "*"`,
- `Resource: "*"`,
- broad assume-role chains,
- admin managed policy used where task-specific roles are possible.

Example:

```rego
package terraform.iam

deny[msg] {
  rc := input.resource_changes[_]
  rc.type == "aws_iam_policy"
  policy := json.unmarshal(rc.change.after.policy)
  stmt := policy.Statement[_]
  stmt.Effect == "Allow"
  stmt.Action == "*"
  msg := sprintf("%s grants wildcard actions", [rc.address])
}
```

Add organization-specific allowlists only when the exception path is documented and bounded.

### 6.3 Public storage must be blocked by default

Fail when:

- public ACLs are permitted,
- public access block is absent,
- encryption is missing,
- logging or versioning is absent where required.

This is often better expressed as a rule pack than as a repeated review comment.

### 6.4 World-open admin ports must fail

Flag:

- SSH,
- RDP,
- database admin ports,
- Kubernetes control-plane surfaces,
- internal admin panels.

Example logic:

- if CIDR is `0.0.0.0/0` or `::/0` on a management port, fail,
- unless a short-lived, approved exception exists.

### 6.5 Plan and apply identities must be separated

High-risk failure:

- one CI role used for formatting, planning, and prod apply,
- pull requests able to assume prod write roles,
- plan identity able to mutate infrastructure.

Useful policy checks:

- prod apply role only from protected environment,
- plan role lacks write privileges,
- repository or workflow claims match expected deployment path.

### 6.6 Mandatory logging and deletion protection on critical resources

For crown-jewel systems, fail when:

- audit logging is disabled,
- bucket or database logging is absent where expected,
- deletion protection is off,
- backups or retention settings are missing.

Policy is especially useful here because these regressions are often accidental.

---

## 7. Environment-aware policy patterns

Do not apply the same strictness everywhere if it creates exception fatigue.

Recommended tiers:

| Environment | Typical policy stance |
|---|---|
| Dev sandbox | moderate defaults, fewer hard fails, still no catastrophic trust or public exposure |
| Shared staging | stronger logging, tighter IAM and network checks |
| Production | strict fails on trust, exposure, encryption, delete, and approval-sensitive changes |
| Crown-jewel prod | strict baseline plus extra approval and monitoring rules |

Use environment metadata or workspace naming carefully. Do not rely on inconsistent tags alone.

---

## 8. Guarding dangerous plan actions

Some changes deserve extra policy attention even when technically valid.

Examples:

- `delete` on critical resources,
- force replacement of IAM, KMS, or network objects,
- widening role trust conditions,
- disabling encryption or logging,
- moving data stores to public exposure,
- removing policy attachments that were acting as guardrails.

Useful pattern:

- run policy on `terraform show -json`,
- inspect action types,
- require explicit approval or separate pipeline for dangerous actions.

Example concept:

```rego
package terraform.plan_actions

deny[msg] {
  rc := input.resource_changes[_]
  rc.change.actions[_] == "delete"
  startswith(rc.type, "aws_db_")
  msg := sprintf("%s deletes a database resource and requires explicit review", [rc.address])
}
```

---

## 9. Handling exceptions without disabling guardrails

Safe exception design should include:

- exact rule name,
- exact resource or repo scope,
- owner,
- business reason,
- expiry date,
- compensating controls,
- review cadence.

Unsafe exception design:

- broad global ignore,
- no ticket or owner,
- no expiry,
- disable scanner for whole repository,
- permanent bypass copied between projects.

Policy should make exceptions visible, not invisible.

---

## 10. Example repository structure

A maintainable layout often looks like:

```text
policy/
  terraform/
    baseline/
    prod/
    crown-jewel/
  exceptions/
    exception-registry.yaml
  tests/
    allow/
    deny/
```

Useful practices:

- keep policy code versioned with review,
- test policy with known-pass and known-fail fixtures,
- separate policy libraries from repository-specific overlays,
- review policy changes like application code.

---

## 11. Testing the policy pack itself

A policy pack with no tests becomes another fragile system.

Test at least:

- one known-good example for each rule,
- one known-bad example for each rule,
- one exception case where metadata is valid,
- one stale-exception case that fails.

Good policy quality questions:

- does the rule fail for the intended unsafe pattern,
- does it avoid false positives on the common safe pattern,
- does the message tell engineers what to fix,
- does it stay stable across Terraform provider changes.

---

## 12. Common anti-patterns

Avoid:

- copying large third-party rule packs with no local curation,
- treating policy failures as optional warnings forever,
- putting organization policy only in scanners with weak custom-rule support,
- writing one giant rule that nobody can maintain,
- bypassing policy for emergency fixes without post-incident closure,
- allowing prod trust to be validated only by naming convention.

If policy is so noisy that everyone ignores it, it is not functioning as a control.

---

## 13. First five rules to implement in a small program

If you want the fastest high-value start, encode these first:

1. prod deploy trust must use exact OIDC subject scoping,
2. no wildcard IAM admin permissions,
3. no world-open management ports,
4. no public storage without explicit exception,
5. encryption and logging required on critical resources.

Those five rules catch a large share of high-blast-radius Terraform mistakes.

---

## 14. Use with related references

Use this guide together with:

- `terraform-iac-hardening` for overall review posture,
- `cloud-container-runnable-hardening-tests` for executable enforcement patterns,
- `policy-exception-handling` for waiver governance,
- `github-actions-hardening` and `workload-identity-federation` for CI trust design.

Policy as code is most effective when it sits inside a broader trust model, not as a standalone scanner step.
