---
title: "Screenshot and Support Artifact Handling"
slug: screenshot-and-support-artifact-handling
category: privacy
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-19
sources:
  - "Privacy engineering support-handling patterns"
  - "Incident response and evidence handling guidance"
  - "Customer support data minimization practices"
  - "Secure artifact redaction and sharing procedures"
triggers_strong: ["support screenshot", "artifact handling", "ticket attachment privacy", "HAR file privacy", "support bundle handling"]
triggers_weak: ["screenshots", "support artifacts", "ticket attachment"]
related: ["data-classification-and-handling", "gdpr-security-ops", "dsar-export-erasure-runbook", "evidence-redaction-and-sharing-rules", "retention-enforcement-and-deletion-evidence"]
---

# Screenshot and Support Artifact Handling

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 2-4 | Automation: Partial (upload restrictions, retention rules, ticket templates, redaction workflows, and DLP checks can be partly automated; human review of screenshots, minimization decisions, and safe sharing remains manual)

Use this guide when handling screenshots, screen recordings, HAR files, browser traces, logs, crash bundles, diagnostic exports, or other support artifacts collected for troubleshooting.

These artifacts are often treated like harmless attachments. They are not. They frequently contain:

- names, emails, and account identifiers,
- message history and customer content,
- tokens, cookies, or session IDs,
- internal URLs and environment names,
- billing, HR, legal, or support records,
- browser extensions, installed apps, and device information,
- prompts, transcripts, and AI tool outputs.

The default rule is: **support artifacts are data-bearing evidence and must be handled as sensitive by default until reviewed**.

---

## 1. Why these artifacts are risky

A single screenshot can reveal:

- another user’s name or email,
- internal navigation and admin-only features,
- account numbers,
- background browser tabs,
- security tooling names,
- hidden notifications,
- chat history or prompts,
- timestamps and location clues.

A HAR file or support bundle can reveal much more:

- headers and tokens,
- internal endpoints,
- query strings,
- cookie names and session identifiers,
- network topology hints,
- diagnostic content from third-party tools.

These artifacts are often richer than the original bug report.

---

## 2. Artifact types and default sensitivity

| Artifact type | Default sensitivity | Typical hidden risk |
|---|---|---|
| Screenshot | Medium to High | visible PII, tabs, internal URLs, IDs |
| Screen recording | High | behavior history, multiple screens, notifications |
| HAR / network trace | High | cookies, headers, tokens, query params |
| Log export | High | IDs, emails, secrets, request bodies |
| Crash dump / support bundle | High | memory fragments, config, file paths, env details |
| AI transcript export | High | prompts, outputs, private business context |
| Browser console capture | Medium to High | internal errors, object data, stack traces |

If unsure, classify up, not down.

---

## 3. Collection principles

Only collect artifacts when:

- the issue cannot be resolved through lower-risk information,
- the artifact scope is limited to the troubleshooting need,
- the recipient and storage path are approved,
- the user understands what is being collected.

Prefer this order:

1. plain-text description,
2. narrow metadata,
3. targeted screenshot,
4. short redacted recording,
5. controlled log or trace export,
6. full support bundle only when justified.

Do not jump straight to “send a HAR” or “record your screen” unless necessary.

---

## 4. Minimize before capture

Before asking for a screenshot or recording, instruct the reporter to:

- close unrelated tabs,
- hide notifications,
- avoid capturing personal or unrelated windows,
- crop to the smallest useful area,
- avoid including browser address bar unless needed,
- avoid showing account lists or background apps,
- use a sanitized test account if possible.

Before asking for a HAR or trace:

- reproduce with a low-privilege test account when possible,
- avoid reproducing flows with unrelated customer data,
- disable unrelated sessions,
- scope the trace to a single action or time window.

---

## 5. Support intake rules

Support queues should not accept arbitrary artifact uploads into uncontrolled systems.

Expected controls:

- approved intake channels only,
- size and type restrictions,
- malware scanning where relevant,
- DLP or pattern scanning for obvious secrets and high-risk data,
- visible labeling for sensitive attachments,
- retention rules tied to artifact class,
- restricted access for high-risk cases.

If a support process accepts attachments by email without control, assume oversharing and leakage will happen.

---

## 6. Ticketing and attachment hygiene

Ticket systems often become long-term storage for sensitive artifacts.

Rules:

- do not paste raw secrets, cookies, tokens, or full exports into ticket comments,
- avoid storing unnecessary screenshots inline forever,
- separate restricted attachments from broad-access case threads when possible,
- limit access to tickets involving HR, legal, finance, identity, or regulated data,
- mark artifacts for deletion when troubleshooting is complete.

A ticket attachment is not “temporary” if the platform keeps it for years.

---

## 7. HAR files and browser traces

HAR files deserve special caution because they may include:

- authorization headers,
- cookies,
- internal paths,
- object identifiers,
- request and response bodies,
- third-party endpoint details.

Controls:

- request HAR files only when no narrower evidence works,
- prefer sanitized reproduction accounts,
- review the HAR before broader sharing,
- redact cookies, auth headers, tokens, and identifiers before persistence or handoff,
- never upload raw HAR files to unapproved external tools.

Raw HAR files are often equivalent to handing over an authenticated trace of the user session.

---

## 8. Screenshots and recordings

Screenshots should be treated as structured data, not just images.

Review for:

- names and emails,
- account IDs,
- customer content,
- background windows,
- visible API keys or URLs,
- timestamps and location indicators,
- prompts, model names, and AI responses,
- browser bookmarks, extensions, or tabs.

Redact before sharing outside the immediate troubleshooting boundary.

If a screenshot includes information unrelated to the problem, that is a minimization failure.

---

## 9. Crash dumps, support bundles, and diagnostics

These artifacts can contain internal secrets or broad data sets.

Before collecting or sharing them:

- define exactly why they are needed,
- verify where they will be stored,
- confirm who may access them,
- apply a retention timer,
- scrub secrets and broad identifiers when possible,
- avoid attaching full bundles to general-purpose tickets.

Vendor requests for “full diagnostic bundles” should not be accepted without review.

---

## 10. AI-specific support artifacts

Modern support artifacts may contain:

- prompts,
- model outputs,
- transcript excerpts,
- connector or integration names,
- workspace configuration,
- embeddings or memory references,
- traces of tools invoked by an agent.

Treat them as both privacy-sensitive and security-sensitive.

Do not:

- forward them casually to external vendors,
- paste them into general AI tools for summarization,
- store them without understanding retention and training implications.

---

## 11. Redaction expectations

Redaction should be applied before wider sharing whenever possible.

Redact or mask:

- tokens, API keys, cookies, bearer headers,
- personal email addresses and phone numbers unless needed,
- account IDs not required for the investigation,
- customer message content outside the failing example,
- internal hostnames, paths, or environment labels when not needed,
- screenshots of unrelated tabs or windows.

Use irreversible redaction for external sharing. Do not rely on cosmetic blur that can be reversed.

---

## 12. Sharing rules

Share on a least-necessary basis.

Questions to ask before sending an artifact:

- who really needs it,
- is the recipient internal or external,
- can the artifact be reduced first,
- can a summary replace the artifact,
- is the transfer destination approved,
- how long will the recipient retain it,
- is a DPA or confidentiality boundary required?

A support artifact should not be copied to multiple systems “just in case.”

---

## 13. Retention and deletion

Support artifacts should have explicit retention rules.

Recommended pattern:

- diagnostic screenshots: short default retention,
- HAR files and traces: very short retention unless incident-related,
- support bundles and dumps: short controlled retention with review,
- incident evidence: retention aligned to incident or legal process,
- vendor-shared artifacts: tracked with deletion confirmation where possible.

If the artifact is no longer needed, delete it from the ticket, shared drive, and any temporary handling location.

---

## 14. DSAR and legal exposure

If support artifacts contain personal data, they may be in scope for:

- access requests,
- deletion requests,
- breach investigation,
- regulatory review,
- legal discovery.

That means teams should be able to answer:

- where the artifact is stored,
- who accessed it,
- how long it remains,
- whether it was shared externally,
- whether it can be deleted or retained under exception.

Untracked screenshot sprawl becomes a privacy and legal liability quickly.

---

## 15. Vendor troubleshooting

When vendors ask for support artifacts:

- prefer minimal excerpts over full exports,
- verify the contractual and processor relationship,
- confirm the upload channel and storage region,
- understand retention and deletion expectations,
- avoid sharing artifacts that include unrelated users or broader tenant context,
- log what was shared and why.

The fact that a vendor is helping debug a problem does not justify unrestricted data sharing.

---

## 16. High-signal anti-patterns

Avoid:

- asking every user for a full screen recording by default,
- attaching raw HAR files to broad-access tickets,
- sending screenshots with visible customer lists,
- uploading support bundles into general AI tools,
- keeping artifacts forever in ticket systems,
- forwarding crash dumps to vendors without review,
- using screenshots as a shortcut when a narrow textual explanation would do.

---

## 17. Minimal operational checklist

Before collecting or sharing a support artifact, verify:

- the artifact is actually necessary,
- the scope is minimized,
- the collection channel is approved,
- sensitive content has been reviewed and redacted where needed,
- access to the artifact is restricted appropriately,
- retention and deletion expectations are defined,
- external sharing is logged and justified.

---

## 18. See also

- `references/privacy/data-classification-and-handling.md`
- `references/privacy/gdpr-security-ops.md`
- `references/privacy/dsar-export-erasure-runbook.md`
- `references/compliance/evidence-redaction-and-sharing-rules.md`
- `references/privacy/retention-enforcement-and-deletion-evidence.md`
