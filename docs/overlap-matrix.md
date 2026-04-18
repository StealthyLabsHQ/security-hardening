# Overlap Matrix

Phase 1 overlap audit for `references/`.

## Scoring rubric

- `0`: no meaningful overlap
- `1`: adjacent topic, useful cross-link, different primary purpose
- `2`: strong overlap, distinct deliverable still possible
- `3`: near-duplicate scope or same reader outcome

This matrix is intentionally sparse. Every reference file is listed once. Only `score >= 2`
relationships are shown explicitly. All omitted pairings should be treated as `0` or `1`.

## Target investigations requested in the brief

### Cluster A: `quick-start-ai-coding` vs `vibecoder-traps` vs `pre-push-checklist`

| Pair | Score | Recommendation | Reason |
|---|---:|---|---|
| `quick-start-ai-coding` <-> `vibecoder-traps` | 2 | ownership clear | `quick-start` is onboarding and shipping flow; `vibecoder-traps` is anti-pattern catalog with examples |
| `quick-start-ai-coding` <-> `pre-push-checklist` | 2 | ownership clear | `quick-start` is broad "before ship" guidance; `pre-push-checklist` is the repeatable operational gate |
| `vibecoder-traps` <-> `pre-push-checklist` | 2 | ownership clear | one teaches pattern recognition, the other enforces a last-mile checklist |

Recommended ownership:

- `quick-start-ai-coding.md`: "first read" for AI-assisted coding
- `vibecoder-traps.md`: catalog of recurring insecure generation patterns
- `pre-push-checklist.md`: final gate before `git push`

### Cluster B: `ai-cli-hardening` vs `ai-tool-profiles` vs `ai-ide-no-code-security`

| Pair | Score | Recommendation | Reason |
|---|---:|---|---|
| `ai-cli-hardening` <-> `ai-tool-profiles` | 2 | ownership clear | controls/policy model vs copy-paste implementation pack |
| `ai-cli-hardening` <-> `ai-ide-no-code-security` | 2 | split | CLI-specific operational controls vs broader IDE/browser/no-code surface model |
| `ai-tool-profiles` <-> `ai-ide-no-code-security` | 2 | ownership clear | artifacts/templates vs threat model and governance |

Recommended ownership:

- `ai-cli-hardening.md`: runtime control model for agentic CLIs
- `ai-tool-profiles.md`: profile selection and template mapping
- `ai-ide-no-code-security.md`: broader builder-family threat model and controls

### Cluster C: `incident-playbooks` vs `ai-agent-incident-response`

| Pair | Score | Recommendation | Reason |
|---|---:|---|---|
| `incident-playbooks` <-> `ai-agent-incident-response` | 2 | split | generic security IR vs AI-agent-specific containment, evidence, and recovery |

Recommended ownership:

- `incident-playbooks.md`: human-run IR patterns for common incidents
- `ai-agent-incident-response.md`: AI-agent, MCP, prompt-injection, and tool-abuse response

## Sparse matrix by file

| File | Strong overlaps (`score >= 2`) |
|---|---|
| `active-directory-hardening.md` | `cloud-iam-hardening.md (2)` |
| `ai-agent-incident-response.md` | `ai-cli-hardening.md (2)`, `detection-engineering.md (2)`, `incident-playbooks.md (2)`, `llm-agent-security.md (2)`, `mcp-security.md (2)` |
| `ai-bundle-presets.md` | `ai-cli-hardening.md (2)`, `ai-tool-profiles.md (2)` |
| `ai-cli-hardening.md` | `ai-agent-incident-response.md (2)`, `ai-bundle-presets.md (2)`, `ai-ide-no-code-security.md (2)`, `ai-tool-profiles.md (2)`, `llm-agent-security.md (2)`, `mcp-security.md (2)` |
| `ai-ide-no-code-security.md` | `ai-cli-hardening.md (2)`, `ai-tool-profiles.md (2)`, `quick-start-ai-coding.md (2)` |
| `ai-tool-profiles.md` | `ai-bundle-presets.md (2)`, `ai-cli-hardening.md (2)`, `ai-ide-no-code-security.md (2)` |
| `api-security.md` | `authorization-rbac.md (2)`, `graphql-security.md (2)`, `rate-limiting-infrastructure.md (2)`, `webhooks-security.md (2)` |
| `applied-cryptography.md` | - |
| `authorization-rbac.md` | `api-security.md (2)`, `graphql-security.md (2)`, `security-testing-examples.md (2)` |
| `browser-security-modern.md` | `frontend-frameworks-security.md (2)`, `secure-headers.md (2)` |
| `cloud-iam-hardening.md` | `active-directory-hardening.md (2)`, `authorization-rbac.md (2)` |
| `compliance-mapping.md` | `coverage-matrix.md (2)` |
| `container-k8s-hardening.md` | `supply-chain-security.md (2)` |
| `coverage-matrix.md` | `compliance-mapping.md (2)`, `security-audit-levels.md (2)` |
| `cwe-owasp-mapping.md` | `owasp-top10.md (2)` |
| `database-security.md` | `api-security.md (2)`, `language-patterns.md (2)` |
| `defensive-security-baseline.md` | `security-improvements.md (2)` |
| `desktop-app-security.md` | `endpoint-vba-security.md (2)` |
| `detection-engineering.md` | `ai-agent-incident-response.md (2)`, `incident-playbooks.md (2)` |
| `endpoint-vba-security.md` | `desktop-app-security.md (2)` |
| `framework-examples.md` | `frontend-frameworks-security.md (2)`, `language-patterns.md (2)`, `security-testing-examples.md (2)` |
| `frontend-frameworks-security.md` | `browser-security-modern.md (2)`, `framework-examples.md (2)` |
| `gdpr-security-ops.md` | `privacy-data-minimization.md (2)` |
| `graphql-security.md` | `api-security.md (2)`, `authorization-rbac.md (2)`, `security-testing-examples.md (2)` |
| `hostile-corpus-review.md` | `llm-agent-security.md (2)`, `mcp-security.md (2)` |
| `incident-playbooks.md` | `ai-agent-incident-response.md (2)`, `detection-engineering.md (2)`, `secret-leak-prevention.md (2)` |
| `iot-ot-security.md` | - |
| `language-patterns.md` | `database-security.md (2)`, `framework-examples.md (2)`, `quick-start-ai-coding.md (2)`, `vibecoder-traps.md (2)` |
| `llm-agent-security.md` | `ai-agent-incident-response.md (2)`, `ai-cli-hardening.md (2)`, `hostile-corpus-review.md (2)`, `mcp-security.md (2)` |
| `mcp-security.md` | `ai-agent-incident-response.md (2)`, `ai-cli-hardening.md (2)`, `hostile-corpus-review.md (2)`, `llm-agent-security.md (2)` |
| `mobile-security.md` | - |
| `owasp-top10.md` | `cwe-owasp-mapping.md (2)` |
| `pre-push-checklist.md` | `quick-start-ai-coding.md (2)`, `secret-leak-prevention.md (2)`, `vibecoder-traps.md (2)` |
| `privacy-data-minimization.md` | `gdpr-security-ops.md (2)`, `production-error-handling.md (2)` |
| `production-error-handling.md` | `privacy-data-minimization.md (2)` |
| `quick-start-ai-coding.md` | `ai-ide-no-code-security.md (2)`, `language-patterns.md (2)`, `pre-push-checklist.md (2)`, `vibecoder-traps.md (2)` |
| `rate-limiting-infrastructure.md` | `api-security.md (2)`, `security-testing-examples.md (2)` |
| `secret-leak-prevention.md` | `incident-playbooks.md (2)`, `pre-push-checklist.md (2)` |
| `secure-headers.md` | `browser-security-modern.md (2)` |
| `security-audit-levels.md` | `coverage-matrix.md (2)` |
| `security-improvements.md` | `defensive-security-baseline.md (2)`, `threat-modeling.md (2)`, `vuln-management.md (2)` |
| `security-myths.md` | - |
| `security-testing-examples.md` | `authorization-rbac.md (2)`, `framework-examples.md (2)`, `graphql-security.md (2)`, `rate-limiting-infrastructure.md (2)`, `threat-modeling.md (2)` |
| `session-management.md` | `webauthn-fido2.md (2)` |
| `social-engineering-physical.md` | - |
| `supply-chain-security.md` | `container-k8s-hardening.md (2)` |
| `threat-modeling.md` | `security-improvements.md (2)`, `security-testing-examples.md (2)` |
| `vibecoder-traps.md` | `language-patterns.md (2)`, `pre-push-checklist.md (2)`, `quick-start-ai-coding.md (2)` |
| `vuln-management.md` | `security-improvements.md (2)` |
| `webauthn-fido2.md` | `session-management.md (2)` |
| `webhooks-security.md` | `api-security.md (2)` |

## Recommended actions for every strong-overlap pair

| Pair | Score | Recommendation | Ownership or outcome |
|---|---:|---|---|
| `active-directory-hardening` <-> `cloud-iam-hardening` | 2 | split | enterprise directory hardening vs cloud identity and policy controls |
| `ai-agent-incident-response` <-> `ai-cli-hardening` | 2 | ownership clear | incident handling vs preventive runtime controls |
| `ai-agent-incident-response` <-> `detection-engineering` | 2 | split | containment/recovery vs telemetry and alert logic |
| `ai-agent-incident-response` <-> `incident-playbooks` | 2 | split | AI-agent specialization vs generic IR |
| `ai-agent-incident-response` <-> `llm-agent-security` | 2 | ownership clear | response playbook vs architecture and control model |
| `ai-agent-incident-response` <-> `mcp-security` | 2 | ownership clear | response playbook vs MCP threat/control reference |
| `ai-bundle-presets` <-> `ai-cli-hardening` | 2 | ownership clear | preset bundles vs control model |
| `ai-bundle-presets` <-> `ai-tool-profiles` | 2 | merge candidate | presets look like a packaging layer on top of profiles, not a separate knowledge domain |
| `ai-cli-hardening` <-> `ai-ide-no-code-security` | 2 | split | CLI-first operational hardening vs broader builder-family governance |
| `ai-cli-hardening` <-> `ai-tool-profiles` | 2 | ownership clear | policy and hardening logic vs copy/paste profile selection |
| `ai-cli-hardening` <-> `llm-agent-security` | 2 | ownership clear | operational workflow controls vs model/agent threat model |
| `ai-cli-hardening` <-> `mcp-security` | 2 | ownership clear | CLI runtime controls vs MCP-specific trust and abuse patterns |
| `ai-ide-no-code-security` <-> `ai-tool-profiles` | 2 | ownership clear | threat model and governance vs installable profile artifacts |
| `ai-ide-no-code-security` <-> `quick-start-ai-coding` | 2 | split | broad builder governance vs first-pass secure-shipping guidance |
| `api-security` <-> `authorization-rbac` | 2 | ownership clear | API-wide control failures vs dedicated authz/IDOR deep dive |
| `api-security` <-> `graphql-security` | 2 | split | generic API reference vs protocol-specific graph concerns |
| `api-security` <-> `rate-limiting-infrastructure` | 2 | ownership clear | API abuse class vs infrastructure enforcement patterns |
| `api-security` <-> `webhooks-security` | 2 | ownership clear | inbound API surface vs signed callback pattern |
| `authorization-rbac` <-> `graphql-security` | 2 | ownership clear | access-control model vs GraphQL-specific failure modes |
| `authorization-rbac` <-> `security-testing-examples` | 2 | ownership clear | design patterns vs verification patterns |
| `browser-security-modern` <-> `frontend-frameworks-security` | 2 | split | browser/platform primitives vs frontend framework behaviors |
| `browser-security-modern` <-> `secure-headers` | 2 | ownership clear | broad browser security reference vs compact header cheat sheet |
| `cloud-iam-hardening` <-> `authorization-rbac` | 2 | split | cloud control-plane identity vs application authorization |
| `compliance-mapping` <-> `coverage-matrix` | 2 | ownership clear | external framework mapping vs internal corpus coverage map |
| `coverage-matrix` <-> `security-audit-levels` | 2 | ownership clear | corpus coverage and automation view vs audit-depth ladder |
| `cwe-owasp-mapping` <-> `owasp-top10` | 2 | ownership clear | taxonomy crosswalk vs practitioner quick reference |
| `database-security` <-> `language-patterns` | 2 | split | storage-layer controls vs language sink catalog |
| `defensive-security-baseline` <-> `security-improvements` | 2 | ownership clear | minimum baseline vs phased roadmap |
| `desktop-app-security` <-> `endpoint-vba-security` | 2 | split | desktop application engineering vs endpoint and macro controls |
| `detection-engineering` <-> `incident-playbooks` | 2 | split | signal generation vs human response runbook |
| `framework-examples` <-> `frontend-frameworks-security` | 2 | split | framework code examples across stacks vs frontend-specific risks |
| `framework-examples` <-> `language-patterns` | 2 | split | framework implementation patterns vs language-specific dangerous sinks |
| `framework-examples` <-> `security-testing-examples` | 2 | ownership clear | implementation examples vs test examples |
| `gdpr-security-ops` <-> `privacy-data-minimization` | 2 | split | regulatory/security operations vs technical data-minimization patterns |
| `graphql-security` <-> `security-testing-examples` | 2 | ownership clear | GraphQL controls vs test cases validating them |
| `hostile-corpus-review` <-> `llm-agent-security` | 2 | ownership clear | hostile input review workflow vs broad agent security model |
| `hostile-corpus-review` <-> `mcp-security` | 2 | ownership clear | hostile content handling vs MCP protocol/tool trust |
| `incident-playbooks` <-> `secret-leak-prevention` | 2 | ownership clear | generic IR patterns vs secret-specific revoke-first playbook |
| `language-patterns` <-> `quick-start-ai-coding` | 2 | ownership clear | deep sink catalog vs fast onboarding checklist |
| `language-patterns` <-> `vibecoder-traps` | 2 | ownership clear | language-specific sink catalog vs AI-generated mistake narratives |
| `llm-agent-security` <-> `mcp-security` | 2 | split | general agent security vs MCP-specific attack surface |
| `pre-push-checklist` <-> `quick-start-ai-coding` | 2 | ownership clear | repeatable push gate vs first-read shipping guide |
| `pre-push-checklist` <-> `secret-leak-prevention` | 2 | ownership clear | preventative gate vs incident response for leaked credentials |
| `pre-push-checklist` <-> `vibecoder-traps` | 2 | ownership clear | operational checklist vs trap catalog |
| `privacy-data-minimization` <-> `production-error-handling` | 2 | split | privacy lens on data handling vs generic prod error/logging hardening |
| `rate-limiting-infrastructure` <-> `security-testing-examples` | 2 | ownership clear | implementation patterns vs tests for abuse throttling |
| `security-improvements` <-> `threat-modeling` | 2 | ownership clear | prioritized roadmap vs method to generate the roadmap inputs |
| `security-improvements` <-> `vuln-management` | 2 | split | strategic improvement backlog vs operational remediation process |
| `security-testing-examples` <-> `threat-modeling` | 2 | ownership clear | test design should consume threat models, not replace them |
| `session-management` <-> `webauthn-fido2` | 2 | ownership clear | session lifecycle vs phishing-resistant authentication method |
| `supply-chain-security` <-> `container-k8s-hardening` | 2 | split | software provenance/dependencies vs runtime/container orchestration controls |

## Highest-value refactor targets for later phases

1. `ai-bundle-presets.md` is the clearest merge candidate; it looks like a distribution wrapper around `ai-tool-profiles.md`.
2. The AI-assisted coding cluster needs stricter document ownership to avoid repeated "safe defaults / approvals / secrets / push gates" guidance.
3. The response cluster is sound, but `incident-playbooks.md`, `ai-agent-incident-response.md`, and `secret-leak-prevention.md` need a clearer entry-order and cross-link pattern.
4. Meta-docs (`coverage-matrix.md`, `compliance-mapping.md`, `security-audit-levels.md`) should remain separate but will need explicit navigation after the tree restructure.
