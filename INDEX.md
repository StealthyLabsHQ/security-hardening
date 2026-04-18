# Security Hardening Index

Machine-facing entrypoint for this repository. Use this file for direct corpus navigation. Use [README.md](README.md) for install steps, release channels, and human onboarding.

## Load Order

1. Read [SKILL.md](SKILL.md) for trigger logic and routing rules.
2. Always load [references/_core-invariants.md](references/_core-invariants.md) once.
3. Load only the domain files needed for the current task.
4. Use [references/_index.md](references/_index.md) only when category, review date, or audit-level metadata is needed.

## Core Files

- [SKILL.md](SKILL.md)
- [references/_core-invariants.md](references/_core-invariants.md)
- [references/_index.md](references/_index.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CHANGELOG.md](CHANGELOG.md)

## AppSec

- [references/appsec/owasp-top10.md](references/appsec/owasp-top10.md)
- [references/appsec/api-security.md](references/appsec/api-security.md)
- [references/appsec/graphql-security.md](references/appsec/graphql-security.md)
- [references/appsec/threat-modeling.md](references/appsec/threat-modeling.md)
- [references/appsec/security-testing-examples.md](references/appsec/security-testing-examples.md)
- [references/appsec/secure-headers.md](references/appsec/secure-headers.md)
- [references/appsec/browser-security-modern.md](references/appsec/browser-security-modern.md)
- [references/appsec/frontend-frameworks-security.md](references/appsec/frontend-frameworks-security.md)
- [references/appsec/language-patterns.md](references/appsec/language-patterns.md)
- [references/appsec/production-error-handling.md](references/appsec/production-error-handling.md)
- [references/appsec/webhooks-security.md](references/appsec/webhooks-security.md)
- [references/appsec/database-security.md](references/appsec/database-security.md)
- [references/appsec/applied-cryptography.md](references/appsec/applied-cryptography.md)
- [references/appsec/security-myths.md](references/appsec/security-myths.md)
- [references/appsec/framework-examples.md](references/appsec/framework-examples.md)

## Infra

- [references/infra/supply-chain-security.md](references/infra/supply-chain-security.md)
- [references/infra/container-k8s-hardening.md](references/infra/container-k8s-hardening.md)
- [references/infra/rate-limiting-infrastructure.md](references/infra/rate-limiting-infrastructure.md)
- [references/infra/iot-ot-security.md](references/infra/iot-ot-security.md)

## IAM

- [references/iam/authorization-rbac.md](references/iam/authorization-rbac.md)
- [references/iam/session-management.md](references/iam/session-management.md)
- [references/iam/webauthn-fido2.md](references/iam/webauthn-fido2.md)
- [references/iam/cloud-iam-hardening.md](references/iam/cloud-iam-hardening.md)
- [references/iam/active-directory-hardening.md](references/iam/active-directory-hardening.md)

## Platform

- [references/platform/mobile-security.md](references/platform/mobile-security.md)
- [references/platform/desktop-app-security.md](references/platform/desktop-app-security.md)
- [references/platform/endpoint-vba-security.md](references/platform/endpoint-vba-security.md)

## AI

- [references/ai/_index.md](references/ai/_index.md)
- [references/ai/llm-agent-security.md](references/ai/llm-agent-security.md)
- [references/ai/browser-computer-use-security.md](references/ai/browser-computer-use-security.md)
- [references/ai/mcp-security.md](references/ai/mcp-security.md)
- [references/ai/rag-retrieval-security.md](references/ai/rag-retrieval-security.md)
- [references/ai/hostile-corpus-review.md](references/ai/hostile-corpus-review.md)
- [references/ai/ai-cli-hardening.md](references/ai/ai-cli-hardening.md)
- [references/ai/ai-ide-no-code-security.md](references/ai/ai-ide-no-code-security.md)
- [references/ai/ai-tool-profiles.md](references/ai/ai-tool-profiles.md)
- [references/ai/agent-evals-red-teaming.md](references/ai/agent-evals-red-teaming.md)
- [references/ai/quick-start-ai-coding.md](references/ai/quick-start-ai-coding.md)
- [references/ai/vibecoder-traps.md](references/ai/vibecoder-traps.md)
- [references/ai/ai-agent-incident-response.md](references/ai/ai-agent-incident-response.md)

## Privacy

- [references/privacy/privacy-data-minimization.md](references/privacy/privacy-data-minimization.md)
- [references/privacy/gdpr-security-ops.md](references/privacy/gdpr-security-ops.md)

## Ops

- [references/ops/defensive-security-baseline.md](references/ops/defensive-security-baseline.md)
- [references/ops/secret-leak-prevention.md](references/ops/secret-leak-prevention.md)
- [references/ops/pre-push-checklist.md](references/ops/pre-push-checklist.md)
- [references/ops/security-audit-levels.md](references/ops/security-audit-levels.md)
- [references/ops/security-improvements.md](references/ops/security-improvements.md)
- [references/ops/detection-engineering.md](references/ops/detection-engineering.md)
- [references/ops/incident-playbooks.md](references/ops/incident-playbooks.md)
- [references/ops/vuln-management.md](references/ops/vuln-management.md)
- [references/ops/social-engineering-physical.md](references/ops/social-engineering-physical.md)

## Compliance

- [references/compliance/cwe-owasp-mapping.md](references/compliance/cwe-owasp-mapping.md)
- [references/compliance/compliance-mapping.md](references/compliance/compliance-mapping.md)
- [references/compliance/coverage-matrix.md](references/compliance/coverage-matrix.md)

## Templates

- [templates/ai-tool-profiles](templates/ai-tool-profiles)
- [templates/ai-tool-profiles/postures](templates/ai-tool-profiles/postures)
- [templates/ai-tool-profiles/bundles](templates/ai-tool-profiles/bundles)

## Validation

- `python scripts/build-index.py`
- `python scripts/lint-skill.py`
- `python evals/run.py`
