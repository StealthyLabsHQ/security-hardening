---
title: "AI Prompt Data Handling"
slug: ai-prompt-data-handling
category: privacy
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-18
sources:
  - "GDPR Articles 5, 25, 28, 32"
  - "EDPB guidance on generative AI and personal data"
  - "CNIL guidance on AI systems and personal data"
  - "NIST AI Risk Management Framework"
triggers_strong: ["prompt privacy", "ai data handling", "customer data in prompts", "employee data in ai", "prompt redaction"]
triggers_weak: ["ai privacy review", "prompt data", "llm data handling"]
related: ["data-classification-and-handling", "gdpr-security-ops", "ai-tool-profiles", "prompt-and-tool-evidence-handling", "dsar-export-erasure-runbook"]
---

# AI Prompt Data Handling

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (prompt scanning, DLP rules, profile enforcement, and retention controls partly automatable; lawful-use review, exception approval, and high-risk disclosure decisions manual)

Use this guide when teams ask questions like:

- Can I paste customer data into this AI tool?
- Can support upload a ticket export for summarization?
- Can HR, legal, or security use a model on case material?
- What happens to prompts, outputs, uploads, and traces after the task completes?

This file turns privacy and confidentiality concerns around AI use into **operating rules** for prompts, uploads, outputs, traces, and memory.

---

## 1. What counts as AI data handling

For privacy review, do not look only at the prompt box.

An AI workflow may include:

- prompt text,
- uploaded files,
- retrieved documents,
- browser-captured content,
- model outputs,
- conversation history,
- prompt caches,
- embeddings and vectorized memory,
- tool call parameters and tool results,
- evaluation datasets,
- observability traces and support logs.

If a team says "we only used the tool for summarization," ask what exact data entered all of those layers.

---

## 2. Core rule

The privacy question is not only **"is the model approved?"**

The real questions are:

- what exact data entered the workflow,
- what processor or vendor received it,
- whether the use was necessary and proportionate,
- whether the data was minimized first,
- how long prompts and traces persist,
- whether deletion, DSAR, and incident response paths still work.

Approved tooling does not make raw high-risk data automatically appropriate.

---

## 3. Default handling stance by data class

Apply the data classes from `data-classification-and-handling.md` to AI use.

| Data class | Default AI stance |
|---|---|
| `Public` | acceptable in approved tools under normal project policy |
| `Internal` | acceptable in approved tools if not mixed with secrets or restricted exports |
| `Confidential` | minimize, mask, and purpose-limit before use; keep traces controlled |
| `Restricted` | do not paste raw by default; require explicit documented exception, processor review, and stronger approval |

### 3.1 Data that should almost never appear raw in prompts

Treat these as near-default prohibitions for raw prompting:

- passwords, API keys, session tokens, refresh tokens, private keys,
- production database dumps,
- HR investigations, disciplinary records, payroll material,
- legal case files and privileged advice,
- raw support exports containing broad customer histories,
- medical or special-category data,
- payment card data or bank-account details,
- large unredacted incident evidence sets.

When these data types must be analyzed, use a controlled alternative: redacted subset, secure internal workflow, or purpose-built reviewed environment.

---

## 4. Decision gate before prompting

Before using an AI tool, answer these questions:

| Question | If answer is "no" or "unknown" |
|---|---|
| Is this tool approved for the data class involved? | Stop and use an approved environment |
| Is the task achievable with less data? | Minimize first |
| Have direct identifiers and secrets been removed where possible? | Redact first |
| Do we know retention, logging, training, and vendor handling behavior? | Treat as unapproved until clarified |
| Is there a DPA / processor review where required? | Stop for vendor/privacy review |
| Can the result be achieved with a structured subset instead of a raw export? | Use the subset |
| Would we be comfortable attaching the exact prompt and attachment list to an audit ticket? | Reduce the data further |

The fastest safe prompt is usually **smaller**, not smarter.

---

## 5. Prompt minimization patterns

### 5.1 Prefer patterns like these

| Need | Safer pattern |
|---|---|
| summarize a support issue | provide a redacted ticket excerpt and stable case ID |
| debug a customer problem | provide synthetic reproduction or masked request/response fields |
| classify legal or policy text | use extracted clauses, not whole folders of mixed documents |
| review logs | provide selected events with tokens and identifiers removed |
| ask for SQL help | use table shape and representative masked rows |

### 5.2 Avoid patterns like these

- pasting whole inbox threads when only one paragraph matters,
- attaching full CSV exports when five rows would do,
- giving the model unrestricted browse access to sensitive internal knowledge bases,
- using real personal data because masking "takes too long",
- mixing unrelated data subjects in one prompt set.

If the prompt includes more people, more systems, or more history than the task needs, it is probably oversized.

---

## 6. Rules by workflow

### 6.1 Support and customer operations

Allowed default pattern:

- summarize or classify from a **redacted subset**,
- keep case ID and controlled system link outside the prompt if possible,
- do not paste full account history, billing exports, or abuse evidence bundles unless the workflow is explicitly approved.

High-signal red flags:

- screenshots with full inboxes or admin panels,
- raw CSV attachment from support tooling,
- free-text complaint logs with unrelated third-party data,
- prompts that include credentials copied from troubleshooting notes.

### 6.2 HR, recruiting, and employee data

Default stance:

- treat as `Restricted` unless a narrower classification is clearly justified,
- do not use general-purpose prompting on raw employee cases by default,
- require purpose, approval, and processor review for exceptional use.

Examples needing stricter review:

- performance reviews,
- compensation analysis,
- disciplinary cases,
- whistleblower reports,
- medical accommodation material.

### 6.3 Legal and investigations

Default stance:

- preserve privilege and confidentiality assumptions,
- avoid broad third-party tool exposure,
- separate factual extraction from legal judgment,
- retain controlled evidence lineage if the material is case-related.

### 6.4 Security and incident response

Default stance:

- sanitize tokens, secrets, and raw customer identifiers first,
- avoid feeding full forensic bundles into broad tools,
- keep prompt traces subject to the same classification as the underlying incident data.

Use `prompt-and-tool-evidence-handling.md` when prompts or outputs may become evidence.

---

## 7. Vendor and processor review questions

Before approving AI use for sensitive data, answer at least:

- Is the provider acting as a processor/service provider under the relevant contract model?
- Is there a signed DPA or equivalent?
- Where are prompts, uploads, and outputs stored and processed?
- Are prompts used for training, tuning, or product improvement?
- What is the retention window for prompts, files, and logs?
- Can we disable unnecessary retention or history?
- What subprocessors are involved?
- Can data be deleted or made unavailable on termination or request?
- Are admin/audit logs available for usage and downloads?

If the team cannot answer these, the workflow is not ready for `Confidential` or `Restricted` data.

---

## 8. Outputs, traces, and derived data

A privacy review does not end when the prompt is sent.

Treat these as data objects needing controls too:

| Artifact | Risk |
|---|---|
| model output | may repeat personal data, secrets, or incorrect inferences |
| chat history | may persist sensitive content longer than intended |
| prompt cache | may retain content outside the visible chat UX |
| embeddings / memory | may keep personal facts or sensitive fragments retrievable later |
| evaluation datasets | often become shadow copies of sensitive cases |
| support / audit logs | may store prompts and attachments with broad analyst access |

Rules:

- classify outputs according to the most sensitive data they contain,
- do not assume generated summaries are low sensitivity,
- restrict access to histories and traces,
- define deletion and retention for derived artifacts too,
- keep high-risk traces out of broadly searchable systems.

---

## 9. Retention, deletion, and DSAR impact

If personal data enters AI workflows, you need a defensible answer for:

- how long prompts and uploads persist,
- whether histories are user-visible or admin-visible,
- whether outputs, caches, and embeddings are deleted together,
- whether DSAR export or erasure needs to include AI traces,
- how incident evidence is preserved without keeping unnecessary raw copies forever.

### 9.1 Default retention stance

- keep prompt history only as long as needed for the product or support purpose,
- shorten or disable retention where high-sensitivity tasks do not need history,
- separate operational evidence from routine product history,
- ensure deleted accounts or cases do not silently remain in model memory layers.

If an AI system has no clear deletion path, assume it is a poor fit for high-risk personal data.

---

## 10. Approved profiles and environment segmentation

Use tool profiles and environments that match the data sensitivity.

Expected pattern:

- lower-risk projects may use standard approved profiles,
- personal-data-heavy workflows should use the most restrictive approved profile available,
- browser or agent workflows should have separate guardrails from plain text prompting,
- production and admin data should not share the same permissive AI environment as general note-taking.

A single broad AI workspace for everything creates preventable privacy and confidentiality sprawl.

---

## 11. First 30 minutes of an AI privacy review

1. Identify the exact tool, vendor, and profile used.
2. Identify the data classes entering prompts, uploads, outputs, and traces.
3. Check whether minimization and redaction happened before prompting.
4. Review retention, training, and processor terms.
5. Review where histories, logs, and caches are stored.
6. Check whether the workflow affects DSAR, deletion, or incident evidence handling.
7. Record whether the use should be allowed, narrowed, or blocked.

This first pass usually reveals whether the workflow is safe enough to keep or needs redesign.

---

## 12. Common red flags

| Red flag | Why it matters |
|---|---|
| raw customer or employee export pasted into a general chat tool | over-disclosure and processor risk |
| prompts contain credentials or live tokens | immediate security incident risk |
| tool approval is assumed but retention behavior is unknown | shadow storage risk |
| summaries are stored as if they were non-sensitive | derived-data leak risk |
| support screenshots include unrelated user data | excess data disclosure |
| evaluation datasets are copied from real cases without masking | long-lived privacy debt |
| no one knows whether AI traces are covered by deletion workflows | DSAR and retention gap |

---

## 13. Minimum checklist

| Check | Expected |
|---|---|
| Tool is approved for the data class and use case | Yes |
| Prompt and upload content are minimized before use | Yes |
| Secrets and unnecessary identifiers are removed | Yes |
| Processor, retention, and training terms are understood | Yes |
| Outputs, traces, caches, and memory are covered by classification rules | Yes |
| High-risk uses have documented approval and tighter profiles | Yes |
| DSAR, deletion, and incident handling implications are understood | Yes |
| Raw `Restricted` data is not casually pasted into prompts | Yes |

---

## 14. Related references

- `data-classification-and-handling.md`
- `gdpr-security-ops.md`
- `ai-tool-profiles.md`
- `prompt-and-tool-evidence-handling.md`
- `dsar-export-erasure-runbook.md`
