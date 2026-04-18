---
title: "Cloud & Container Runnable Hardening Tests"
slug: cloud-container-runnable-hardening-tests
category: infra
depth: 2
audit_level: [3, 4]
last_reviewed: 2026-04-19
sources:
  - "Checkov documentation"
  - "Conftest / OPA documentation"
  - "Kyverno policy examples"
  - "Kubernetes Pod Security Standards"
  - "AWS / GCP / Azure OIDC and IAM guidance"
triggers_strong: ["runnable hardening tests", "oidc trust test", "admission policy test", "cloud hardening tests", "kubernetes policy test"]
triggers_weak: ["infra security tests", "policy as code", "cloud config validation"]
related: ["terraform-iac-hardening", "container-k8s-hardening", "github-actions-hardening", "security-testing-examples", "workload-identity-federation"]
---

# Cloud & Container Runnable Hardening Tests

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 3-4 | Automation: Full (policy-as-code, IaC scanning, manifest checks, and CI gate execution fully automatable; exception approval, blast-radius analysis, and emergency override review manual)

Use this guide when you want to turn cloud and container hardening requirements into **tests that fail builds** instead of remaining review checklist items.

This is the infrastructure counterpart to `security-testing-examples.md`: the goal is to make important platform assumptions executable.

---

## 1. Core rule

If a platform control is important enough to mention in a review, try to encode it as a runnable check.

Minimum candidates for runnable tests:

- OIDC trust conditions,
- wildcard IAM privileges,
- public exposure of storage and services,
- missing encryption and logging,
- Kubernetes privilege escalation settings,
- image pinning and provenance,
- service-account token exposure,
- required network or admission policies.

If the rule can only live in a doc and never in CI, treat it as fragile.

---

## 2. What runnable hardening tests are good at

They are especially good at catching:

- drift in Terraform and Kubernetes manifests before merge,
- regressions during refactors of modules or shared charts,
- “temporary” exceptions that were never removed,
- copy-paste configs that quietly widen trust.

They are not enough on their own for:

- whether a trust relationship is justified by business need,
- whether one permitted admin role is still too broad in context,
- whether the monitored systems actually cover all critical assets.

Use runnable tests for mechanical assurance, then review exceptions manually.

---

## 3. Minimum areas to encode

| Area | Example rule |
|---|---|
| CI-to-cloud identity | only protected branches/environments may assume prod roles |
| IAM | deny wildcard admin or unrestricted role assumption |
| Storage | block public access, require encryption, require access logging where needed |
| Network | deny `0.0.0.0/0` to admin ports, require namespace segmentation or SG scope |
| Kubernetes workload security | require non-root, drop capabilities, read-only FS when feasible |
| Service accounts | disable token automount unless explicitly needed |
| Admission / policy | deny privileged pods, hostPath mounts, latest-tag images |
| Supply chain | pin image digests or trusted registry sources |

---

## 4. Good design for a runnable control suite

A useful suite usually has four layers:

1. **Terraform / manifest static checks**
2. **Policy-as-code rules**
3. **Environment-specific smoke tests**
4. **Exception tracking**

Do not stop at scanners alone. Scanners catch broad classes, but your environment-specific trust rules often need custom policies.

---

## 5. Terraform and IaC checks

### 5.1 Fast baseline

Run at minimum:

```bash
terraform fmt -check
terraform validate
checkov -d .
trivy config .
conftest test .
```

Useful split:

- `fmt` / `validate` for syntax,
- scanner for known misconfig classes,
- custom policy layer for your organization’s trust rules.

### 5.2 Example: deny wildcard admin permissions

```yaml
# .checkov.yaml or equivalent scanner config can help,
# but custom policy is often clearer for org-specific rules.
```

```rego
package terraform.iam

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_iam_policy"
  policy := json.unmarshal(resource.change.after.policy)
  stmt := policy.Statement[_]
  stmt.Effect == "Allow"
  stmt.Action == "*"
  msg := sprintf("IAM policy %s allows wildcard actions", [resource.address])
}
```

### 5.3 Example: require OIDC subject scoping for CI trust

```rego
package terraform.oidc

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_iam_role"
  policy := json.unmarshal(resource.change.after.assume_role_policy)
  stmt := policy.Statement[_]
  stmt.Action == "sts:AssumeRoleWithWebIdentity"
  not stmt.Condition.StringEquals["token.actions.githubusercontent.com:sub"]
  msg := sprintf("%s missing strict GitHub OIDC subject scoping", [resource.address])
}
```

You can adapt the same principle for GCP Workload Identity Federation or Azure Federated Credentials.

---

## 6. Cloud configuration tests worth adding first

### 6.1 Public exposure

Fail the build when:

- object storage is public by default,
- load balancers or app services expose admin surfaces publicly,
- databases get public endpoints without explicit exception.

### 6.2 Encryption and logging

Fail the build when:

- storage encryption is disabled,
- KMS or key references are missing where required,
- access logging or audit logging is absent on high-value resources.

### 6.3 Trust and role sprawl

Fail the build when:

- trust policy allows too many repositories or branches,
- prod role can be assumed from pull requests or forks,
- same identity can both plan and apply in production,
- service identity can mint or rotate credentials for itself.

### 6.4 Network exposure

Fail the build when:

- SSH, RDP, database admin ports, or Kubernetes admin surfaces are open to the world,
- unrestricted egress exists for workloads that should be tightly bounded,
- sensitive services lack segmentation primitives.

---

## 7. Kubernetes manifest checks

### 7.1 Baseline static checks

Run at minimum:

```bash
trivy config k8s/
kube-score score k8s/*.yaml
kubescape scan framework nsa --format json --output results.json
conftest test k8s/
```

### 7.2 Example: require non-root and no privilege escalation

```rego
package kubernetes.workload

deny[msg] {
  input.kind == "Deployment"
  c := input.spec.template.spec.containers[_]
  not c.securityContext.runAsNonRoot
  msg := sprintf("%s container %s must run as non-root", [input.metadata.name, c.name])
}

deny[msg] {
  input.kind == "Deployment"
  c := input.spec.template.spec.containers[_]
  c.securityContext.allowPrivilegeEscalation != false
  msg := sprintf("%s container %s allows privilege escalation", [input.metadata.name, c.name])
}
```

### 7.3 Example: require digest pinning or approved registry

```rego
package kubernetes.images

approved_prefixes := [
  "ghcr.io/your-org/",
  "registry.company.internal/",
]

deny[msg] {
  input.kind == "Deployment"
  c := input.spec.template.spec.containers[_]
  not contains(c.image, "@sha256:")
  not startswith(c.image, approved_prefixes[_])
  msg := sprintf("%s container %s uses unpinned / unapproved image %s", [input.metadata.name, c.name, c.image])
}
```

### 7.4 Example: block default service-account token exposure

```rego
package kubernetes.serviceaccount

deny[msg] {
  input.kind == "Deployment"
  not input.spec.template.spec.automountServiceAccountToken == false
  msg := sprintf("%s should set automountServiceAccountToken to false unless explicitly required", [input.metadata.name])
}
```

---

## 8. Admission policy tests

If you use Kyverno, Gatekeeper, or a native admission layer, test the policies themselves.

### 8.1 Kyverno example: deny privileged pods

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-privileged
spec:
  validationFailureAction: Enforce
  rules:
    - name: no-privileged-containers
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Privileged containers are not allowed"
        pattern:
          spec:
            containers:
              - securityContext:
                  =(privileged): false
```

Test with a negative fixture in CI:

```bash
kyverno test .github/kyverno-tests
```

### 8.2 What to encode in admission first

Start with:

- deny privileged mode,
- deny hostPath mounts,
- require approved namespaces/labels,
- require resource requests/limits,
- require non-root and dropped capabilities,
- require image provenance or registry restriction.

---

## 9. Smoke tests after deployment

Static policy is not enough. Add low-cost environment checks for critical controls.

Examples:

- verify no unexpected public buckets or services exist,
- verify prod CI role assumption fails from an untrusted ref,
- verify admin ports are not externally reachable,
- verify denied Kubernetes pod specs are actually rejected by the cluster,
- verify network policies block cross-namespace traffic where expected.

Example concept:

```bash
# Fail if a workload can still hit metadata from an untrusted pod test fixture
kubectl run metadata-probe --rm -i --restart=Never --image=curlimages/curl \
  -- curl -fsS http://169.254.169.254/latest/meta-data/
```

The exact command differs by environment, but the principle is the same: prove the boundary exists.

---

## 10. OIDC and trust-boundary tests

These are high-ROI because one trust mistake often becomes production compromise.

Test at minimum:

- trusted issuer exact match,
- audience exact match,
- subject restricted to approved repo / branch / environment,
- forks and pull requests cannot reach prod trust paths,
- dev and prod roles are separate,
- apply trust requires stronger conditions than plan trust.

Good failure cases to automate:

- PR branch attempting to assume prod role,
- repo outside org attempting assumption,
- environment name mismatch,
- missing approval gate before prod apply.

---

## 11. Exception handling

The suite should not force people into hidden bypasses.

For each exception, require:

- explicit rule ID,
- owner,
- reason,
- scope,
- expiry,
- review ticket.

Bad pattern:

- disabling the scanner for the whole repo,
- commenting out the failing rule in CI,
- “temporary” allowlist with no expiry.

Good pattern:

- narrow exception file reviewed like code,
- monthly review of active exceptions,
- production-only rules harder to waive than dev rules.

---

## 12. Suggested pipeline order

| Step | Goal |
|---|---|
| `fmt` / syntax validation | catch broken configs early |
| scanner layer | catch known dangerous defaults |
| custom policy layer | enforce org-specific trust rules |
| admission policy tests | prove cluster rules reject bad manifests |
| smoke tests | prove real environment boundary exists |
| exception review | stop hidden drift |

---

## 13. High-signal red flags

Treat these as signs your infra tests are too shallow:

- security review depends on someone eyeballing Terraform plans only,
- OIDC trust is described in docs but not tested,
- Kubernetes hardening relies only on one scanner run,
- no negative fixtures for admission policies,
- service-account token automount remains enabled everywhere,
- prod apply identity is reachable from broad CI contexts,
- exceptions have no expiry or owner.

---

## 14. Minimum output format for findings

When a runnable test fails, report:

1. **rule ID**,
2. **resource / manifest**,
3. **why it failed**,
4. **risk / blast radius**,
5. **minimal remediation**,
6. **whether an exception path exists**.

Example:

| Field | Example |
|---|---|
| Rule ID | `OIDC-PROD-001` |
| Resource | `aws_iam_role.prod_apply` |
| Failure | missing strict GitHub subject restriction |
| Risk | untrusted CI context may assume prod role |
| Minimal fix | add exact `sub` condition for protected environment |
| Exception path | none for prod roles |

---

## 15. Bottom line

Hardening is much more reliable when the question becomes “did the test fail?” instead of “did someone remember the checklist?”

For cloud and container security, the fastest productivity gain often comes from converting the most painful review comments into reusable negative tests.
