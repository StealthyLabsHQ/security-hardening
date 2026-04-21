---
title: "Multi-Agent Boundaries and Delegation"
slug: multi-agent-boundaries-and-delegation
category: ai
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "NIST AI RMF 1.0 — https://doi.org/10.6028/NIST.AI.100-1 (2023-01)"
  - "OWASP Top 10 for LLM Applications v2025 — https://genai.owasp.org/llm-top-10"
  - "MITRE ATLAS Matrix — https://atlas.mitre.org"
  - "Provider guidance on tool use, orchestration, and human oversight"
triggers_strong: ["multi agent security", "agent delegation", "planner executor agent", "cross agent trust", "multi agent boundaries"]
triggers_weak: ["agent orchestration", "agent delegation review", "multi agent"]
related: ["agent-approval-patterns", "agent-memory-and-context-retention", "prompt-and-tool-evidence-handling", "mcp-security", "llm-agent-security"]
---

# Multi-Agent Boundaries and Delegation

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Recommended | Audit Level: 2-4 | Automation: Partial (role separation, delegation policy, scoped credentials, and trace collection partly automatable; trust modeling, task decomposition review, and exception approval manual)

Use this guide when a system uses **more than one agent role** such as planner, researcher, coder, browser, reviewer, operator, or supervisor.

A multi-agent design is not automatically safer than a single agent. It only helps when delegation creates **real boundary reduction** instead of hiding one large privilege set behind several names.

---

## 1. Core rule

Every agent boundary should answer three questions:

1. **what this agent may see**,
2. **what this agent may do**,
3. **what this agent may pass to another agent**.

If all agents share the same context, same tools, same secrets, and same approval path, the architecture is multi-agent in branding only.

---

## 2. Why multi-agent systems fail

Common failure modes:

- a low-trust agent passes hostile instructions into a high-trust agent,
- a planner agent smuggles execution intent into a supposedly read-only worker,
- a browser or retrieval agent imports attacker-controlled content into internal context,
- hidden memory causes one agent to inherit stale or privileged assumptions,
- approvals are attached to the original task but not to delegated sub-actions,
- the operator can no longer reconstruct which agent caused the final side effect.

Delegation changes the attack surface. It does not remove it.

---

## 3. Recommended role model

Use narrow role types with visibly different powers.

| Role | Main purpose | Typical powers | Main risk |
|---|---|---|---|
| Planner | break task into steps, identify dependencies, propose route | read task, propose plan | over-broad plan or hidden escalation intent |
| Researcher | fetch docs, inspect code, summarize context | read-only retrieval | hostile content import, false facts |
| Editor | draft code, text, or config changes | local write in bounded scope | unsafe edits, hidden side effects |
| Reviewer | check diff, policy, or evidence | read-only analysis | false confidence, missed risk |
| Browser / Operator | interact with web UI, external systems, or tools | browser, API, or infra actions | third-party prompt injection, real-world side effects |
| Supervisor | choose which agent runs next, enforce stop rules | orchestration only | boundary collapse if it inherits all permissions |

Do not give every role the maximum tool set just in case.

---

## 4. Boundary design principles

### 4.1 Separate trust tiers

At minimum, separate:

- untrusted-content readers,
- internal read-only analyzers,
- local editors,
- external-action operators,
- production-impact agents.

A browser or retrieval agent that sees hostile content should not automatically share that raw content with a production-capable agent.

### 4.2 Delegate artifacts, not authority

Prefer passing:

- normalized notes,
- narrow findings,
- approved plans,
- redacted summaries,
- signed or labeled task objects.

Avoid passing:

- full raw transcript history,
- unrestricted tool tokens,
- broad hidden memory,
- standing approvals that silently cover later actions.

### 4.3 Require explicit handoff semantics

A handoff should state:

- source agent,
- target agent,
- task objective,
- allowed scope,
- trust level of attached material,
- approval state,
- expiration or freshness limit.

If the receiving agent cannot tell whether the input is trusted, current, and approved, the handoff is weak.

---

## 5. Context-passing rules

### 5.1 Label context by trust

When one agent passes context to another, label it at least as:

| Label | Meaning |
|---|---|
| `trusted-system` | system-generated metadata or policy |
| `trusted-internal` | vetted internal content |
| `untrusted-external` | web, email, uploaded docs, third-party text |
| `derived-summary` | agent-created summary requiring verification |
| `approval-state` | human-approved plan or action boundary |

Do not flatten all of these into one transcript blob.

### 5.2 Pass the minimum necessary context

Rules:

- a reviewer usually needs the diff, not the entire browsing history,
- an editor usually needs the approved task and file scope, not all raw search results,
- an operator usually needs the approved action set, not speculative reasoning from earlier agents,
- a production-capable agent should not receive raw hostile content unless the task is specifically to analyze it.

### 5.3 Preserve provenance

For every delegated artifact, preserve:

- origin agent,
- creation time,
- source references,
- whether the content is quoted, summarized, or inferred,
- whether a human reviewed it.

Without provenance, false or hostile context becomes harder to challenge.

---

## 6. Approval does not automatically flow downstream

A major multi-agent mistake is treating initial approval as universal approval.

Use these rules:

- approval for **analysis** is not approval for **execution**,
- approval for **one agent** is not approval for **all agents**,
- approval for **one environment** is not approval for **prod**,
- approval for **one step** is not approval for later delegated side effects.

Examples:

- a planner may be approved to design a deployment plan, but the operator still needs execution approval,
- a browser agent may be approved to inspect a page, but not to submit a form,
- a coding agent may be approved to draft a patch, but not to merge or deploy.

Use `agent-approval-patterns` to define the approval tier at each delegated step.

---

## 7. Memory and delegation interaction

Multi-agent systems often fail through hidden shared memory.

High-signal risks:

- one agent stores sensitive or stale notes that another agent later treats as authoritative,
- a delegated task inherits prior tenant or project memory,
- old approvals persist across unrelated work,
- raw external content becomes persistent memory and later influences trusted workflows.

Rules:

- separate memory by agent role where feasible,
- do not share durable memory across trust zones by default,
- expire task-specific memory after completion,
- require review before promoting derived notes into durable shared memory.

Use `agent-memory-and-context-retention` when memory survives beyond the immediate workflow.

---

## 8. Browser and tool-specialist agents

Browser, MCP, and tool-specialist agents deserve stricter boundaries because they touch external or side-effectful surfaces.

Expected controls:

- dedicated low-privilege environment,
- scoped credentials per agent role,
- domain or tool allowlists,
- no hidden escalation into shell, file-write, or prod actions,
- strong evidence logging of actions and handoffs,
- explicit confirmation for uploads, sends, deploys, deletes, and admin mutations.

A browser agent that can see the open web should usually be treated as an `untrusted-external` ingestion point even if the user initiated the task.

---

## 9. Delegation patterns that work well

### 9.1 Planner -> reviewer -> executor

Pattern:

1. planner proposes a bounded plan,
2. reviewer checks scope and risk,
3. human or policy approves,
4. executor performs only approved actions,
5. verifier checks result.

Use for:

- code changes,
- IaC changes,
- evidence assembly,
- structured remediation work.

### 9.2 Researcher -> summarizer -> trusted operator

Pattern:

1. low-trust researcher reads external content,
2. summarizer normalizes and strips unsafe instructions,
3. trusted operator receives only relevant findings,
4. approvals apply only to the resulting action set.

Use for:

- vendor research,
- threat intel triage,
- hostile corpus review,
- browsing-heavy tasks.

### 9.3 Read-only swarm with single writer

Pattern:

- many agents may inspect and suggest,
- only one bounded editor or operator can mutate state,
- all writes route through approval and verification.

Use for:

- repo analysis,
- audit preparation,
- large review tasks.

---

## 10. Delegation anti-patterns

Avoid these patterns:

- **shared god token**: every agent can use the same privileged credential,
- **context dump delegation**: raw transcript or web content is forwarded wholesale,
- **approval laundering**: low-risk approval is reused for high-impact action,
- **supervisor as universal admin**: orchestrator can bypass all boundaries,
- **hidden side-channel memory**: agents exchange sensitive notes outside visible traces,
- **role drift**: researcher slowly gains editing, network, and prod powers over time.

A system with five agent names and one real privilege set is harder to reason about than a single explicit agent.

---

## 11. Logging and evidence requirements

For every delegated workflow, preserve enough evidence to reconstruct:

- user objective,
- agents involved,
- sequence of handoffs,
- trust label of inputs,
- approvals granted and by whom,
- tools or environments used by each agent,
- final side effects,
- rollback or containment path.

Minimum record per handoff:

| Field | Why it matters |
|---|---|
| source agent | identifies origin of the delegated task |
| target agent | identifies who acted next |
| handoff time | supports ordering and investigation |
| scope / objective | shows whether downstream action stayed in bounds |
| trust label | signals whether content was hostile, derived, or approved |
| approval state | shows whether execution was allowed |
| evidence link | supports audit and incident response |

If a multi-agent system cannot explain which agent made the harmful decision, incident handling will be slow and speculative.

---

## 12. Release gate checklist

Before enabling multi-agent execution in a meaningful workflow:

| Check | Expected |
|---|---|
| Agent roles have distinct tool and data scopes | Yes |
| Delegation artifacts are labeled by trust and provenance | Yes |
| Approvals are re-evaluated at execution boundaries | Yes |
| Shared memory across trust zones is minimized or disabled | Yes |
| Browser / external-content agents are isolated from prod-capable agents | Yes |
| Handoffs and side effects are logged | Yes |
| One agent cannot silently widen another agent's permissions | Yes |
| Human stop / reset path exists | Yes |

---

## 13. Design recommendation

The best default is usually:

1. many agents may **read**,
2. fewer agents may **write**,
3. very few agents may **act externally**,
4. no delegated action crosses a new trust boundary without fresh approval.

That keeps multi-agent systems useful without pretending delegation itself is a control.
