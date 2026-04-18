---
title: "Compliance Mapping"
slug: compliance-mapping
category: compliance
depth: 3
audit_level: [3, 4]
last_reviewed: 2026-04-18
sources:
  - "SOC 2 Trust Services Criteria"
  - "ISO/IEC 27001:2022"
  - "PCI DSS v4.0"
  - "HIPAA Security Rule"
  - "NIS2"
  - "DORA"
  - "GDPR"
triggers_strong: ["soc 2 mapping", "iso 27001 mapping", "gdpr crosswalk", "pci mapping"]
triggers_weak: ["compliance mapping", "audit evidence"]
related: ["coverage-matrix", "security-audit-levels"]
---

# compliance-mapping.md

> **Pedagogical crosswalk, not an audit artifact.**
>
> Do not present this mapping to an auditor as evidence of compliance. Use it to orient review scope, evidence collection, and gap analysis only.

> **Scope and session limitation**
>
> This matrix is a curated cross-reference for the files currently maintained in this repository. Treat it as living inventory: whenever `references/` changes, update one row per file that is added, removed, or materially re-scoped.

## Domain semantics

The **Scope** column distinguishes the nature of each reference to avoid conflating pure security controls with privacy obligations:

- **security**: the reference addresses security controls only — no direct GDPR article obligation is the primary driver.
- **privacy**: the reference is primarily driven by privacy governance obligations (RoPA, DPIA, DSAR, DPA, breach notification).
- **both**: the reference serves security and privacy obligations simultaneously (most technical references fall here).

## Cross-reference matrix

| Reference | Focus | SOC 2 CC (TSC) | ISO 27001:2022 Annex A | PCI-DSS v4.0 | HIPAA Security Rule | NIS2 (Annexes I/II + Art. 21) | DORA (Ch. II-IV) | GDPR (RGPD) | Applies to | Scope | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `references/appsec/threat-modeling.md` | Threat identification, attack surfaces, abuse cases, prioritization | CC3.1-CC3.4 (risk identification), CC4.1-CC4.2 (monitoring context), CC9.1-CC9.2 (risk mitigation) | A.5.7 Threat intelligence; A.5.8 Security in project management; A.5.24-.28 incident planning/decision/response/evidence; A.8.25 Secure development lifecycle; A.8.27 Secure system architecture | Req. 6 (secure SDLC, threat/risk-informed design), Req. 12 (governance, risk, responsibility) | §164.308(a)(1)(ii)(A) Risk analysis; §164.308(a)(1)(ii)(B) Risk management; §164.316(b) documentation | Art. 21(2)(a) risk analysis; (b) incident handling; (f) secure development/acquisition/maintenance for Annex I/II entities | Ch. II Art. 5-10 (ICT governance, identification, protection, detection foundations) | Art. 25 (privacy by design — threat model must cover personal data flows and misuse scenarios); Art. 32 (risk-based security measures informed by threat model output); Art. 35 (DPIA trigger identification — abuse cases may reveal high-risk processing requiring a DPIA) | both | both | Threat model diagrams; abuse-case register; PRD/ADR links; risk register; issue tracker items; security review tickets; architecture screenshots |
| `references/appsec/api-security.md` | AuthN/AuthZ, rate limits, input validation, API hardening | CC6.1-CC6.8 (logical access, change control), CC7.1-CC7.5 (monitoring and anomalies), CC8.1 (change management) | A.5.15-.18 access/identity/authentication; A.8.9 Configuration management; A.8.16 Monitoring activities; A.8.20 Network security; A.8.24 Use of cryptography; A.8.25-.29 secure development/testing/coding | Req. 4 (protect data in transit), Req. 6 (secure systems/software), Req. 7-8 (least privilege, auth), Req. 10 (logging), Req. 11 (security testing) | §164.312(a) access control; §164.312(b) audit controls; §164.312(c) integrity; §164.312(e) transmission security | Art. 21(2)(b) incident handling; (d) supply chain / secure procurement where APIs depend on third parties; (f) secure development/maintenance; (h) MFA and secure communications where applicable | Ch. II Art. 6-10 (framework, systems, identification, protection, detection) | Art. 25 (data minimisation in API responses — return only what the consumer needs); Art. 28 (processor obligations when third-party APIs handle personal data — DPA required); Art. 32 (security of processing — AuthN/AuthZ, encryption, access controls); Art. 5(1)(f) (integrity and confidentiality principle) | technical | both | API gateway config; OpenAPI / schema diff; authz tests; rate-limit config; WAF rules; SIEM dashboards; pentest report; CI checks |
| `references/appsec/secure-headers.md` | Basic security headers for browsers and edge | CC6.6-CC6.8; CC7.1 | A.8.9 Configuration management; A.8.20 Network security; A.8.23 Web filtering; A.8.24 Use of cryptography | Req. 2 secure configuration; Req. 4 transit protections; Req. 6 hardening against common web attacks | §164.312(c) integrity; §164.312(e) transmission security | Art. 21(2)(d) business continuity / resilience support via hardened delivery; (f) secure maintenance and vulnerability handling | Ch. II Art. 9 Protection and prevention; Art. 10 Detection (when report-only headers feed telemetry) | Art. 25 (privacy by design/default — headers reduce data leakage and browser fingerprinting by design); Art. 32 (technical measures for integrity and confidentiality — HSTS, CSP, CORS) | technical | both | `curl -I` output; CDN / ingress config; browser devtools screenshot; CSP report samples; change ticket; IaC commit |
| `references/compliance/compliance-mapping.md` | Pedagogical control-to-evidence orientation and audit scoping notes | CC2.1-CC2.3 (communication), CC3.2 (responsibilities) | A.5.31 Legal/regulatory/contractual requirements; A.5.35 Independent review; A.5.36 Compliance with policies/rules; A.5.37 Documented procedures | Req. 12 governance, policies, responsibilities, evidence retention | §164.306 general requirements; §164.308(a)(1) administrative safeguards; §164.316(b) documentation retention | Annex I/II scoping + Art. 21 governance and demonstrability preparation | Ch. II Art. 5 governance and organisation; Art. 6 framework orientation | Art. 5(2) accountability support; Art. 24 controller responsibility support; Art. 30/44-49 documentation planning support only | organizational | both | Draft evidence index; control owner notes; reviewer checklist; gap register |
| `references/ops/detection-engineering.md` | Detection, log sources, correlation, false positives, ATT&CK coverage | CC4.1-CC4.2; CC7.1-CC7.5 | A.5.24-.28 incident management/evidence; A.8.15 Logging; A.8.16 Monitoring activities | Req. 10 log and monitor; Req. 11 test security; Req. 12.10 incident response | §164.308(a)(6) security incident procedures; §164.312(b) audit controls | Art. 21(2)(b) incident handling; (g) basic cyber hygiene / security training support through detections; reporting readiness for Annex I/II entities | Ch. II Art. 10 Detection; Ch. III Art. 17-23 incident management/classification/reporting | Art. 33-34 (breach detection supports the 72h notification window — detection rules provide the earliest awareness signal for personal data incidents); Art. 32 (monitoring as a required technical and organisational measure); Art. 5(1)(f) (integrity and confidentiality — detection closes the monitoring loop) | technical | both | SIEM rule export; sample alerts; tuning runbooks; log onboarding screenshots; detection-as-code repo; false-positive tickets; ATT&CK coverage map |
| `references/appsec/graphql-security.md` | GraphQL-specific controls (depth, cost, introspection, uploads, subscriptions) | CC6.1-CC6.8; CC7.1-CC7.5; CC8.1 | A.5.15-.18 access/auth; A.8.9 configuration; A.8.16 monitoring; A.8.25-.29 SDLC/testing/coding; A.8.31 Separation of development/test/prod where gateway settings differ | Req. 4, 6, 7, 8, 10, 11 | §164.308(a)(1)(ii)(B) risk management; §164.312(a)(b)(c)(e) | Art. 21(2)(b), (d), (f), (h) | Ch. II Art. 6-10 | Art. 25 (data minimisation — field-level AuthZ and disabled introspection prevent over-fetching of personal data); Art. 5(1)(c) (minimisation principle — clients should request only what is necessary); Art. 32 (security of processing — depth/complexity limits, upload controls, subscription auth) | technical | both | Query complexity config; introspection disabled proof; APQ allowlist manifest; websocket auth tests; upload AV scan logs; prod config screenshots |
| `references/appsec/browser-security-modern.md` | Modern browser defenses beyond classic headers | CC6.6-CC6.8; CC7.1 | A.8.9 Configuration management; A.8.20 Network security; A.8.23 Web filtering; A.8.24 Cryptography; A.8.28 Secure coding | Req. 2, 4, 6 | §164.312(c) integrity; §164.312(e) transmission security | Art. 21(2)(d) resilience/hardening; (f) secure maintenance; (h) secure communications where applicable | Ch. II Art. 9 Protection and prevention; Art. 10 Detection when report-only telemetry exists | Art. 25 (privacy by default — Permissions Policy restricts sensitive browser APIs by default; COOP/COEP limit cross-origin data leakage); Art. 32 (technical measures — Trusted Types, SRI, CSP reduce the exploit surface for data exfiltration); Art. 7 / Rec. 32 (Permissions Policy can enforce user consent choices for camera, microphone, geolocation, and payment) | technical | both | Response headers dump; Trusted Types CSP report logs; COOP/COEP browser test screenshot; SRI hash manifest; worker/nginx config; change ticket |

## Applies to semantics

- **technical**: control primarily implemented in code, infrastructure, platform, pipeline, gateway, or CDN.
- **organizational**: control primarily demonstrated through policy, governance, procedure, review, register, or accountability.
- **both**: the control requires both a technical mechanism and a procedural proof.

## Evidence expectations by type

| Evidence type | What an auditor usually wants to see |
|---|---|
| Log | Timestamped sample, useful source field, retention, correlation, associated alert or dashboard |
| Screenshot | Capture of a console or dashboard with tenant/environment/date visible |
| Runbook | Versioned procedure, owner, prerequisites, steps, escalation decision, post-incident learning |
| Ticket | Implementation/review/remediation trail with approver, date, PR link, and status |
| Config / IaC | Versioned file, target environment, code review, deployment proof |
| Test artifact | CI output, unit/integration/security test, load test, DAST/SAST, pentest report |
| Policy / register | Approved version, owner, review frequency, exceptions and compensating controls |
| RoPA | Record of Processing Activities — controller, purpose, legal basis, categories of data, recipients, retention, transfer safeguards |
| DPIA | Data Protection Impact Assessment — risk description, necessity/proportionality analysis, mitigations, DPO opinion if required |
| DPA / SCC / TIA | Data Processing Agreement; Standard Contractual Clauses; Transfer Impact Assessment — for Art. 28 and Art. 44-49 obligations |
| DSAR log | Log of data subject access requests — receipt timestamp, identity verification, response date, data provided or exemption applied |
| Consent / CMP | CMP configuration screenshot; consent log sample with timestamp, version, and signal source |
| Breach record | Art. 33 breach register entry — detection timestamp, nature, categories affected, estimated count, risk assessment, notification decision and timeline |

## Framework-specific audit gap

> **Principle**: this section states the explicit gap between what this skill can support and what a real audit, assessment, or regulatory review still requires.

### SOC 2 Trust Services Criteria

What this skill can support:
- map technical controls to likely CC families,
- suggest evidence types for secure development, logging, access control, and incident handling,
- help reviewers spot obvious control holes before an audit period starts.

What a real SOC 2 review still requires:
- a scoped system description, management assertion, and declared Trust Services Criteria,
- control owners, control frequency, and evidence that controls operated over the audit period,
- population sampling, exception handling, and auditor testing of operating effectiveness,
- Complementary User Entity Controls (CUECs), vendor boundaries, and governance artefacts outside this repo.

### ISO/IEC 27001:2022

What this skill can support:
- orient Annex A control families to engineering artefacts,
- help build evidence pointers for secure development, access, logging, and incident handling,
- highlight technical areas that should feed the Statement of Applicability.

What a real ISO 27001 review still requires:
- a risk methodology, risk treatment plan, and formally approved Statement of Applicability,
- asset inventory, ownership, classification, and applicability decisions,
- internal audit, management review, corrective action tracking, and ISMS governance records,
- supplier, HR, physical, business continuity, and audit-programme controls not proven by this corpus alone.

### PCI DSS v4.0

What this skill can support:
- pre-audit hardening for secure coding, segmentation-adjacent controls, logging, and CI/CD hygiene,
- evidence pointers for application controls and some Req. 6, 7, 8, 10, and 11 activities,
- gap discovery before a QSA or internal PCI review.

What a real PCI assessment still requires:
- defined cardholder data environment (CDE) scope and segmentation validation,
- stored cardholder data protection, key management, and payment-flow evidence,
- quarterly and annual activities such as ASV scans, internal scans, penetration testing, and targeted risk analyses,
- formal compensating control documentation, role assignments, and assessor-reviewed artefacts.

### HIPAA Security Rule

What this skill can support:
- technical safeguard orientation for access control, audit controls, integrity, and transmission security,
- incident-handling and logging practices relevant to ePHI environments,
- engineering gap analysis before a HIPAA security review.

What a real HIPAA review still requires:
- ePHI inventory, system boundaries, and business associate context,
- workforce security, sanction policy, training, contingency planning, and documentation retention artefacts,
- facility access, workstation, device, and media controls under physical safeguards,
- organization-specific legal and compliance interpretation beyond the technical guidance in this repo.

### NIS2

What this skill can support:
- map engineering controls to Article 21 style risk-management measures,
- identify missing incident, development, identity, logging, and supply-chain practices,
- support technical preparation for entity-level cyber hygiene reviews.

What a real NIS2 review still requires:
- confirmation that the entity and services are actually in national scope after transposition,
- management accountability, policy adoption, training, and supervisory governance evidence,
- business continuity, crisis management, supplier oversight, and reporting workflows aligned to local law,
- regulator-facing documentation, contact points, and timeline evidence outside this technical corpus.

### DORA

What this skill can support:
- map technical resilience controls to ICT risk-management and detection themes,
- prepare technical evidence for engineering, incident, and testing discussions,
- expose obvious gaps before financial-sector control reviews.

What a real DORA review still requires:
- confirmation that the entity, service, and ICT third-party relationships are in DORA scope,
- ICT asset inventories, classification logic, major-incident criteria, and regulatory reporting workflows,
- resilience testing programme governance, remediation tracking, and threat-led testing where required,
- board-level governance, registers, and supervisory evidence not contained in this repo.

### GDPR / RGPD

What this skill can support:
- map technical security and privacy-by-design controls to likely GDPR articles,
- identify engineering evidence relevant to data minimisation, security of processing, and breach readiness,
- highlight where technical controls need matching governance artefacts.

What a real GDPR review still requires:
- controller/processor role analysis, lawful basis decisions, and processing-purpose inventory,
- RoPA, DPIA, DPA, SCC, TIA, DSAR, and breach-notification artefacts,
- retention, deletion, transfer, and consent governance that is specific to the organisation and data set,
- legal review and supervisory-context judgment that cannot be inferred from this repository.

## Residual corpus gaps

Even with the downgrade above, the current corpus still leaves meaningful gaps:

- No dedicated RoPA, DPIA, DSAR, DPA, SCC, or TIA template set.
- No physical-security, workforce-screening, or HR governance reference.
- No business continuity / disaster recovery evidence pack beyond incident-response guidance.
- No cardholder-data or ePHI specific scoping workbook.
- No regulator-facing reporting pack for NIS2 or DORA.

## Next extension pass once the real repo is visible

1. Enumerate every file under `references/`.
2. Add one row per file, even if the mapping is "none / informational only".
3. Replace the current generic gaps by a true "uncovered controls" delta per standard.
4. Add links from each row to exact evidence locations (ticket ID, dashboard, runbook, sample log path).
5. Review the GDPR column against the actual personal data inventory — articles are only meaningful once data categories and processing purposes are known.
6. Flag rows where Scope is `both` but no privacy-governance artefact (RoPA entry, DPIA, DPA) is linked — these are the first GDPR audit findings.


