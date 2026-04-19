---
title: "Privacy Review for AI Vendors"
slug: privacy-review-for-ai-vendors
category: privacy
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-19
sources:
  - "GDPR Articles 5, 28, 32, 44-49"
  - "EDPB guidance on generative AI and personal data"
  - "CNIL guidance on AI systems and processors"
  - "NIST AI RMF third-party and data-governance patterns"
  - "Common enterprise AI vendor assessment practices"
triggers_strong: ["ai vendor privacy review", "review ai vendor", "llm vendor review", "processor review for ai", "ai tool privacy"]
triggers_weak: ["ai vendor", "prompt privacy review", "ai processor"]
related: ["vendor-and-processor-tiering", "ai-prompt-data-handling", "data-classification-and-handling", "ropa-dpia-dpa-scc-tia-template-pack", "privacy-safe-analytics-and-product-instrumentation"]
---

# Privacy Review for AI Vendors

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 2-4 | Automation: Partial (inventory state, contract presence, retention settings, and admin-control verification partly automatable; proportionality analysis, lawful-basis review, and transfer-risk judgment manual)

Use this guide when a team wants to onboard or expand use of:

- a hosted LLM or chat assistant,
- an AI coding tool,
- an AI summarization or support assistant,
- a browser-based AI productivity tool,
- an AI platform embedded into another vendor workflow,
- any tool that can receive prompts, uploads, traces, or derived data.

The question is not only whether the tool is useful. The question is whether the vendor’s data handling, retention, subprocessor model, and admin features are acceptable for the data classes and workflows involved.

---

## 1. Core rule

An AI vendor privacy review should establish all of these clearly:

1. **what exact data can enter the tool,**
2. **what the vendor stores and for how long,**
3. **whether prompts, files, outputs, logs, or traces are used for training or improvement,**
4. **what subprocessors and regions are involved,**
5. **what controls the customer has over history, retention, deletion, and admin visibility.**

If any of these are unclear, the tool is not ready for meaningful `Confidential` or `Restricted` use.

---

## 2. What makes AI vendor review different

AI vendors often create more data surfaces than ordinary SaaS tools.

Possible data layers include:

- prompt text,
- uploads and attachments,
- retrieved internal knowledge,
- browser-captured content,
- generated outputs,
- conversation history,
- cached context,
- evaluations and feedback traces,
- admin and usage logs,
- model-improvement or quality-review datasets.

A vendor may say “we do not train on your data” while still retaining prompts, logs, or support traces long enough to create meaningful privacy and confidentiality exposure.

---

## 3. First classification questions

Before reviewing the vendor, classify the intended use.

| Question | Why it matters |
|---|---|
| what data classes may enter prompts or uploads | determines review depth |
| will the tool see regulated or restricted data | may force Tier 3 review or prohibition |
| is use optional productivity support or core operational processing | affects proportionality and dependency |
| can the tool browse repos, tickets, browsers, or internal systems | expands data capture scope |
| can outputs or logs become new records | affects retention and DSAR scope |

Do not begin with the vendor questionnaire alone. Start with your own intended use and data exposure.

---

## 4. Minimum review areas

Every AI vendor privacy review should cover at least:

- role of the vendor: processor, controller, or mixed role,
- categories of prompts, uploads, outputs, and traces,
- retention windows for each data surface,
- ability to disable history or training where relevant,
- regions of storage and processing,
- subprocessor list and change-notice process,
- deletion and export capabilities,
- admin controls and auditability,
- contractual terms for security, confidentiality, and incident notice.

If one of these areas is “not documented,” treat it as unresolved risk, not as assumed safe behavior.

---

## 5. Review questions by topic

### 5.1 Data ingestion

Ask:

- what content types can be submitted,
- whether browser extension, IDE plugin, or CLI automatically collects context,
- whether metadata such as filenames, URLs, repo names, or user IDs are also sent,
- whether screenshots, recordings, or copied context can be retained separately.

### 5.2 Retention and history

Ask:

- how long prompts, uploads, outputs, and logs persist,
- whether admins can disable history,
- whether deleted content leaves backups or support traces,
- whether user-side deletion is immediate, delayed, or best effort.

### 5.3 Training and product improvement

Ask:

- whether customer content is used for model training, fine-tuning, review, or safety tuning,
- whether opt-out is supported and enforced technically,
- whether “service improvement” covers human review or dataset retention.

### 5.4 Access and subprocessors

Ask:

- who at the vendor can access content,
- what subprocessors or model providers are involved,
- whether content leaves the main vendor boundary,
- whether regional isolation is available.

### 5.5 Data-subject and deletion support

Ask:

- whether content can be exported per tenant or user,
- whether deletion requests can be fulfilled with meaningful scope,
- whether logs, prompt history, and derivative traces are included,
- whether contract termination includes deletion or return commitments.

---

## 6. High-risk AI vendor patterns

Treat these as strong escalation triggers:

- unclear or broad “service improvement” rights,
- no admin ability to control history or retention,
- unclear regional processing or subprocessor chain,
- browser or IDE integration with broad automatic context capture,
- inability to distinguish prompt content from logs or support traces,
- inability to export or delete tenant content clearly,
- customer content potentially commingled with broad evaluation or tuning workflows,
- vague answers about whether copied context includes code, tickets, secrets, or repository metadata.

If a vendor cannot explain its data surfaces clearly, the review should not proceed as if the risk were low.

---

## 7. Recommended review by data class

| Intended data exposure | Recommended stance |
|---|---|
| Public only | lightweight privacy and contract review may be enough |
| Internal low sensitivity | approved use may be possible with retention clarity and admin controls |
| Confidential | require strong review of retention, vendor role, traces, and history controls |
| Restricted / regulated | require formal privacy, legal, and security signoff; often prohibit general-purpose use |

Do not let a pleasant UI trick teams into treating a broad AI platform as a low-risk note-taking tool.

---

## 8. AI-specific contract topics

In addition to standard processor or vendor terms, look for clarity on:

- model-improvement use of customer data,
- prompt and output retention windows,
- history controls,
- subprocessor and model-provider disclosure,
- support-access limits,
- cross-border processing,
- deletion on termination,
- breach-notification timelines,
- customer admin logging and governance controls.

The absence of AI-specific language in the contract is itself useful signal.

---

## 9. Admin and tenant controls to verify

Prefer vendors where tenant admins can control or verify at least:

- user and group access,
- history retention settings,
- disablement of training or product-improvement use where offered,
- plugin, connector, or browser-integration scope,
- audit visibility for uploads, exports, and admin actions,
- region or residency options where contractually needed,
- deletion workflows for content and workspaces.

A vendor that offers strong marketing claims but weak tenant controls should not be treated as mature for sensitive use.

---

## 10. Relationship to internal policy

A vendor review never replaces internal data-handling rules.

Even after approval:

- prompt minimization still applies,
- restricted data may still require separate approval,
- AI outputs and traces may still be subject to retention and DSAR rules,
- browser and plugin access may still need tiered approval,
- some teams such as HR, legal, or incident response may need stricter rules than engineering.

Approval means the vendor is acceptable **for defined use**, not universally safe for all content.

---

## 11. Good evidence package for review

Useful evidence includes:

- completed review questionnaire,
- vendor privacy terms or DPA,
- retention and training statements,
- subprocessor list,
- admin console screenshots showing controls,
- data-flow summary for your intended use,
- signoff from privacy, security, and legal where required,
- exception or restriction notes.

This evidence should be attached to the vendor record or processor review, not left scattered across chat threads.

---

## 12. Suggested approval outcomes

Standardize outcome labels.

| Outcome | Meaning |
|---|---|
| Approved for limited internal use | low-risk data only under defined profile |
| Approved for confidential use with controls | stronger restrictions and admin settings required |
| Restricted to specific teams or workflows | not general purpose across company |
| Pending contract or control clarification | unresolved issues block use |
| Rejected for sensitive use | vendor posture does not meet requirement |

This avoids the dangerous ambiguity of “approved” with no scope statement.

---

## 13. Re-review triggers

Review again before the normal cadence when:

- the vendor adds browsing, repo access, or agent capabilities,
- retention or training terms change,
- subprocessor chain changes materially,
- a new plugin or IDE extension is enabled,
- the organization wants to use higher-risk data classes,
- a breach, outage, or major incident occurs,
- the tool becomes embedded into a critical workflow.

AI vendor risk changes fast when capabilities expand.

---

## 14. Metrics worth tracking

Useful metrics include:

- number of AI vendors by tier,
- approved AI vendors by allowed data class,
- vendors lacking clear deletion or export support,
- vendors with unclear training or service-improvement terms,
- high-risk teams using AI tools under exception,
- re-reviews triggered by capability expansion,
- percentage of AI vendors with verified admin controls.

These metrics help show whether AI adoption is governed or merely tolerated.

---

## 15. Quick review checklist

Before approving an AI vendor, ask:

- do we know exactly what data may enter the tool,
- do we know what the vendor retains and for how long,
- do we know whether prompts or traces support training or improvement,
- are subprocessors and regions clear,
- can admins control history and usage meaningfully,
- can content be exported and deleted in a real workflow,
- is the approval scope narrow and explicit,
- would we be comfortable explaining this approval to a regulator, auditor, or affected customer.

If not, keep the review open or reject the use case.
