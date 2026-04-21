---
title: "GitHub Actions Hardening"
slug: github-actions-hardening
category: infra
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "GitHub Actions security hardening — https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions"
  - "OpenSSF Scorecard — https://scorecard.dev"
  - "SLSA v1.0 — https://slsa.dev/spec/v1.0/"
  - "Sigstore / cosign — https://docs.sigstore.dev"
  - "StepSecurity research — https://www.stepsecurity.io/blog"
triggers_strong: ["github actions hardening", "workflow security", "pull_request_target", "oidc federation", "self hosted runner"]
triggers_weak: ["actions security", "ci trust", "workflow review"]
related: ["supply-chain-security", "cloud-iam-hardening", "secret-leak-prevention"]
---

# GitHub Actions Hardening

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (action pinning, permissions linting, and OIDC policy checks automatable; trust decisions, runner isolation, and workflow design manual)

Use this guide when reviewing or building **GitHub Actions** workflows, reusable workflows, deployment pipelines, artifact flows, or OIDC federation to cloud providers.

GitHub Actions is part CI system, part package manager, part secret-distribution system, and part deployment control plane. Treat workflow files as production security boundary code.

---

## 1. Default Stance

Start from these defaults:

- Set top-level `permissions: {}` and re-grant only what each job needs.
- Pin third-party actions to a full commit SHA, not a floating tag.
- Treat forked pull requests, workflow artifacts, caches, and downloaded build outputs as untrusted.
- Prefer `pull_request` over `pull_request_target` unless you have a documented reason.
- Prefer OIDC federation over long-lived cloud secrets.
- Keep deploy jobs behind environments, reviewers, and branch protection.
- Set `persist-credentials: false` on checkout unless a later step truly needs git push.

Secure baseline:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions: {}

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
        with:
          persist-credentials: false
      - run: npm ci
      - run: npm test
```

---

## 2. Primary Threats

| Threat | Typical mistake | Impact |
|--------|-----------------|--------|
| Malicious pull request code execution | Untrusted PR runs with secrets or write token | Repo compromise, cloud compromise |
| Action supply-chain compromise | Floating `@v3` tag or compromised marketplace action | Secret theft, artifact poisoning |
| Over-privileged `GITHUB_TOKEN` | Default write permissions everywhere | Branch tampering, release abuse |
| Artifact or cache poisoning | Trusted downstream job uses attacker-controlled artifact | Deployment of hostile build output |
| OIDC trust misconfiguration | Broad subject/audience in cloud role trust | Cloud privilege escalation |
| Self-hosted runner abuse | Shared runner processes untrusted jobs | Lateral movement, secret recovery |
| Reusable workflow trust confusion | Caller passes untrusted inputs into privileged callee | Privileged action on attacker data |

---

## 3. Event Trigger Choices

Choose the workflow trigger deliberately.

| Trigger | Safe default use | Main risk |
|---------|------------------|-----------|
| `pull_request` | Test untrusted contributions | No secrets by default, but code is still hostile |
| `pull_request_target` | Metadata-only tasks on PRs, labeling, comments | Runs in target repo context; dangerous with checkout/build of PR code |
| `push` | Trusted branch CI after merge | Compromised maintainer or branch rules bypass |
| `workflow_dispatch` | Human-approved operational tasks | Weak operator approval or bad default inputs |
| `workflow_run` | Gated follow-up after trusted upstream workflow | Blind trust in upstream artifacts |
| `schedule` | Maintenance, scanning, rotation checks | Secret-bearing automation drift |

### `pull_request_target` rule

Use `pull_request_target` only when all of the following are true:

- the job must access repo secrets or write back to the repo,
- the workflow does **not** build or execute PR code,
- the workflow does **not** check out the attacker branch and run scripts from it,
- all inputs from the PR are treated as untrusted text.

High-risk anti-pattern:

```yaml
on: pull_request_target
jobs:
  dangerous:
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      - run: npm ci && npm test
        env:
          SECRET_API_KEY: ${{ secrets.SECRET_API_KEY }}
```

This combines attacker-controlled code with privileged execution.

---

## 4. Token Permissions

The `GITHUB_TOKEN` should be minimized per job.

Recommended patterns:

| Need | Permission |
|------|------------|
| Read code | `contents: read` |
| Comment on PR | `pull-requests: write` |
| Upload SARIF | `security-events: write` |
| Publish package | `packages: write` |
| Mint cloud OIDC token | `id-token: write` |

Avoid:

- broad write permissions at workflow scope,
- jobs that inherit write access but only need read,
- mixing test and release logic inside one privileged job.

Prefer split trust zones:

1. untrusted build/test job,
2. trusted packaging/signing job,
3. human-gated deploy job.

---

## 5. Secrets Handling

Rules:

- Do not expose secrets to forked pull requests.
- Do not echo secrets, write them to artifacts, or pass them as command-line arguments when avoidable.
- Prefer short-lived credentials from OIDC instead of static cloud keys.
- Masking is not a security boundary; transformed or partial secrets can still leak.

Safer patterns:

- inject secrets only into the exact job and step that needs them,
- keep secret-bearing jobs separate from untrusted build steps,
- use environment protection rules for production credentials,
- rotate and inventory secrets used by workflows.

High-signal finding examples:

- `${{ secrets.* }}` available in a job triggered by untrusted PR context,
- cloud access keys stored as repo secrets when OIDC is available,
- secrets written to `.npmrc`, config files, or artifacts without cleanup,
- job logs containing bearer tokens, cookies, or signed URLs.

---

## 6. Third-Party Action Trust

Marketplace actions are dependencies. Review them like code.

Minimum controls:

- pin to full commit SHA,
- prefer official or well-maintained publishers,
- review requested permissions and network behavior,
- review whether the action executes arbitrary shell, JavaScript, or Docker entrypoints,
- monitor for upstream changes before updating pinned SHAs.

Better:

- vendor critical actions internally,
- maintain an allowlist of approved actions,
- use Scorecard or dependency review on workflow changes.

Bad:

```yaml
- uses: some-random/action@v1
```

Better:

```yaml
- uses: some-random/action@0123456789abcdef0123456789abcdef01234567
```

---

## 7. Artifact, Cache, and Workspace Trust Boundaries

Artifacts and caches are not automatically trusted just because they came from GitHub.

Review questions:

- Which job created the artifact?
- Was the producer job allowed to process untrusted code?
- Is the consumer job more privileged than the producer?
- Is the artifact verified before execution or deployment?

Rules:

- Never deploy an artifact from an untrusted PR build directly to production.
- Do not restore caches across trust boundaries without careful keys.
- Avoid caching locations that may contain auth material (`~/.npmrc`, cloud credentials, SSH config).
- Verify hashes, signatures, provenance, or source commit before a privileged follow-up job consumes outputs.

Preferred pattern:

1. build in untrusted job,
2. rebuild or verify in trusted release job,
3. sign in trusted job,
4. deploy only signed outputs.

---

## 8. OIDC Federation

OIDC is preferred over static secrets, but only when the cloud trust policy is narrow.

Verify:

- audience is explicit,
- subject claim matches the intended repo, ref, and workflow,
- only trusted branches/tags/environments can assume the role,
- the role has least privilege,
- no wildcard repo or branch trust without strong justification.

Good trust policy characteristics:

- exact repository match,
- exact branch or environment match,
- separation between read-only CI role and deployment role,
- short session duration,
- cloud-side logging and alerting on role assumption.

High-risk signs:

- subject pattern trusts every branch,
- one role reused for test and production deploy,
- no environment reviewers around prod role assumption,
- repo rename or transfer not considered in trust conditions.

---

## 9. Self-Hosted Runners

Treat self-hosted runners as sensitive infrastructure, not cheap build workers.

Controls:

- do not run untrusted PR jobs on privileged self-hosted runners,
- dedicate runners per trust zone or repository group,
- use ephemeral runners where possible,
- scrub workspace and credentials after each job,
- block lateral movement to internal networks unless required,
- monitor runner registration, job assignment, and outbound connections,
- keep runner images patched and minimal.

Red flags:

- shared long-lived runner for many repos,
- runner has cloud admin access by default,
- runner host has access to internal package registries, secrets stores, or production networks not needed by the job,
- attacker-controlled code can write to host-mounted directories reused across jobs.

---

## 10. Reusable Workflows and Environments

Reusable workflows help consistency but can hide trust assumptions.

Review:

- which inputs are attacker-controlled,
- whether the called workflow mints tokens or accesses secrets,
- whether the callee assumes trusted source code,
- whether environment approval gates apply before secret access.

For deployments:

- require environments for staging/prod,
- use reviewer approval for production,
- lock down who can modify environment secrets,
- prefer release tags or protected branches as deployment sources.

---

## 11. Fast Review Checklist

| Check | Expected |
|-------|----------|
| Workflow-level `permissions: {}` present | Yes |
| Every job re-grants only minimum permissions | Yes |
| Third-party actions pinned to full commit SHA | Yes |
| Untrusted PR workflows avoid secrets and write scopes | Yes |
| `pull_request_target` used only for metadata-safe tasks | Yes |
| OIDC trust policy scoped to repo + ref + environment | Yes |
| Artifacts from untrusted jobs are not blindly deployed | Yes |
| Self-hosted runners isolated by trust boundary | Yes |
| Checkout uses `persist-credentials: false` unless needed | Yes |
| Release/deploy jobs require protected branch or environment gate | Yes |

---

## 12. High-Signal Findings to Report First

1. `pull_request_target` plus checkout/build of attacker branch.
2. Broad write-scoped `GITHUB_TOKEN` in test jobs.
3. Floating marketplace action versions.
4. Static cloud secrets where OIDC could replace them.
5. Trusted deploy job consuming untrusted artifact with no verification.
6. Shared privileged self-hosted runner handling forked PRs.
7. Weak environment protection around production deploys.

Lead with exploitability, reachable path, and smallest safe fix.

---

## 13. Related References

- `supply-chain-security.md`
- `cloud-iam-hardening.md`
- `secret-leak-prevention.md`
- `vuln-management.md`
