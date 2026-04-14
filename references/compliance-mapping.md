# compliance-mapping.md

> **Portée et limite de session**
>
> Cette matrice est un **best-effort** basé sur les fichiers explicitement visibles dans la demande (`threat-modeling.md`, `api-security.md`, `secure-headers.md`) et les documents générés dans cette session. Le dépôt réel n'étant pas monté dans cet environnement, elle **ne prétend pas couvrir chaque fichier existant de `references/`**. Dès que le corpus réel est disponible, il faut ajouter une ligne par fichier réellement présent.

## Cross-reference matrix

| Reference | Focus | SOC 2 CC (TSC) | ISO 27001:2022 Annexe A | PCI-DSS v4.0 | HIPAA Security Rule | NIS2 (Annexes I/II + Art. 21) | DORA (Ch. II-IV) | Applies to | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| `references/threat-modeling.md` | Identification des menaces, surfaces d'attaque, abuse cases, priorisation | CC3.1-CC3.4 (risk identification), CC4.1-CC4.2 (monitoring context), CC9.1-CC9.2 (risk mitigation) | A.5.7 Threat intelligence; A.5.8 Security in project management; A.5.24-.28 incident planning/decision/response/evidence; A.8.25 Secure development lifecycle; A.8.27 Secure system architecture | Req. 6 (secure SDLC, threat/risk-informed design), Req. 12 (governance, risk, responsibility) | §164.308(a)(1)(ii)(A) Risk analysis; §164.308(a)(1)(ii)(B) Risk management; §164.316(b) documentation | Art. 21(2)(a) risk analysis; (b) incident handling; (f) secure development/acquisition/maintenance for Annex I/II entities | Ch. II Art. 5-10 (ICT governance, identification, protection, detection foundations) | both | Threat model diagrams; abuse-case register; PRD/ADR links; risk register; issue tracker items; security review tickets; architecture screenshots |
| `references/api-security.md` | AuthN/AuthZ, rate limits, input validation, API hardening | CC6.1-CC6.8 (logical access, change control), CC7.1-CC7.5 (monitoring and anomalies), CC8.1 (change management) | A.5.15-.18 access/identity/authentication; A.8.9 Configuration management; A.8.16 Monitoring activities; A.8.20 Network security; A.8.24 Use of cryptography; A.8.25-.29 secure development/testing/coding | Req. 4 (protect data in transit), Req. 6 (secure systems/software), Req. 7-8 (least privilege, auth), Req. 10 (logging), Req. 11 (security testing) | §164.312(a) access control; §164.312(b) audit controls; §164.312(c) integrity; §164.312(e) transmission security | Art. 21(2)(b) incident handling; (d) supply chain / secure procurement where APIs depend on third parties; (f) secure development/maintenance; (h) MFA and secure communications where applicable | Ch. II Art. 6-10 (framework, systems, identification, protection, detection) | technical | API gateway config; OpenAPI / schema diff; authz tests; rate-limit config; WAF rules; SIEM dashboards; pentest report; CI checks |
| `references/secure-headers.md` | Security headers de base pour navigateurs et edge | CC6.6-CC6.8; CC7.1 | A.8.9 Configuration management; A.8.20 Network security; A.8.23 Web filtering; A.8.24 Use of cryptography | Req. 2 secure configuration; Req. 4 transit protections; Req. 6 hardening against common web attacks | §164.312(c) integrity; §164.312(e) transmission security | Art. 21(2)(d) business continuity / resilience support via hardened delivery; (f) secure maintenance and vulnerability handling | Ch. II Art. 9 Protection and prevention; Art. 10 Detection (when report-only headers feed telemetry) | technical | `curl -I` output; CDN / ingress config; browser devtools screenshot; CSP report samples; change ticket; IaC commit |
| `references/compliance-mapping.md` | Traçabilité contrôle -> preuve -> document | CC2.1-CC2.3 (communication), CC3.2 (responsibilities), CC9.2 (risk response traceability) | A.5.31 Legal/regulatory/contractual requirements; A.5.35 Independent review; A.5.36 Compliance with policies/rules; A.5.37 Documented procedures | Req. 12 governance, policies, responsibilities, evidence retention | §164.306 general requirements; §164.308(a)(1) administrative safeguards; §164.316(b) documentation retention | Annex I/II scoping + Art. 21 governance, accountability, demonstrability | Ch. II Art. 5 Governance and organisation; Art. 6 framework; Art. 15 harmonised methods/policies | organizational | Statement of applicability; control library; evidence index; audit binder; policy exception register; reviewer sign-off |
| `references/detection-engineering.md` | Détection, sources de logs, corrélation, faux positifs, couverture ATT&CK | CC4.1-CC4.2; CC7.1-CC7.5 | A.5.24-.28 incident management/evidence; A.8.15 Logging; A.8.16 Monitoring activities | Req. 10 log and monitor; Req. 11 test security; Req. 12.10 incident response | §164.308(a)(6) security incident procedures; §164.312(b) audit controls | Art. 21(2)(b) incident handling; (g) basic cyber hygiene / security training support through detections; reporting readiness for Annex I/II entities | Ch. II Art. 10 Detection; Ch. III Art. 17-23 incident management/classification/reporting | technical | SIEM rule export; sample alerts; tuning runbooks; log onboarding screenshots; detection-as-code repo; false-positive tickets; ATT&CK coverage map |
| `references/graphql-security.md` | Contrôles spécifiques GraphQL (depth, cost, introspection, uploads, subscriptions) | CC6.1-CC6.8; CC7.1-CC7.5; CC8.1 | A.5.15-.18 access/auth; A.8.9 configuration; A.8.16 monitoring; A.8.25-.29 SDLC/testing/coding; A.8.31 Separation of development/test/prod where gateway settings differ | Req. 4, 6, 7, 8, 10, 11 | §164.308(a)(1)(ii)(B) risk management; §164.312(a)(b)(c)(e) | Art. 21(2)(b), (d), (f), (h) | Ch. II Art. 6-10 | technical | Query complexity config; introspection disabled proof; APQ allowlist manifest; websocket auth tests; upload AV scan logs; prod config screenshots |
| `references/browser-security-modern.md` | Défenses navigateur modernes au-delà des headers classiques | CC6.6-CC6.8; CC7.1 | A.8.9 Configuration management; A.8.20 Network security; A.8.23 Web filtering; A.8.24 Cryptography; A.8.28 Secure coding | Req. 2, 4, 6 | §164.312(c) integrity; §164.312(e) transmission security | Art. 21(2)(d) resilience/hardening; (f) secure maintenance; (h) secure communications where applicable | Ch. II Art. 9 Protection and prevention; Art. 10 Detection when report-only telemetry exists | technical | Response headers dump; Trusted Types CSP report logs; COOP/COEP browser test screenshot; SRI hash manifest; worker/nginx config; change ticket |

## Applies to semantics

- **technical**: contrôle majoritairement implémenté dans code, infra, plateforme, pipeline, gateway ou CDN.
- **organizational**: contrôle majoritairement démontré par politique, gouvernance, procédure, revue, registre ou responsabilité.
- **both**: le contrôle exige à la fois un mécanisme technique et une preuve procédurale.

## Evidence expectations by type

| Evidence type | What an auditor usually wants to see |
|---|---|
| Log | Échantillon horodaté, champ source utile, conservation, corrélation, alerte ou dashboard associé |
| Screenshot | Capture d'une console ou d'un tableau de bord avec tenant/environnement/date visibles |
| Runbook | Procédure versionnée, propriétaire, prérequis, étapes, décision d'escalade, post-incident learning |
| Ticket | Trace d'implémentation/revue/remédiation avec approbateur, date, lien PR et statut |
| Config / IaC | Fichier versionné, environnement cible, revue de code, preuve de déploiement |
| Test artifact | Sortie CI, test unitaire/intégration/sécu, charge, DAST/SAST, rapport de pentest |
| Policy / register | Version approuvée, propriétaire, fréquence de revue, exceptions et compensating controls |

## Gaps

> **Principe** : cette section liste les domaines **probablement non couverts** par les références visibles dans la session. Elle doit être recalculée quand le vrai dossier `references/` est disponible.

### SOC 2 CC gaps

- **CC1 / CC2 governance baseline** : code of conduct, board/management oversight, HR accountability, communication cadence.
- **CC5 vendor / workforce responsibilities** : séparation des tâches, onboarding/offboarding, awareness.
- **CC6 physical and environmental dependencies** : si aucune référence ne traite datacenter / workplace / endpoint physical safeguards.
- **CC9 third-party risk lifecycle** : due diligence, contractual clauses, periodic supplier review.

### ISO 27001:2022 gaps

- **A.5.19-.23 supplier / cloud controls** : relations fournisseurs, accords, supply chain, cloud usage.
- **A.6.x people controls** : screening, terms of employment, awareness, disciplinary process.
- **A.7.x physical controls** : physical entry, monitoring, secure areas, media handling.
- **A.5.9 asset inventory / A.5.12 classification / A.5.13 labelling** : si non couverts ailleurs dans le repo.
- **A.5.29-.30 continuity / ICT readiness** : BCP/DR spécifique.
- **A.8.10-.12 deletion, masking, DLP** : protection des données au repos et en sortie.
- **A.8.32 change management / A.8.34 protection of information systems during audit testing** si absents du corpus réel.

### PCI-DSS v4.0 gaps

- **Req. 3** protect stored account data.
- **Req. 5** anti-malware / anti-phishing posture.
- **Req. 9** physical access controls.
- **Req. 12** program governance in depth (roles, risk reviews, awareness, third-party management).
- **Targeted risk analyses / customized approach evidence** si vous utilisez des compensating controls.

### HIPAA Security Rule gaps

- **§164.310 physical safeguards**.
- **§164.308(a)(3) workforce security** and **(a)(5) awareness and training**.
- **§164.308(a)(7) contingency plan**.
- **§164.310(d) device and media controls**.
- **§164.312(d) person or entity authentication** may be only partially covered if MFA / identity proofing are not documented.

### NIS2 gaps

- **Annex I/II applicability register** : quelles entités/services entrent réellement dans le scope.
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

## Next extension pass once the real repo is visible

1. Enumerate every file under `references/`.
2. Add one row per file, even if the mapping is "none / informational only".
3. Replace the current generic gaps by a true "uncovered controls" delta per standard.
4. Add links from each row to exact evidence locations (ticket ID, dashboard, runbook, sample log path).