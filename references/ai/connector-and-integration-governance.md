---
title: "Connector and Integration Governance"
slug: connector-and-integration-governance
category: ai
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "NIST AI RMF 1.0 — https://doi.org/10.6028/NIST.AI.100-1 (2023-01)"
  - "OWASP Top 10 for LLM Applications v2025 — https://genai.owasp.org/llm-top-10"
  - "MCP and tool-integration security guidance — https://modelcontextprotocol.io"
  - "Enterprise SaaS integration governance practices"
  - "Common admin-control and third-party connector review patterns"
  - "CVE-2024-8309 LangChain GraphCypherQAChain SQL injection via PI — https://nvd.nist.gov/vuln/detail/CVE-2024-8309 (2024-10, CVSS 9.8)"
  - "Red Hat CVE-2024-8309 mitigation advisory — https://access.redhat.com/security/cve/cve-2024-8309"
triggers_strong: ["ai connector governance", "integration governance", "llm connector review", "agent connector review", "tool integration governance"]
triggers_weak: ["connector review", "integration review", "ai integration"]
related: ["mcp-security", "ai-tool-profiles", "multi-agent-boundaries-and-delegation", "agent-approval-patterns", "privacy-review-for-ai-vendors"]
---

# Connector and Integration Governance

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 2-4 | Automation: Partial (inventory, scope checks, token expiry checks, admin settings verification, and connector drift alerts partly automatable; business-need review, proportionality judgment, and approval decisions manual)

Use this guide when an AI tool, assistant, agent platform, IDE extension, browser helper, no-code builder, or MCP-style workflow wants to connect to:

- source code repositories,
- ticketing systems,
- chat platforms,
- cloud storage,
- internal knowledge bases,
- email and calendar,
- CRM, support, HR, finance, or admin systems,
- custom APIs or internal services.

The core problem is simple: a model may look like one application, but its **connectors and integrations** define the real blast radius.

---

## 1. Core rule

Every connector should answer four questions clearly:

1. **what data it can read,**
2. **what actions it can perform,**
3. **what identity and token it uses,**
4. **who approved that scope and for how long.**

If a connector exists without explicit scope, owner, and review path, it is an ungoverned privilege expansion.

---

## 2. Why connectors are the real control plane

An AI workspace with a harmless chat box can still be high risk when its connectors allow it to:

- read confidential repositories,
- search production tickets and incident data,
- sync browser or clipboard content,
- invoke internal APIs,
- create or modify records,
- send messages or emails,
- pull broad knowledge-base content into prompts.

The dangerous step is often not "using AI." The dangerous step is silently wiring broad integrations into it.

---

## 3. Minimum connector inventory fields

Track each connector or integration with at least:

| Field | Why it matters |
|---|---|
| connector ID | unique tracking |
| tool / workspace / tenant | where it lives |
| target system | blast radius |
| purpose | business need |
| data classes accessible | privacy and confidentiality impact |
| action scope | read, write, send, delete, admin |
| auth model | OAuth, PAT, API key, service account, delegated session |
| owner | accountability |
| approver | approval trail |
| enabled date | lifecycle |
| expiry or re-review date | prevents silent permanence |
| current status | active, restricted, suspended, retired |

If connector approvals live only in ad hoc admin clicks, you do not have governance.

---

## 4. Core review questions

Before enabling a connector, answer:

- what exact workflow requires this integration,
- whether a narrower connector or read-only mode would suffice,
- whether the connector can access restricted or regulated data,
- whether it can perform writes, sends, deletes, or admin actions,
- whether the identity is user-delegated or shared across a tenant,
- whether data retrieved through the connector is retained in prompts, logs, or histories,
- whether the connector widens exposure to subprocessors or model providers,
- whether the integration can be scoped by repo, folder, project, group, or environment,
- how the connector will be reviewed, revoked, and monitored.

Do not approve the connector just because the underlying platform is already approved.

---

## 5. Scope the connector, not just the tool

A common mistake is to approve the AI platform globally and ignore connector scope.

Safer pattern:

- tool approval is one decision,
- each meaningful connector is a separate decision,
- high-risk connectors require stronger signoff than low-risk ones.

Example:

| Connector | Better stance |
|---|---|
| public docs search | lightweight approval |
| internal read-only repo index | moderate review |
| support-ticket connector with customer exports | stronger privacy review |
| cloud console or production admin API | high-risk approval with tight scope |
| email send or CRM write-back | explicit write approval and logging |

The connector boundary is often more important than the model boundary.

---

## 6. Data access patterns to classify carefully

Tier up the review when a connector can access:

- confidential source code,
- customer tickets or support exports,
- HR, legal, finance, or recruiting records,
- regulated data,
- production telemetry or incidents,
- secrets, keys, or configuration stores,
- browser sessions or copied local content,
- internal admin systems.

Also tier up when a connector can aggregate across many low-risk systems into one high-value context surface.

---

## 7. Action scope matters as much as data scope

Classify integrations by effective powers:

| Scope | Example | Typical stance |
|---|---|---|
| Read-only narrow | one docs space, one repo, one project board | easier to approve |
| Read-only broad | all repos, all tickets, all tenant docs | significant review needed |
| Write limited | create draft issue, add comment, save local note | approval plus auditability |
| Write operational | update records, modify code, trigger workflow | strong approval boundary |
| Destructive or admin | delete records, change permissions, manage production | highest approval tier |

Do not let a connector market itself as "collaboration" when it can actually mutate or disclose critical systems.

---

## 8. Identity and token choices

Prefer connector auth models that are:

- scoped,
- revocable,
- attributable,
- short-lived where feasible.

Safer order of preference:

1. tightly scoped delegated OAuth with admin control,
2. scoped service identity with explicit owner,
3. short-lived federation or ephemeral tokens,
4. narrow API keys only where better options do not exist.

Higher-risk patterns:

- one shared admin token for the whole tenant,
- long-lived PATs with broad scope,
- connector credentials tied to an individual who may leave,
- opaque vendor-managed credentials with weak tenant visibility,
- connectors that inherit the full browser session of a privileged admin.

Use related IAM guidance when connectors rely on service accounts or federated trust.

---

## 9. AI-specific connector risks

Treat these as strong escalation triggers:

- automatic context capture from IDE or browser sessions,
- connectors that pull broad internal content into prompts,
- connectors that can browse and then immediately write or send,
- tool chains where one connector reads untrusted external data and another connector performs side effects,
- hidden or durable memory of connector-retrieved content,
- weak admin controls for connector enablement and audit logs,
- inability to scope by workspace, repo, group, or data domain.

A connector that only “helps with context” may still become the main exfiltration path.

---

## 10. Governance model that scales

A useful program often uses three layers.

### 10.1 Approved connector catalog

Maintain a catalog of:

- approved connectors,
- banned connectors,
- conditionally approved connectors,
- required guardrails per connector type.

### 10.2 Approval matrix

Define who can approve:

- public or low-risk knowledge connectors,
- internal read-only engineering connectors,
- privacy-sensitive business connectors,
- operational or production-side-effect connectors.

### 10.3 Recertification rhythm

Review on:

- onboarding,
- capability expansion,
- scope widening,
- user complaints or incidents,
- periodic cadence based on risk.

A connector register without recertification becomes stale quickly.

---

## 11. Example approval tiers

| Connector tier | Typical examples | Approval expectation |
|---|---|---|
| Tier 1 | public docs, low-risk internal notes | workspace owner or security baseline |
| Tier 2 | internal repo read-only, project-tracker read-only | owner plus security review |
| Tier 3 | support, CRM, analytics, HR-adjacent, AI retrieval over meaningful data | security plus privacy or legal as needed |
| Tier 4 | production admin APIs, messaging send, delete/update paths, browser/computer-use side effects | explicit high-risk approval with logging and periodic review |

Tie connector tiers to `agent-approval-patterns` when an agent can act on connected systems.

---

## 12. Logging and evidence expectations

For non-trivial connectors, preserve evidence of:

- who enabled the integration,
- when scope changed,
- what token or identity model it uses,
- who approved it,
- major admin actions,
- export, send, delete, or write events where feasible,
- connector disablement or revocation.

Weak pattern:

- "the admin probably turned it on a while ago"

Strong pattern:

- dated record with owner, scope, approval, and logs showing meaningful admin actions.

---

## 13. Offboarding and connector retirement

Disable or re-review when:

- the business use case ends,
- the owner leaves,
- the tool gains materially broader capabilities,
- the connected system changes classification,
- a new subprocessor or region model changes risk,
- the vendor cannot answer evidence or deletion questions.

Connector retirement should include:

- token revocation,
- scope removal,
- workspace cleanup,
- memory/history review if content was retained,
- inventory update.

---

## 14. Common anti-patterns

Avoid:

- approving a whole AI platform and skipping connector review,
- using one broad admin account for all integrations,
- allowing read-from-anything and write-to-anything combinations by default,
- leaving disabled-looking connectors still authenticated in the background,
- enabling browser, repo, ticket, and messaging connectors together with no trust separation,
- ignoring connector drift after product upgrades,
- approving integrations before clarifying whether logs, prompts, and histories retain connected data.

If integrations are invisible, governance is not real.

---

## 15. Minimal rollout checklist

Before enabling a meaningful connector, confirm:

1. purpose is documented,
2. data classes are known,
3. action scope is classified,
4. auth model is attributable and scoped,
5. approval is recorded,
6. retention and privacy impact are reviewed,
7. logs and revocation path exist,
8. re-review date is set.

That checklist is small enough to use consistently and strong enough to prevent most connector sprawl.

---

## 16. Use with related references

Use this guide with:

- `mcp-security` for tool abuse and indirect injection risks,
- `ai-tool-profiles` for workspace baselines,
- `multi-agent-boundaries-and-delegation` for handoff and trust separation,
- `agent-approval-patterns` for high-risk action gates,
- `privacy-review-for-ai-vendors` when the connector expands third-party data handling.

Connector governance is where many AI deployments either become safely usable or quietly over-privileged.
