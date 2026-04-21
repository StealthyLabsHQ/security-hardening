# Prompt Deep Research Max — Run 2 (fichiers restants)

Second run ciblé sur les fichiers non couverts par `docs/sources-resolved.md` (run 1).
Même format de livrable que le run 1 (section par fichier : Sources vérifiées / À ajouter / À retirer / Excerpts).

## Contexte condensé

Repo public : `https://github.com/StealthyLabsHQ/security-hardening`
Structure : `references/<domain>/<slug>.md` avec frontmatter YAML contenant `sources: []`.
Fetche les fichiers directement via URL context. Ne pas joindre.

## Contraintes de qualité (reprise du run 1)

- URLs canoniques vivantes (vérifier live, archive.org si 404)
- Accepter : NIST, ISO, IETF RFC, W3C, OWASP, MITRE, CISA, ENISA, ANSSI, CNIL, EDPB, vendor docs, papers DOI
- Refuser : blogs, StackOverflow, YouTube non-conférence
- **IMPORTANT — NE PAS** utiliser de redirections `vertexaisearch.cloud.google.com/grounding-api-redirect/...`. Livre l'URL cible directement.
- **IMPORTANT — Vérifier les CVEs** : si tu cites CVE-XXXX-YYYYY, vérifie que le CVE existe sur `nvd.nist.gov/vuln/detail/` ET que le produit/description correspond au claim. Le run 1 avait mal attribué CVE-2024-27564 (SSRF PHP fork ≠ agent RCE).
- Fenêtre 2023-04 → 2026-04 prioritaire ; plus ancien seulement si canonique

## Format livrable par fichier

```markdown
### references/<domain>/<slug>.md

**Sources vérifiées**
| # | Actuel | Titre complet | URL | Version/Date | Statut | Claim |

**À ajouter**
| Source | URL | Date | Gap comblé | Priorité (P0/P1/P2) |

**À retirer**
| Source | Raison | Remplacée par |

**Excerpts citables**
> « ... » — Ref X §Y p.Z
```

## Fichiers à traiter (71)

### AI — 11 fichiers (P0)
- `references/ai/agent-approval-patterns.md`
- `references/ai/agent-memory-and-context-retention.md`
- `references/ai/ai-cli-hardening.md`
- `references/ai/ai-ide-no-code-security.md`
- `references/ai/ai-system-release-gates.md`
- `references/ai/ai-tool-profiles.md`
- `references/ai/connector-and-integration-governance.md`
- `references/ai/multi-agent-boundaries-and-delegation.md`
- `references/ai/prompt-and-tool-evidence-handling.md`
- `references/ai/quick-start-ai-coding.md`
- `references/ai/vibecoder-traps.md`

Sources probables : OWASP Top 10 LLM v2025, NIST AI 600-1, MITRE ATLAS, Anthropic MCP/Computer Use docs, OpenAI Preparedness, CVE cataloguées 2024-2026 sur Claude Code / Cursor / Windsurf / LangChain / LlamaIndex, papers USENIX/IEEE S&P/CCS/NDSS sur agent misalignment, tool poisoning, memory persistence exploits.

### AppSec — 12 fichiers (P1)
- `browser-security-modern.md` → W3C CSP L3, Trusted Types, Fetch Metadata, COOP/COEP/CORP, SameSite RFC 6265bis
- `database-security.md` → OWASP DB Cheat Sheets, NIST SP 800-53 AC/SC, PCI DSS 4.0.1 §3
- `framework-examples.md` → OWASP framework guides (Express, Django, Spring, Rails)
- `frontend-frameworks-security.md` → React/Vue/Angular security advisories, Snyk research
- `language-patterns.md` → CERT Secure Coding Standards (C/C++, Java), OWASP language-specific
- `production-error-handling.md` → OWASP Error Handling Cheat Sheet, Google SRE error budgets
- `secure-headers.md` → OWASP Secure Headers Project, web.dev headers guidance, HSTS preload list
- `security-diff-review.md` → Google Code Review Guidelines, OWASP Code Review Guide
- `security-myths.md` → cross-ref academic sources challenging myths
- `security-testing-examples.md` → OWASP WSTG v4.2, OWASP ASVS test cases, PortSwigger Academy
- `threat-modeling.md` → STRIDE (Microsoft), MITRE ATT&CK, OWASP Threat Modeling, Shostack "Threat Modeling" book
- `webhooks-security.md` → Stripe/GitHub/Slack webhook signing docs, RFC 8292 VAPID, OWASP Webhook Security

### Compliance — 8 fichiers (P2)
- `audit-sample-request-response.md`
- `control-ownership-and-review-cadence.md`
- `coverage-matrix.md`
- `customer-security-questionnaire-response-pack.md`
- `evidence-redaction-and-sharing-rules.md`
- `nis2-dora-operational-evidence.md`
- `regulator-notification-decision-matrix.md`
- `soc2-iso27001-evidence-packs.md`

Sources probables : AICPA Trust Services Criteria 2022, ISO/IEC 27001:2022 Annex A, ENISA NIS2 implementation guide, DORA RTS/ITS publiés par ESAs, EDPB breach notification guidelines 9/2022, FedRAMP assessment handbook.

### IAM — 9 fichiers (P1)
- `active-directory-hardening.md` → Microsoft Tiered Admin Model, NSA AD hardening, SpecterOps BloodHound papers
- `authorization-rbac.md` → NIST SP 800-162 ABAC, OWASP Authz Cheat Sheet, Zanzibar paper (Google)
- `authorization-regression-testing.md` → OWASP Authz Testing Cheat Sheet, OPA/Rego docs
- `cloud-iam-hardening.md` → AWS IAM best practices, GCP IAM Recommender, Azure Conditional Access
- `identity-lifecycle-jml.md` → NIST SP 800-63-4 enrollment, SCIM 2.0 RFC 7644
- `machine-identity-and-service-accounts.md` → SPIFFE/SPIRE, AWS Roles Anywhere
- `service-account-inventory-and-ownership.md` → CIS Controls 5&6, Netflix ConsoleMe
- `session-management.md` → OWASP Session Management Cheat Sheet, RFC 6265bis, OAuth 2.0 Token Introspection RFC 7662
- `temporary-access-and-break-glass-governance.md` → Netflix BLESS, Google BeyondCorp, NIST SP 800-63-4 §5

### Infra — 6 fichiers (P2)
- `cloud-container-runnable-hardening-tests.md` → kube-bench, Docker Bench, conftest, OPA gatekeeper
- `iot-ot-security.md` → IEC 62443, NIST SP 800-82 Rev.3, ENISA IoT baseline
- `policy-exception-handling.md` → Google SRE error budget policy, SOC 2 CC 3.1
- `rate-limiting-infrastructure.md` → RFC 6585, OWASP API4:2023, Envoy rate limit service
- `secrets-manager-boundaries-and-injection-patterns.md` → HashiCorp Vault docs, AWS Secrets Manager rotation, CVE Vault 2024+
- `terraform-policy-as-code-recipes.md` → HashiCorp Sentinel, Open Policy Agent, Checkov/tfsec/Trivy rulesets

### Ops — 10 fichiers (P2)
- `defensive-security-baseline.md` → CIS Controls v8.1, NIST CSF 2.0 core
- `detection-translations.md` → Sigma backend mappings (Splunk SPL, Elastic, CrowdStrike)
- `pre-push-checklist.md` → OWASP Pre-push, gitleaks, GitHub secret scanning
- `secret-leak-prevention.md` → GitGuardian state of secrets sprawl, TruffleHog, GitHub push protection
- `secure-workstation-builds.md` → CIS Workstation Benchmarks, Microsoft Security Baselines
- `security-audit-levels.md` → OWASP SAMM, BSIMM
- `security-backlog-triage-and-prioritization.md` → OWASP SAMM, FIRST EPSS
- `security-improvements.md` → NIST CSF 2.0, Google SRE workbook
- `security-metrics-kpis.md` → FIRST EPSS, CISA CPG metrics, Google SRE SLOs
- `social-engineering-physical.md` → SANS social engineering whitepaper, CISA phishing guidance, NIST SP 800-50

### Platform — 9 fichiers (P2)
- `browser-isolation-and-profile-segmentation.md` → Chrome Enterprise docs, Menlo/Cloudflare Browser Isolation, NIST SP 800-152
- `developer-workstation-secrets-and-local-ai.md` → GitHub Copilot enterprise privacy, Cursor privacy mode, ollama hardening
- `electron-update-and-auto-update-hardening.md` → Electron auto-updater security, code signing guides, Squirrel.Mac
- `endpoint-vba-security.md` → Microsoft ASR rules, MITRE ATT&CK T1137, Office macro hardening
- `high-trust-admin-workstations.md` → Microsoft PAW, Google BeyondCorp, NIST SP 800-171
- `mdm-baselines-intune-jamf-kandji.md` → CIS Mobile Benchmarks, Apple Device Management, Intune security baselines
- `mobile-security.md` → OWASP MASVS/MSTG, Apple Platform Security, Android Security Model
- `remote-browser-isolation-and-disposable-browsing.md` → NIST SP 800-152, Menlo/Cloudflare docs
- `saas-admin-browser-separation.md` → Microsoft Secure Admin Workstation, Google BeyondCorp

### Privacy — 9 fichiers (P2)
- `ai-prompt-data-handling.md` → OpenAI API data usage policy, Anthropic data retention, EDPB AI guidelines
- `data-classification-and-handling.md` → NIST SP 800-60, ISO/IEC 27701
- `dsar-export-erasure-runbook.md` → EDPB Guidelines 01/2022 DSAR, CNIL DSAR toolkit
- `privacy-data-minimization.md` → GDPR Art. 5(1)(c), EDPB Guidelines 4/2019 on Art. 25, NIST Privacy Framework
- `privacy-review-for-ai-vendors.md` → EDPB AI guidelines, CNIL AI how-to sheets, ICO AI guidance
- `privacy-safe-analytics-and-product-instrumentation.md` → GA4 privacy, IAB TCF, ePrivacy Directive
- `retention-enforcement-and-deletion-evidence.md` → GDPR Art. 5(1)(e), ISO/IEC 27040 storage security
- `ropa-dpia-dpa-scc-tia-template-pack.md` → GDPR Art. 30/35, SCCs 2021/914, EDPB TIA guidance
- `screenshot-and-support-artifact-handling.md` → ISO/IEC 27701, OWASP Logging Cheat Sheet, PCI DSS §3.4
- `vendor-and-processor-tiering.md` → GDPR Art. 28, ISO/IEC 27036, NIST SP 800-161 Rev.1

### Core — 1 fichier (P0)
- `references/_core-invariants.md` → déjà bien sourcé (ASVS, Cheat Sheets, NIST SP 800-63B) mais mériter une vérification URL + ajout MITRE CWE Top 25.

## Livraison

Document markdown unique, un titre par fichier. Patch directement injectable.
Signaler hallucinations CVE/source comme le run 1 a pu en produire.
Ne pas dupliquer les sources déjà documentées dans `docs/sources-resolved.md` (runt 1) — ré-utiliser quand pertinent (ex: OWASP Top 10 LLM v2025 reste la même URL pour les 11 fichiers AI).
