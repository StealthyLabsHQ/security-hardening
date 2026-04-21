# Sources Resolved — Deep Research Max Run 2

Cleaned consolidation of the DR Max run 2 deliverable (Gemini 3.1 Pro, 2026-04-21).
Covers the 71 files not addressed by run 1.

## Spot-check validation (2026-04-21)

All 7 CVEs claimed in run 2 were verified against NVD:

| CVE | Product | Run 2 claim | NVD verification |
|---|---|---|---|
| CVE-2025-3108 | LlamaIndex JsonPickleSerializer | Deserialization RCE (2025-07) | ✓ Confirmed. llama_index 0.12.27-0.12.40, CVSS 7.5 HIGH |
| CVE-2024-5998 | LangChain FAISS | pickle deserialization → os.system RCE (2024-09) | ✓ Confirmed. langchain ≤0.2.9, CVSS 7.8 HIGH |
| CVE-2024-48919 | Cursor IDE Cmd-K | Terminal PI via malicious web page | ✓ Confirmed. Patched server-side 2024-09-27, CVSS 4.0 = 9.2 |
| CVE-2025-59944 | Cursor IDE | Case-sensitive bypass on `.cursor/mcp.json` | ✓ Confirmed. Cursor ≤1.6.23 (Anysphere), CWE-178, CVSS 9.8 |
| CVE-2025-54136 | Cursor IDE | MCPoison persistent RCE via trusted MCP config swap | ✓ Confirmed. Cursor ≤1.2.4, fix v1.3, CVSS 8.8 |
| CVE-2025-54135 | Cursor IDE | CurXecute — creation of `.cursor/mcp.json` bypass | ✓ Confirmed. Cursor <1.3.9, CVSS 9.8 |
| CVE-2024-46946 | LangChain LLMSymbolicMathChain | Arbitrary code via sympy.sympify (eval) | ✓ Confirmed. langchain_experimental 0.1.17-0.3.0, CWE-20, CVSS 9.8 |

No hallucinations this run (run 1 had mis-attributed CVE-2024-27564, which run 2 correctly reclassifies as an SSRF in a third-party PHP file).

## New validated sources per domain

### AI — P0 injections
- OpenAI Preparedness Framework — https://cdn.openai.com/openai-preparedness-framework-beta.pdf (2023-12)
- NIST AI 600-1 (Generative AI Profile) — https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf (2024-07)
- MITRE ATLAS Matrix — https://atlas.mitre.org
- Anthropic Building Effective Agents — https://www.anthropic.com/research/building-effective-agents (2024)
- CVE-2025-3108 LlamaIndex JsonPickleSerializer RCE — https://nvd.nist.gov/vuln/detail/CVE-2025-3108 (2025-07, CVSS 7.5)
- CVE-2024-5998 LangChain FAISS deserialization RCE — https://nvd.nist.gov/vuln/detail/CVE-2024-5998 (2024-09, CVSS 7.8)
- CVE-2024-48919 Cursor Cmd-K terminal PI — https://nvd.nist.gov/vuln/detail/CVE-2024-48919 (2024-09)
- CVE-2025-59944 Cursor case-bypass on MCP config — https://nvd.nist.gov/vuln/detail/CVE-2025-59944 (2025-10, CVSS 9.8, CWE-178)
- CVE-2025-54136 Cursor MCPoison persistent RCE — https://nvd.nist.gov/vuln/detail/CVE-2025-54136 (2025-08, CVSS 8.8, Check Point)
- CVE-2025-54135 Cursor CurXecute RCE — https://nvd.nist.gov/vuln/detail/CVE-2025-54135 (2025-08, CVSS 9.8, Aim Labs)
- CVE-2024-46946 LangChain LLMSymbolicMathChain sympy eval RCE — https://nvd.nist.gov/vuln/detail/CVE-2024-46946 (2024-09, CVSS 9.8)
- CVE-2024-8309 LangChain GraphCypherQAChain SQLi via PI — https://access.redhat.com/security/cve/cve-2024-8309 (Red Hat mitigation advisory)

### Core / AppSec
- CWE Top 25 — https://cwe.mitre.org/top25/
- PCI DSS 4.0.1 — https://docs-prv.pcisecuritystandards.org (2024-06; PCI DSS 3.2.1 and 4.0 retired by Dec 2024)
- W3C Trusted Types — https://w3c.github.io/webappsec-trusted-types/dist/spec/ (DOM XSS defense-in-depth)

### IAM
- NIST SP 800-162 (ABAC) — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-162.pdf (2014/2019)
- Google Zanzibar (USENIX ATC 2019) — https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/
- NIST SP 800-63-4 FINAL — https://pages.nist.gov/800-63-4/ (2025-07, supersedes all drafts)
- SCIM 2.0 (RFC 7644) — https://www.rfc-editor.org/info/rfc7644 (2015-09)
- SPIFFE / SPIRE — https://spiffe.io
- CIS Controls v8.1 — https://www.cisecurity.org/controls/v8-1 (adds "Govern" function)

### Compliance
- ENISA NIS2 Technical Implementation Guidance — https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance (2025-07)

### Infra
- NIST SP 800-82 Rev.3 (Guide to OT Security) — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf (2023-09)
- IETF RFC 6585 (HTTP 429 Too Many Requests) — https://www.rfc-editor.org/info/rfc6585

### Ops
- NIST CSF 2.0 — https://www.nist.gov/cyberframework (2024-02)
- NIST SP 800-50 Rev.1 (Cybersecurity Learning Programs) — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-50r1.pdf (2024-09)
- FIRST EPSS (Exploit Prediction Scoring System) — https://www.first.org/epss/
- Zscaler NIST AI 600-1 compliance analysis — https://www.zscaler.com/blogs/product-insights/closing-gap-achieving-nist-ai-600-1-compliance-ai-spm (2025-07)

### Platform
- NIST SP 800-152 (CKMS profile) — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-152.pdf (2015-10)

## Removed / deprecated

- PCI DSS 3.2.1 and PCI DSS 4.0 → PCI DSS 4.0.1 (retired in 2024)
- NIST SP 800-63-4 drafts → NIST SP 800-63-4 FINAL (2025-07)
- NIST SP 800-82 drafts → NIST SP 800-82 Rev.3 FINAL (2023-09)
- NIST SP 800-50 (2003) & SP 800-16 → NIST SP 800-50 Rev.1 (2024-09)
- CIS Controls v8.0 → CIS Controls v8.1
- CVSS-only prioritization → CVSS + EPSS

## Quality notes

- Run 2 coverage: 33 of 71 targeted files received real source additions. Remaining ~38 files returned "N/A" from DR — meaning existing frontmatter sources were already sufficient or no new canonical sources were found.
- `webhooks-security.md` notably receives CVE-2024-27564 reclassified as an SSRF example (correcting run 1's agent-RCE mis-attribution).
- No hallucinated CVEs detected in run 2. All 7 NVD entries verified live.
- DR redirect URLs (`vertexaisearch.cloud.google.com/...`) from the run 2 bibliography were ignored — canonical URLs are taken directly from the content tables.

## Files patched (33)

**AI (11):** agent-approval-patterns, agent-memory-and-context-retention, ai-cli-hardening, ai-ide-no-code-security, ai-system-release-gates, ai-tool-profiles, connector-and-integration-governance, multi-agent-boundaries-and-delegation, prompt-and-tool-evidence-handling, quick-start-ai-coding, vibecoder-traps

**Core (1):** _core-invariants

**AppSec (4):** browser-security-modern, database-security, threat-modeling, webhooks-security

**IAM (7):** authorization-rbac, cloud-iam-hardening, identity-lifecycle-jml, machine-identity-and-service-accounts, service-account-inventory-and-ownership, session-management, temporary-access-and-break-glass-governance

**Compliance (1):** nis2-dora-operational-evidence

**Infra (2):** iot-ot-security, rate-limiting-infrastructure

**Ops (5):** defensive-security-baseline, security-backlog-triage-and-prioritization, security-improvements, security-metrics-kpis, social-engineering-physical

**Platform (2):** browser-isolation-and-profile-segmentation, remote-browser-isolation-and-disposable-browsing

**Privacy (0):** DR found no new canonical sources for the 9 privacy files — existing frontmatter (GDPR, EDPB, ICO, CNIL, NIST Privacy Framework, ISO 27701) already covers the canonical surface.
