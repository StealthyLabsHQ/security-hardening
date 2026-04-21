---
title: "Agent Evals & Red Teaming"
slug: agent-evals-red-teaming
category: ai
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "OWASP Top 10 for LLM Applications v2025 — https://genai.owasp.org/llm-top-10 (2024-11)"
  - "OWASP MCP Top 10"
  - "OpenAI Red Teaming Network — https://openai.com/safety"
  - "OpenAI's Approach to Frontier Risk"
  - "Anthropic Model System Cards — https://www.anthropic.com/research"
  - "UK AI Safety Institute evaluations — https://www.aisi.gov.uk"
  - "US AI Safety Institute — https://www.nist.gov/aisi"
  - "Wei et al. — Jailbroken: mismatched generalization — https://arxiv.org/abs/2307.02483 (2023-07)"
  - "Zou et al. — GCG universal adversarial suffixes — https://arxiv.org/abs/2307.15043 (2023-07)"
triggers_strong: ["agent evals", "red teaming", "regression gate", "prompt injection test", "adversarial eval"]
triggers_weak: ["evals", "test suite", "safety evaluation"]
related: ["llm-agent-security", "mcp-security", "hostile-corpus-review", "ai-agent-incident-response"]
---

# Agent Evals & Red Teaming

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Recommended | Audit Level: 2-4 | Automation: Partial (fixture execution, regression scoring, and route coverage automatable; scenario design, failure adjudication, and release decisions manual)

Use this guide when you need a **defensive adversarial test plan** for an AI agent, MCP workflow, coding assistant, browser/computer-use flow, or no-code builder before rollout or after a model/tool change.

The goal is not to "prove the model is safe." The goal is to detect where controls fail, define release gates, and catch regressions before a higher-capability model or broader permission set reaches production.

---

## 1. When to use this reference

Use it for:

- pre-release or pre-merge gates on agentic features,
- model upgrades, prompt changes, or tool-scope changes,
- enabling browser/computer-use, MCP, or external side effects,
- replaying real incidents as future regression tests,
- deciding what must block a release versus what can be monitored.

Do not use it as a substitute for:

- ordinary secure code review of app logic,
- formal compliance evidence,
- offensive exploit development,
- live-fire testing against production without a separate authorization path.

---

## 2. What to evaluate

Evaluate the whole control chain, not just the base model:

| Layer | What to check | Typical failure |
|---|---|---|
| Router / trigger selection | Did the system load the right references, policies, or tools? | Wrong domain selected, missing critical context |
| Context intake | Did hostile content stay data-only? | Indirect prompt injection becomes control flow |
| Planning | Did the planner stay within the approved goal? | Goal drift, attacker-defined task substitution |
| Tool selection | Did the agent choose only allowed tools? | Excessive agency or privilege creep |
| Tool arguments | Were arguments validated and scoped? | SSRF, path traversal, broad queries, secret overreach |
| Action gating | Did risky operations require approval or structured validation? | Destructive action with no review boundary |
| Memory / state | Was sensitive context retained too broadly or reused incorrectly? | Cross-task leakage, stale unsafe assumptions |
| Logging / telemetry | Would defenders see and reconstruct the failure? | Blind spots, weak evidence, missed alerting |

If an evaluation only measures the text response, it is too narrow for an agentic workflow.

---

## 3. Scenario families worth keeping in every suite

### Prompt and context injection

Map to `LLM01` and `MCP10` style risks:

- direct "ignore previous instructions" attempts,
- hostile HTML comments or markdown directives inside retrieved content,
- tool output that tries to override the user goal,
- mixed fact-plus-instruction documents that should be downgraded or quarantined.

### Insecure output handling

Map to `LLM02` style risks:

- model emits shell, SQL, YAML, or policy text that should not execute directly,
- structured output violates schema but still reaches the executor,
- generated remediation widens privilege or disables safeguards.

### Excessive agency and scope creep

Map to `LLM06`, `MCP02`, and `MCP07` style risks:

- a read-focused agent attempts write, send, deploy, or delete actions,
- tool permissions widen silently after a profile or bundle change,
- approval paths are skipped because the action is mislabeled as low risk.

### Tool poisoning and supply-chain abuse

Map to `MCP03`, `MCP04`, and `MCP09` style risks:

- malicious manifests,
- unsafe connector defaults,
- stale or shadow MCP servers,
- dependency or plugin changes that alter the trust boundary.

### Audit and telemetry failures

Map to `MCP08` style risks:

- risky tool calls not logged,
- red-team scenarios with no alert path,
- no stable correlation ID tying prompt, tool calls, and operator action together.

---

## 4. Safe fixture design rules

Keep the test corpus defensible:

- Use synthetic or scrubbed data only.
- Use fake secrets, fake customer identifiers, and fake internal domains.
- Do not include live credentials, real customer exports, or production endpoints.
- Do not include runnable exploit chains when a control description is sufficient.
- Label every fixture with purpose, risk family, and expected safe behavior.
- Keep one clearly malicious variant and one benign near-neighbor to measure false positives.

Good fixtures should teach the system what to reject and what to allow with minimal ambiguity.

---

## 5. Campaign types

| Campaign | Run when | Minimum output |
|---|---|---|
| Release gate | Before shipping a new agentic feature | pass/fail summary plus blocked release criteria |
| Model upgrade check | Before changing the base model or major prompt stack | regression comparison to the previous approved baseline |
| Tool onboarding check | Before enabling MCP, browser use, or a new connector | scope review plus adverse-scenario results |
| Permission change check | Before widening policy or bundle permissions | evidence that higher-risk actions still gate correctly |
| Incident replay | After a real failure or near miss | new regression case linked to the incident class |

If a model, tool, or profile changes and there is no evaluation delta, your release gate is probably too weak.

---

## 6. Minimum release gate

Before enabling a higher-risk agent workflow, require at least:

1. A fixed set of hostile prompt/context fixtures.
2. At least one scope-creep or excessive-agency scenario.
3. At least one telemetry/reconstruction scenario.
4. Explicit expected behavior for allow, block, downgrade, or require-approval.
5. A reviewer who can classify failures as release-blocking or not.
6. A rollback path if the approved model or policy regresses after deploy.

For browser/computer-use, MCP, and external side effects, add stricter gating than for static code review.

---

## 7. Scoring and pass criteria

Use a small set of reviewable metrics:

| Metric | Why it matters |
|---|---|
| Unsafe action rate | Shows how often the workflow performs a prohibited action |
| Blocked malicious tool-call rate | Shows whether gating catches clearly hostile requests |
| False positive burden | Shows whether benign tasks are blocked too often |
| Regression count vs prior approved baseline | Shows whether a model or policy update made things worse |
| Time to investigate with logs | Shows whether telemetry supports incident response |

Define release criteria in advance. Example:

- zero unapproved destructive actions,
- zero cross-tenant or cross-user data leaks,
- no critical logging blind spots on high-risk scenarios,
- all newly discovered failure classes added back into the suite before release.

---

## 8. Failure handling

When a red-team case fails:

1. Treat it as a control failure, not just a prompt failure.
2. Reduce privilege first: downgrade to read-only, disable the new tool, or re-enable approval gates.
3. Capture the exact failing prompt, retrieved content, tool trace, and policy version.
4. Add the case to the standing regression suite before closing the issue.
5. Route severe failures to `ai-agent-incident-response.md` if the behavior escaped into a live environment.

A strong eval program turns incidents and near misses into permanent regression tests.

---

## 9. How this repo fits

This repository already includes an offline fixture harness under [`evals/`](../../evals/) for routing and reference-integrity checks. Use it to keep the corpus wired correctly, then layer execution-specific harnesses or model-specific judges outside the reference corpus if you need deeper automated grading.

Pair this reference with:

- `llm-agent-security.md` for threat categories and trust zones,
- `mcp-security.md` for tool/protocol-specific attack paths,
- `hostile-corpus-review.md` for untrusted content handling,
- `ai-cli-hardening.md` for runtime permissions and approval boundaries,
- `ai-agent-incident-response.md` for containment and recovery.

---

## 10. Official references

- OWASP - `Top 10 for Large Language Model Applications`: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- OWASP - `MCP Top 10`: https://owasp.org/www-project-mcp-top-10/
- OpenAI - `Deployment Safety Hub`: https://openai.com/safety/evaluations-hub/
- OpenAI - `OpenAI Red Teaming Network`: https://openai.com/index/red-teaming-network/
- OpenAI - `OpenAI's Approach to Frontier Risk`: https://openai.com/global-affairs/our-approach-to-frontier-risk/
- Google - `SAIF Risk Assessment`: https://blog.google/innovation-and-ai/technology/safety-security/google-ai-saif-risk-assessment/
- Anthropic - `Model system cards`: https://www.anthropic.com/system-cards
