# Reference Inventory

Phase 1 inventory of `references/` before refactor.

- Total files: 51
- Total word count: 63,228
- Method: word count from raw markdown; themes inferred from title, headings, and document scope.

| File | Words | Primary themes |
|---|---:|---|
| `active-directory-hardening.md` | 466 | active-directory, identity, hardening |
| `ai-agent-incident-response.md` | 655 | ai-agents, incident-response, containment |
| `ai-bundle-presets.md` | 407 | ai-tooling, templates, bundles |
| `ai-cli-hardening.md` | 1209 | ai-agents, least-privilege, policy |
| `ai-ide-no-code-security.md` | 1361 | ai-tooling, no-code, permissions |
| `ai-tool-profiles.md` | 851 | ai-tooling, templates, policy |
| `api-security.md` | 1135 | api, authz, input-validation |
| `applied-cryptography.md` | 1954 | cryptography, key-management, secrets |
| `authorization-rbac.md` | 737 | authz, access-control, idor |
| `browser-security-modern.md` | 2373 | browser, xss, client-side-security |
| `cloud-iam-hardening.md` | 1062 | cloud, iam, least-privilege |
| `compliance-mapping.md` | 1920 | compliance, controls, evidence |
| `container-k8s-hardening.md` | 989 | containers, kubernetes, runtime-hardening |
| `coverage-matrix.md` | 1234 | corpus-governance, coverage, review-planning |
| `cwe-owasp-mapping.md` | 728 | taxonomy, appsec, standards |
| `database-security.md` | 1121 | database, injection, access-control |
| `defensive-security-baseline.md` | 1325 | baseline, resilience, hardening |
| `desktop-app-security.md` | 682 | desktop, electron, memory-safety |
| `detection-engineering.md` | 5275 | detection, telemetry, response |
| `endpoint-vba-security.md` | 323 | endpoint, office-macros, hardening |
| `framework-examples.md` | 1031 | framework-examples, auth, validation |
| `frontend-frameworks-security.md` | 1521 | frontend, ssr, xss |
| `gdpr-security-ops.md` | 1211 | privacy, gdpr, breach-ops |
| `graphql-security.md` | 2936 | graphql, api, authz |
| `hostile-corpus-review.md` | 934 | ai-agents, prompt-injection, content-safety |
| `incident-playbooks.md` | 1278 | incident-response, containment, recovery |
| `iot-ot-security.md` | 724 | iot-ot, segmentation, monitoring |
| `language-patterns.md` | 2742 | code-patterns, injection, deserialization |
| `llm-agent-security.md` | 1790 | ai-agents, prompt-injection, guardrails |
| `mcp-security.md` | 1342 | mcp, ai-agents, tool-security |
| `mobile-security.md` | 610 | mobile, authz, storage |
| `owasp-top10.md` | 605 | appsec, taxonomy, secure-design |
| `pre-push-checklist.md` | 530 | checklist, secrets, dangerous-patterns |
| `privacy-data-minimization.md` | 1456 | privacy, logging, pii |
| `production-error-handling.md` | 1013 | logging, error-handling, information-disclosure |
| `quick-start-ai-coding.md` | 1244 | ai-tooling, onboarding, pre-release-review |
| `rate-limiting-infrastructure.md` | 758 | rate-limiting, abuse-prevention, api |
| `secret-leak-prevention.md` | 1465 | secrets, incident-response, git-hygiene |
| `secure-headers.md` | 477 | headers, browser, transport |
| `security-audit-levels.md` | 1587 | audit-process, maturity, scoping |
| `security-improvements.md` | 805 | roadmap, defense-in-depth, prioritization |
| `security-myths.md` | 1013 | awareness, appsec, anti-patterns |
| `security-testing-examples.md` | 1676 | testing, authz, abuse-cases |
| `session-management.md` | 682 | session, authn, tokens |
| `social-engineering-physical.md` | 628 | human-layer, phishing, physical-security |
| `supply-chain-security.md` | 1374 | supply-chain, dependencies, provenance |
| `threat-modeling.md` | 1702 | threat-modeling, secure-design, abuse-cases |
| `vibecoder-traps.md` | 1016 | ai-tooling, anti-patterns, review |
| `vuln-management.md` | 1447 | vulnerability-management, remediation, sla |
| `webauthn-fido2.md` | 643 | authn, passkeys, phishing-resistance |
| `webhooks-security.md` | 1181 | webhooks, signatures, replay-protection |

## Observations

- The corpus already has clear domain centers: appsec, AI/agent security, identity, privacy, incident response, and governance.
- Overlap risk is highest in the AI-assisted coding cluster and in response/process documents.
- `detection-engineering.md`, `graphql-security.md`, `language-patterns.md`, and `browser-security-modern.md` are the deepest technical references.
- `coverage-matrix.md`, `compliance-mapping.md`, and `security-audit-levels.md` are meta-documents; they should stay clearly distinct from operational references during later refactors.
