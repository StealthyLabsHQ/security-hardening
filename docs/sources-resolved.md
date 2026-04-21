# Sources Resolved — Deep Research Max Run 1

Cleaned consolidation of the `source.md` deliverable (DR Max, Gemini 3.1 Pro, 2026-04-21).
URLs of the form `vertexaisearch.cloud.google.com/grounding-api-redirect/...` (DR bibliography) have been replaced with canonical URLs extracted from the content tables.

## Spot-check validation (2026-04-21)

| Source | URL delivered by DR | Status | Canonical URL |
|---|---|---|---|
| CVE-2024-8309 (LangChain) | nvd.nist.gov/vuln/detail/CVE-2024-8309 | ✓ verified | https://nvd.nist.gov/vuln/detail/CVE-2024-8309 |
| CVE-2024-14021 (LlamaIndex) | nvd.nist.gov/vuln/detail/CVE-2024-14021 | ✓ verified | https://nvd.nist.gov/vuln/detail/CVE-2024-14021 |
| CVE-2025-62353 (Windsurf) | nvd.nist.gov/vuln/detail/CVE-2025-62353 | ✓ verified | https://nvd.nist.gov/vuln/detail/CVE-2025-62353 |
| CVE-2025-59536 (Claude Code) | nvd.nist.gov/vuln/detail/CVE-2025-59536 | ✓ verified | https://nvd.nist.gov/vuln/detail/CVE-2025-59536 |
| Replit Incident 1152 | incidentdatabase.ai/cite/1152 | ✓ verified | https://incidentdatabase.ai/cite/1152/ |
| Anthropic Project Glasswing | anthropic.com/news/project-glasswing | ✗ 404 | https://www.anthropic.com/glasswing |
| PromptArmor Slack AI | promptarmor.com/resources/data-exfiltration-from-slack-ai | ✗ 404 | https://www.promptarmor.com/resources/data-exfiltration-from-slack-ai-via-indirect-prompt-injection |
| CVE-2024-27564 (ChatGPT pickle RCE) | nvd.nist.gov/vuln/detail/CVE-2024-27564 | ⚠ mis-attributed | Actual content: SSRF in `pictureproxy.php` of the third-party fork dirk1983/chatgpt, NOT an agent sandbox RCE. Remove from patch. |

## New validated sources per domain

### AI
- NIST AI 600-1 Generative AI Profile — https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf (2024-07)
- CISA Deploying AI Systems Securely — https://www.cisa.gov/resources-tools/resources/deploying-ai-systems-securely (2024-04)
- MITRE ATLAS — https://atlas.mitre.org (latest)
- Anthropic Project Glasswing / Claude Mythos Preview — https://www.anthropic.com/glasswing (2026)
- CVE-2024-8309 LangChain GraphCypherQAChain SQL injection via PI — https://nvd.nist.gov/vuln/detail/CVE-2024-8309 (2024-10, CVSS 9.8)
- CVE-2024-14021 LlamaIndex BGEM3Index pickle RCE — https://nvd.nist.gov/vuln/detail/CVE-2024-14021 (CWE-502, CVSS 7.8)
- CVE-2025-62353 Windsurf IDE path traversal via indirect PI — https://nvd.nist.gov/vuln/detail/CVE-2025-62353 (2025-10, CVSS 9.8, HiddenLayer)
- CVE-2025-59536 Claude Code startup trust dialog code injection — https://nvd.nist.gov/vuln/detail/CVE-2025-59536 (2025-10, CVSS 8.8, fix ≥1.0.111)
- Anthropic MCP docs — https://modelcontextprotocol.io / https://www.anthropic.com/mcp
- Hines et al. Spotlighting — https://arxiv.org/abs/2403.14720 (2024-03)
- Zou et al. GCG universal adversarial suffixes — https://arxiv.org/abs/2307.15043 (2023-07)
- Wei et al. jailbreak mismatched generalization — https://arxiv.org/abs/2307.02483 (2023-07)
- Perez & Ribeiro ignore previous instructions — https://arxiv.org/abs/2211.09527 (2022-11)
- Carlini et al. training data extraction — https://www.usenix.org/conference/usenixsecurity21/presentation/carlini-extracting (USENIX 2021)
- Greshake et al. indirect prompt injection — https://arxiv.org/abs/2302.12173 (2023-02)
- Slack AI data exfiltration via indirect PI (PromptArmor) — https://www.promptarmor.com/resources/data-exfiltration-from-slack-ai-via-indirect-prompt-injection (2024-08)
- Replit Agent destructive command Incident 1152 (AI Incident Database) — https://incidentdatabase.ai/cite/1152/ (2025-07)
- UK AISI — https://www.aisi.gov.uk
- US AISI — https://www.nist.gov/aisi
- ENISA AI Threat Landscape — https://www.enisa.europa.eu/topics/cybersecurity-threats/threats-and-trends
- EU AI Act (Reg 2024/1689) — https://artificialintelligenceact.eu

### AppSec
- OWASP ASVS 5.0 — https://owasp.org/www-project-application-security-verification-standard/
- CWE Top 25 — https://cwe.mitre.org/top25/
- OWASP API Security Top 10 2023 — https://owasp.org/API-Security/editions/2023/en/0x00-header/
- OWASP GraphQL Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
- RFC 8446 TLS 1.3 — https://datatracker.ietf.org/doc/rfc8446/ (2018-08)
- RFC 9106 Argon2 — https://datatracker.ietf.org/doc/rfc9106/ (2021-09)
- RFC 8725 JWT BCP — https://datatracker.ietf.org/doc/rfc8725/ (2020-02)
- NIST SP 800-175B Rev.1 — https://csrc.nist.gov/pubs/sp/800/175/b/r1/final

### IAM
- WebAuthn Level 3 (W3C CR) — https://www.w3.org/TR/webauthn-3/
- FIDO2 CTAP 2.2 — https://fidoalliance.org/specs/fido-v2.2-rd-20230321/fido-client-to-authenticator-protocol-v2.2-rd-20230321.html
- OAuth 2.1 draft — https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
- OpenID FAPI 2.0 Security Profile — https://openid.net/specs/fapi-2_0-security-profile.html
- SPIFFE spec — https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/

### Compliance
- NIS2 Directive (EU 2022/2555) — https://eur-lex.europa.eu/eli/dir/2022/2555/oj
- DORA Regulation (EU 2022/2554) — https://eur-lex.europa.eu/eli/reg/2022/2554/oj
- PCI DSS 4.0.1 — https://www.pcisecuritystandards.org/document_library/
- NIST SP 800-53 Rev.5 — https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final
- NIST CSF 2.0 — https://www.nist.gov/cyberframework

### Infra
- SLSA v1.0 — https://slsa.dev/spec/v1.0/
- in-toto — https://in-toto.io/specs/
- Sigstore / cosign — https://docs.sigstore.dev
- CycloneDX — https://cyclonedx.org/specification/overview/
- SPDX — https://spdx.dev/specifications/
- CIS Kubernetes Benchmark — https://www.cisecurity.org/benchmark/kubernetes
- NSA/CISA Kubernetes Hardening Guide — https://media.defense.gov/2022/Aug/29/2003066362/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.2_20220829.PDF
- StepSecurity GitHub Actions research — https://www.stepsecurity.io/blog

### Ops
- MITRE ATT&CK — https://attack.mitre.org (v15+)
- Sigma rules — https://sigmahq.io
- Falco — https://falco.org
- CISA KEV catalog — https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- Verizon DBIR (annual) — https://www.verizon.com/business/resources/reports/dbir/
- Mandiant M-Trends — https://www.mandiant.com/m-trends

### Platform
- CISA "The Case for Memory Safe Roadmaps" — https://www.cisa.gov/sites/default/files/2023-12/The-Case-for-Memory-Safe-Roadmaps-508c.pdf (2023-12)
- Electron Security Checklist — https://www.electronjs.org/docs/latest/tutorial/security
- OWASP MASVS — https://mas.owasp.org/MASVS/

### Privacy
- EU-US Data Privacy Framework — https://www.dataprivacyframework.gov/ (2023-07)
- SCCs 2021/914 — https://eur-lex.europa.eu/eli/dec_impl/2021/914/oj
- NIST Privacy Framework 1.0 — https://www.nist.gov/privacy-framework
- ISO/IEC 27701:2019 — https://www.iso.org/standard/71670.html
- CNIL AI how-to sheets — https://www.cnil.fr/en/ai-how-sheets

## Removed sources (deprecated / mis-attributed)

- ~~Google SAIF Risk Assessment~~ — replaced by NIST AI 600-1 + MITRE ATLAS (DR recommendation)
- ~~OpenAI Deployment Safety Hub~~ — replaced by UK/US AISI evaluations
- ~~PodSecurityPolicy (PSP) guide~~ — deprecated in K8s 1.21, removed in 1.25 → Pod Security Admission
- ~~Privacy Shield~~ — invalidated by CJEU Schrems II → EU-US DPF 2023
- ~~NIST CSF 1.1~~ → NIST CSF 2.0
- ~~OAuth 2.0 Implicit Flow~~ → OAuth 2.1 with mandatory PKCE
- ~~PCI DSS 3.2.1~~ → PCI DSS 4.0.1
- ~~OWASP API Security Top 10 2019~~ → 2023
- ~~IoC static blocklists~~ → TTPs via ATT&CK + Sigma
- ~~CVSS-only patch management policies~~ → Risk-Based VM via CISA KEV
- ~~CVE-2024-27564 (mis-attribution)~~ — DR conflated the third-party PHP fork dirk1983/chatgpt with the official ChatGPT product

## Quality notes

- The 47 DR bibliographic references (vertexaisearch redirects) were ignored: URLs are non-persistent and non-citable in a canonical corpus.
- 3 DR hallucinations corrected above.
- Run 1 coverage: 29/100 files (~30%). Run 2 required for the remaining 71.
