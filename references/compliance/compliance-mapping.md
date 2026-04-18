---
title: "Compliance Mapping"
slug: compliance-mapping
category: compliance
depth: 3
audit_level: [3, 4]
last_reviewed: null
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
| `references/compliance/compliance-mapping.md` | Control -> evidence -> document traceability | CC2.1-CC2.3 (communication), CC3.2 (responsibilities), CC9.2 (risk response traceability) | A.5.31 Legal/regulatory/contractual requirements; A.5.35 Independent review; A.5.36 Compliance with policies/rules; A.5.37 Documented procedures | Req. 12 governance, policies, responsibilities, evidence retention | §164.306 general requirements; §164.308(a)(1) administrative safeguards; §164.316(b) documentation retention | Annex I/II scoping + Art. 21 governance, accountability, demonstrability | Ch. II Art. 5 Governance and organisation; Art. 6 framework; Art. 15 harmonised methods/policies | Art. 5(2) (accountability principle — mapping demonstrates compliance by design); Art. 24 (controller responsibility for demonstrating compliance); Art. 30 (RoPA — this mapping can anchor records of processing activities); Art. 44-49 (transfer impact assessments and documentation) | organizational | both | Statement of applicability; control library; evidence index; audit binder; policy exception register; reviewer sign-off |
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

## Gaps

> **Principle**: this section lists the areas not yet mapped by the current corpus. Recalculate it whenever `references/` changes or when a document substantially changes scope.

### SOC 2 CC gaps

- **CC1 / CC2 governance baseline**: code of conduct, board/management oversight, HR accountability, communication cadence.
- **CC5 vendor / workforce responsibilities**: separation of duties, onboarding/offboarding, awareness.
- **CC6 physical and environmental dependencies**: if no reference covers datacenter / workplace / endpoint physical safeguards.
- **CC9 third-party risk lifecycle**: due diligence, contractual clauses, periodic supplier review.

### ISO 27001:2022 gaps

- **A.5.19-.23 supplier / cloud controls**: supplier relationships, agreements, supply chain, cloud usage.
- **A.6.x people controls**: screening, terms of employment, awareness, disciplinary process.
- **A.7.x physical controls**: physical entry, monitoring, secure areas, media handling.
- **A.5.9 asset inventory / A.5.12 classification / A.5.13 labelling**: if not covered elsewhere in the repo.
- **A.5.29-.30 continuity / ICT readiness**: specific BCP/DR.
- **A.8.10-.12 deletion, masking, DLP**: data protection at rest and at egress.
- **A.8.32 change management / A.8.34 protection of information systems during audit testing** if absent from the actual corpus.

### PCI-DSS v4.0 gaps

- **Req. 3** protect stored account data.
- **Req. 5** anti-malware / anti-phishing posture.
- **Req. 9** physical access controls.
- **Req. 12** program governance in depth (roles, risk reviews, awareness, third-party management).
- **Targeted risk analyses / customized approach evidence** if compensating controls are in use.

### HIPAA Security Rule gaps

- **§164.310 physical safeguards**.
- **§164.308(a)(3) workforce security** and **(a)(5) awareness and training**.
- **§164.308(a)(7) contingency plan**.
- **§164.310(d) device and media controls**.
- **§164.312(d) person or entity authentication** may be only partially covered if MFA / identity proofing are not documented.

### NIS2 gaps

- **Annex I/II applicability register**: which entities/services actually fall within scope.
- **Art. 21(2)(c)** business continuity, backup, disaster recovery, crisis management.
- **Art. 21(2)(d)** supply-chain security end-to-end.
- **Art. 21(2)(e)** security in acquisition/development/maintenance if SDLC evidence is incomplete.
- **Art. 21(2)(g)** basic cyber hygiene and training.
- **Art. 21(2)(h)** cryptography, encryption, MFA and secure voice/text/video where relevant.
- **Reporting workflow** (24h early warning / 72h notification / final report at national transposition level) if no operational playbook exists.

### DORA gaps (Ch. II-IV only)

- **Chapter II** governance ownership, ICT asset inventory, backup/restoration, communication strategy, learning/evolving loop.
- **Chapter III** classification of ICT incidents, root-cause analysis, major-incident reporting workflow, evidence retention.
- **Chapter IV** resilience testing programme, periodic test calendar, scope/rules of engagement, remediation tracking, threat-led testing where applicable.

### GDPR gaps (security + privacy governance)

The GDPR column in the matrix above covers only the articles directly supported by each reference. The following obligations are likely **not covered** by the current technical corpus and require dedicated governance artefacts:

**Security-side gaps** (Art. 32 support missing):
- No pseudonymisation / anonymisation pattern reference.
- No encryption-at-rest configuration guide.
- No data retention enforcement mechanism or deletion runbook.
- No DLP / egress filtering reference.

**Privacy governance gaps** (no technical reference covers these):
- **Art. 30 — RoPA**: no record of processing activities template or maintenance procedure.
- **Art. 35 — DPIA**: no DPIA template, trigger checklist, or pre-DPIA screening guide.
- **Art. 33-34 — Breach notification**: no 72h notification runbook, no breach register template, no authority contact list.
- **Art. 28 — DPA / vendor review**: no data processing agreement template, no vendor privacy review checklist.
- **Art. 6 / 7 — Legal basis and consent**: no consent management playbook, no legal basis register.
- **Art. 17 — Right to erasure**: no DSAR workflow, no erasure runbook, no SLA for response.
- **Art. 44-49 — International transfers**: no TIA template, no SCC management process.
- **Art. 37-39 — DPO**: no DPO appointment record or consultation log if a DPO is required.
- **Accountability package (Art. 24)**: no overarching privacy policy, no training records, no internal audit schedule.

## Next extension pass once the real repo is visible

1. Enumerate every file under `references/`.
2. Add one row per file, even if the mapping is "none / informational only".
3. Replace the current generic gaps by a true "uncovered controls" delta per standard.
4. Add links from each row to exact evidence locations (ticket ID, dashboard, runbook, sample log path).
5. Review the GDPR column against the actual personal data inventory — articles are only meaningful once data categories and processing purposes are known.
6. Flag rows where Scope is `both` but no privacy-governance artefact (RoPA entry, DPIA, DPA) is linked — these are the first GDPR audit findings.


