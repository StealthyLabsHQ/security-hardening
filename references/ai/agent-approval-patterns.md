---
title: "Agent Approval Patterns"
slug: agent-approval-patterns
category: ai
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "NIST AI RMF 1.0 — https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf (2023-01)"
  - "NIST AI 600-1 Generative AI Profile — https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf (2024-07)"
  - "OWASP Top 10 for LLM Applications v2025 — https://genai.owasp.org/llm-top-10"
  - "Anthropic — Building Effective Agents — https://www.anthropic.com/research/building-effective-agents (2024)"
  - "OpenAI Preparedness Framework — https://cdn.openai.com/openai-preparedness-framework-beta.pdf (2023-12)"
triggers_strong: ["agent approval", "human in the loop", "agent autonomy", "approval workflow", "tool use approval"]
triggers_weak: ["approval pattern", "agent permissions", "HITL"]
related: ["llm-agent-security", "ai-tool-profiles", "prompt-and-tool-evidence-handling", "browser-computer-use-security"]
---

# Agent Approval Patterns

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (risk tiering, policy enforcement, and some pre-flight checks automatable; business-context review, change judgment, and exception approval manual)

Use this guide when deciding **what an AI agent may do without review**, **what requires explicit approval**, and **what should never be delegated directly**.

The goal is not to slow systems down with approval theater. The goal is to place review exactly where blast radius and reversibility demand it.

---

## 1. Core rule

Approval should be driven by:

- capability,
- trust boundary crossed,
- data sensitivity,
- blast radius,
- reversibility,
- operator confidence.

A simple chat task and a production deployment are not in the same approval class, even if both are performed by the same model.

---

## 2. Five approval tiers

| Tier | Typical capability | Approval expectation |
|---|---|---|
| T1 Reviewer | read-only analysis, summarize, classify, suggest | no approval beyond normal access policy |
| T2 Editor | draft code or text, propose changes, write local artifacts not yet applied | human review before commit / publish |
| T3 Integrator | modify repo, update configs, run bounded commands, fetch docs | approval before merge or before executing impactful changes |
| T4 Operator | touch cloud resources, secrets, tickets, CI, or user-facing systems | explicit task-level approval and scoped credentials |
| T5 Admin | production mutations, identity changes, financial or legal impact, destructive actions | strong human approval, dual control where justified |

The same agent may operate at different tiers depending on the tool and context. Tier is about action, not branding.

---

## 3. Actions that should almost always require approval

Require explicit human approval for actions such as:

- production deploys,
- granting or modifying admin access,
- secret rotation that can break systems,
- creating or approving firewall / IAM exceptions,
- deleting data or infrastructure,
- sending externally visible communications on behalf of the company,
- changing billing, payroll, or regulated records,
- bulk export of sensitive data,
- browser-based actions in third-party admin consoles.

If the action can create a material incident in one step, approval should not be implicit.

---

## 4. Approval dimensions

### 4.1 Capability

What can the agent do?

- read files,
- write files,
- execute commands,
- access the network,
- browse the web,
- call internal APIs,
- touch production systems,
- handle secrets or sensitive data.

### 4.2 Context

Where is it acting?

- local sandbox,
- source repository,
- CI environment,
- ticketing system,
- staging,
- production,
- third-party SaaS admin panel.

### 4.3 Reversibility

Can the action be rolled back safely?

- drafting text: easy,
- code edit before merge: moderate,
- migration against production data: hard,
- deleting accounts or records: often hard or impossible.

### 4.4 Observability

Can a reviewer see what happened?

- input and output preserved,
- tool calls logged,
- approvals recorded,
- artifacts retained,
- rollback path known.

Poor observability should increase approval requirements.

---

## 5. Default approval matrix

| Action class | Example | Suggested tier |
|---|---|---|
| read-only reasoning | review docs, classify risk, summarize logs | T1 |
| draft-only changes | propose code patch, draft policy text | T2 |
| repo write in feature branch | update tests, refactor code, regenerate docs | T2-T3 |
| network fetch / external retrieval | fetch package docs or vendor pages | T2-T3 depending on trust |
| CI or workflow changes | edit pipeline config, permissions, deploy logic | T3-T4 |
| browser admin actions | click through cloud console or SaaS admin | T4-T5 |
| production state changes | deploy, rotate critical secret, delete resource | T5 |
| bulk data export / deletion | DSAR export, incident data pull, cleanup jobs | T4-T5 |

Adjust upward if the environment is regulated, customer-facing, or poorly observable.

---

## 6. Approval patterns that work well

### 6.1 Propose-then-approve

Pattern:

1. agent analyzes and prepares a plan,
2. human reviews the proposed action set,
3. agent executes only the approved subset,
4. output and evidence are retained.

Use for:

- code changes,
- policy updates,
- infrastructure changes with bounded scope.

### 6.2 Dry-run before execution

Pattern:

1. agent generates diff, command plan, or simulated API call,
2. human reviews expected blast radius,
3. agent executes with same parameters,
4. post-action verification runs.

Use for:

- Terraform plan/apply,
- batch user changes,
- CI config changes,
- admin operations with preview support.

### 6.3 Two-person approval for high-impact actions

Pattern:

- one approver confirms business intent,
- one approver confirms technical safety.

Use for:

- production deletions,
- privileged IAM changes,
- irreversible migrations,
- emergency changes under pressure.

### 6.4 Bounded autonomy window

Pattern:

- grant temporary scope for a narrow task,
- restrict tools, targets, and duration,
- require re-approval when scope changes.

Use for:

- incident triage,
- repo-wide cleanup,
- time-boxed research or migration work.

---

## 7. Approval anti-patterns

Avoid these patterns:

- **blanket approval**: "the agent can do anything in this environment"
- **sticky approval**: one old approval silently covers future unrelated actions
- **approval by obscurity**: reviewer cannot see the diff, command, or target
- **approval after execution**: human review exists only on paper
- **identity mismatch**: unclear who approved versus who executed
- **shared privileged tokens**: approval cannot be tied to a scoped credential

A bad approval flow creates false confidence instead of safety.

---

## 8. Role design for humans in the loop

Define who can approve what.

| Human role | Typical authority |
|---|---|
| Task requester | confirms business intent and desired outcome |
| Code reviewer | approves repo changes before merge |
| System owner | approves changes to owned service or environment |
| Security reviewer | approves high-risk control exceptions or security-sensitive actions |
| Incident commander | authorizes urgent containment and recovery actions |

Do not let "somebody in chat said yes" be your approval model for high-impact actions.

---

## 9. Approval evidence to retain

For non-trivial actions, retain:

- request or task ID,
- actor and environment,
- proposed action summary,
- exact diff / command / target where possible,
- approver identity,
- approval timestamp,
- execution result,
- rollback or verification outcome.

This matters for incident response and for proving the approval was real.

---

## 10. Special handling for browser and computer use

Browser-capable agents need stricter approval because they can interact with dynamic, ambiguous interfaces.

Require stronger review when the agent can:

- open third-party admin portals,
- upload files,
- approve payments or transactions,
- change IAM or billing settings,
- click through security prompts,
- operate in production consoles.

Prefer:

- pre-defined targets,
- read-only browsing by default,
- screenshot or action logs,
- human confirmation before final submission actions.

---

## 11. Sensitive data and regulated workflows

Increase approval requirements when the task involves:

- HR or employee data,
- legal or investigation material,
- customer exports,
- financial records,
- credentials or secrets,
- regulated environments with mandatory evidence trails.

If the agent has broad data visibility, use smaller approval scopes and stricter evidence handling.

---

## 12. First 30 minutes of designing an approval policy

1. List tools and environments the agent can reach.
2. Classify actions into read, write, execute, network, admin, and destructive.
3. Map those actions to trust boundaries and data sensitivity.
4. Decide which actions are never automatic.
5. Define approver roles and escalation path.
6. Define what evidence must be logged.
7. Test one safe task and one high-risk task against the policy.

If the policy cannot explain those seven points, it is too vague.

---

## 13. Common red flags

| Red flag | Why it matters |
|---|---|
| one approval covers all future actions | approval drift |
| agents can use prod credentials without scoped gating | concentrated blast radius |
| browser actions submit forms without confirmation | easy irreversible mistakes |
| approval logs do not include exact target or diff | weak accountability |
| human reviewers cannot inspect the proposed action clearly | rubber-stamping risk |
| emergency paths bypass all logging | incident-within-incident risk |

---

## 14. Minimum checklist

| Check | Expected |
|---|---|
| Agent capabilities are classified by tier and environment | Yes |
| High-impact or irreversible actions require explicit approval | Yes |
| Approval is tied to named humans and scoped credentials | Yes |
| Proposed actions are reviewable before execution | Yes |
| Browser and production-console actions have stricter controls | Yes |
| Sensitive-data workflows use tighter approval scopes | Yes |
| Execution and approval evidence are retained for audit/IR | Yes |
| Emergency paths are logged and reviewed after use | Yes |

---

## 15. Related references

- `llm-agent-security.md`
- `ai-tool-profiles.md`
- `prompt-and-tool-evidence-handling.md`
- `browser-computer-use-security.md`
