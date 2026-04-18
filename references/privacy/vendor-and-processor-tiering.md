---
title: "Vendor and Processor Tiering"
slug: vendor-and-processor-tiering
category: privacy
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-19
sources:
  - "GDPR Articles 28, 32, 44-49"
  - "EDPB guidance on controllers and processors"
  - "CNIL guidance on processor oversight"
  - "NIST Cybersecurity Framework supply chain and third-party risk patterns"
triggers_strong: ["vendor tiering", "processor review", "third party privacy review", "subprocessor review", "ai vendor review"]
triggers_weak: ["vendor risk", "processor", "third party"]
related: ["gdpr-security-ops", "data-classification-and-handling", "ai-prompt-data-handling", "ropa-dpia-dpa-scc-tia-template-pack"]
---

# Vendor and Processor Tiering

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 2-4 | Automation: Partial (inventory, review cadence, contract state, and access recertification partly automatable; lawful-basis analysis, transfer assessment, and proportionality decisions manual)

Use this guide when onboarding or reviewing a **vendor**, **processor**, **subprocessor**, **AI provider**, **support platform**, or any third party that can receive, host, analyze, or administer your data.

The goal is to stop treating every vendor review the same. The right question is not "do we have a questionnaire?" The right question is **what level of trust, data exposure, and operational dependency does this vendor create?**

---

## 1. Why tiering matters

Without tiering, organizations usually fail in one of two ways:

- low-risk vendors get slowed down by heavyweight process,
- high-risk vendors get waved through with shallow review.

A vendor that can read support exports, host HR records, process AI prompts, or administer production systems should not get the same review as a brochure website or public status-page tool.

Tiering helps answer:

- which contracts are mandatory,
- what evidence is needed,
- which teams must approve,
- how often the vendor must be re-reviewed,
- what access and data classes are acceptable.

---

## 2. Quick vocabulary

| Term | Practical meaning |
|---|---|
| Controller | decides why and how personal data is processed |
| Processor | processes data on behalf of the controller |
| Subprocessor | another party used by the processor |
| Vendor | general term that may be processor, independent controller, or both depending on workflow |
| Critical vendor | third party whose failure or misuse could materially affect confidentiality, availability, compliance, or business continuity |

Do not assume every SaaS tool is a processor in the same way. Clarify the role and actual data flows.

---

## 3. Core tiering factors

Tier vendors on at least these dimensions:

1. **Data sensitivity**: public, internal, confidential, restricted.
2. **Privilege level**: read-only analytics vs admin control-plane access.
3. **Integration depth**: manual upload, API sync, SSO, agent/browser access, embedded SDK.
4. **Transfer exposure**: regions, subprocessors, AI training or retention behavior.
5. **Operational criticality**: would outage or compromise materially affect business or regulatory posture?

If any one factor is high enough, the vendor should move up a tier even if the others look moderate.

---

## 4. Recommended tier model

| Tier | Typical example | Default review stance |
|---|---|---|
| Tier 0 | no personal data, no auth, public-content vendor | lightweight inventory only |
| Tier 1 | limited internal data, low privilege tooling | basic security and contract review |
| Tier 2 | personal data or meaningful internal data, moderate integration | DPA, security review, deletion and retention review |
| Tier 3 | restricted data, admin access, broad processor role, AI or support platform with sensitive material | full privacy/security/legal review plus ongoing recertification |

### 4.1 Tier 0

Examples:

- public documentation service with no login,
- marketing site vendor with no customer-data feed,
- low-risk research tool with no upload or account integration.

Expected controls:

- inventory entry,
- no hidden data flow,
- confirm no sensitive uploads or embedded tracking beyond intended scope.

### 4.2 Tier 1

Examples:

- internal project-management SaaS with standard work data,
- low-risk monitoring or note-taking platform,
- software that authenticates users but does not hold significant customer or employee data.

Expected controls:

- owner and purpose recorded,
- basic security review,
- SSO preference where appropriate,
- review of logging, retention, and role model.

### 4.3 Tier 2

Examples:

- support platform with customer tickets,
- analytics vendor receiving pseudonymous product events,
- document platform with internal confidential files,
- API integration with regular business or personal data flow.

Expected controls:

- DPA or equivalent where required,
- security posture review,
- region and subprocessor visibility,
- retention and deletion path,
- access-control model review,
- review of exports, logs, and support access.

### 4.4 Tier 3

Examples:

- HR, payroll, legal, or finance platform,
- AI tool receiving confidential or restricted prompts,
- processor with broad customer-data access,
- vendor with production admin, backup, or observability access,
- provider involved in cross-border transfer of high-risk data.

Expected controls:

- legal and privacy signoff,
- security review deep enough for real risk,
- DPA and transfer mechanism review,
- subprocessor visibility and change process,
- data minimization and retention commitments,
- incident-notification expectations,
- stronger access controls and auditability,
- recurring re-review.

---

## 5. Minimum review by tier

| Review item | Tier 0 | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|---|
| inventory owner and purpose | Yes | Yes | Yes | Yes |
| auth / SSO review | Optional | Yes | Yes | Yes |
| DPA / processor terms | Usually no | Case-by-case | Yes if processor | Yes |
| retention and deletion review | Light | Yes | Yes | Yes |
| subprocessor visibility | Optional | Helpful | Yes | Yes |
| region / transfer review | Optional | Case-by-case | Yes | Yes |
| audit logging and access model | Light | Yes | Yes | Yes |
| privacy / legal approval | Rare | Case-by-case | Often | Yes |
| periodic recertification | Rare | Annual or on change | Annual | At least annual, often more |

---

## 6. Special cases that should tier up quickly

Move the vendor up a tier if any of these apply:

- raw customer support exports,
- HR, payroll, recruiting, or legal data,
- payment, banking, or special-category data,
- production admin or observability access,
- AI training, model-improvement, or prompt-retention ambiguity,
- large-scale user tracking or analytics,
- ability to export data in bulk,
- cross-border transfers with complex subprocessor chains.

A vendor can be high tier because of **blast radius**, not just because of PII quantity.

---

## 7. AI and modern tooling vendors

AI vendors deserve explicit review even when the UI feels like a normal productivity tool.

Ask:

- what prompts, files, traces, and outputs are retained,
- whether data is used for training or product improvement,
- whether admins can disable history or retention,
- whether uploads go to subprocessors,
- whether the tool can browse internal systems or repositories,
- whether model outputs and audit logs become new copies of sensitive data.

If the AI tool can ingest confidential or restricted material, treat it as at least Tier 2 and often Tier 3.

Use `ai-prompt-data-handling.md` for prompt-specific handling rules.

---

## 8. Processor review questions

Before approving a processor handling meaningful data, answer at least:

- What exact data classes are involved?
- Is the vendor acting as processor, controller, or mixed role?
- Is there a DPA or equivalent contract?
- Where is the data stored and processed?
- What subprocessors are involved?
- What is the retention model for content, logs, backups, and support traces?
- What access do vendor staff have?
- What is the breach-notification commitment?
- Can data be exported and deleted on request or termination?
- Are audit logs available for admin and export actions?

If these cannot be answered, the vendor is not ready for sensitive use.

---

## 9. Ownership and re-review cadence

Every vendor should have:

- business owner,
- security or technical owner where applicable,
- privacy owner for processor-heavy tools,
- tier,
- next review date,
- trigger events for out-of-band reassessment.

### 9.1 Re-review triggers

Review earlier than scheduled when:

- the vendor adds new AI features,
- data residency changes,
- subprocessors change materially,
- scope of uploaded or synced data grows,
- privileged integration is added,
- breach or major incident occurs,
- the vendor asks for broader permissions or admin access.

---

## 10. Offboarding and reduction of scope

Vendor governance is not only onboarding.

When retiring or narrowing a vendor:

- remove SSO and API integrations,
- rotate tokens and webhook secrets,
- export and archive what must be retained,
- delete what should not persist,
- revoke vendor admin access,
- update the inventory and processor register,
- confirm downstream subprocessors and backups are covered by the exit path where possible.

A forgotten integration token after contract termination is still exposure.

---

## 11. Common red flags

| Red flag | Why it matters |
|---|---|
| no clear answer on processor vs controller role | weak contract and accountability posture |
| vague statement on AI training or product improvement | hidden secondary use risk |
| no subprocessor list or change notice | transfer and confidentiality blind spot |
| support staff can access production customer data broadly | insider and breach-notification risk |
| deletion only applies to visible UI content, not logs or backups | retention gap |
| one vendor spans HR, support, and engineering with broad exports | concentration of risk |
| business owner unknown | no accountability for renewal or re-review |

---

## 12. Review checklist

| Check | Expected |
|---|---|
| Vendor tier is documented and justified | Yes |
| Data classes and privileges are known | Yes |
| DPA and transfer review match vendor tier | Yes |
| Subprocessors and retention are visible | Yes |
| Owner and re-review cadence are assigned | Yes |
| AI-related retention and training behavior are understood where relevant | Yes |
| Offboarding and token revocation path exists | Yes |

---

## Resources

- `gdpr-security-ops.md`
- `data-classification-and-handling.md`
- `ai-prompt-data-handling.md`
- `ropa-dpia-dpa-scc-tia-template-pack.md`
