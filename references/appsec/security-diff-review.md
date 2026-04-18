---
title: "Security Diff Review"
slug: security-diff-review
category: appsec
depth: 2
audit_level: [1, 2, 3]
last_reviewed: 2026-04-18
sources:
  - "OWASP Secure Code Review Cheat Sheet"
  - "OWASP ASVS"
  - "CWE Top 25"
triggers_strong: ["security diff review", "pr security review", "review this diff", "ai generated patch review", "security review checklist"]
triggers_weak: ["diff review", "pr review", "code review security"]
related: ["language-patterns", "authorization-rbac", "security-testing-examples"]
---

# Security Diff Review

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Essential | Audit Level: 1-3 | Automation: Partial (pattern search, lint, and test hooks automatable; authorization logic, blast radius, and business abuse paths manual)

Use this guide when reviewing a **pull request**, **patch**, **commit diff**, or **AI-generated change set** and you need to decide quickly where the security risk really is.

Security review is not reading every line equally. It is a triage exercise: find the few changed lines that can widen trust, expose data, or remove safeguards.

---

## 1. Review Order

Review in this order:

1. **Changed files with trust-boundary impact**
2. **New routes, handlers, jobs, webhooks, or background workers**
3. **AuthN/AuthZ changes**
4. **Input parsing, file handling, fetches, shells, SQL, deserialization**
5. **Config and CI changes**
6. **Logging, telemetry, error handling, exports**
7. **Dependency and lockfile changes**
8. **Everything else**

Do not start with styling, naming, or low-risk refactors if there are access-control or execution-path changes in the diff.

---

## 2. Classify Changed Files First

| File type | Security review depth |
|----------|------------------------|
| Auth middleware, policy files, route handlers, permissions config | Highest |
| CI workflows, deployment config, Docker/K8s/Terraform, infra modules | Highest |
| API schemas, serializers, DTOs, validators, upload handlers | High |
| Logging, analytics, exports, reporting | High |
| Frontend-only view or CSS changes | Medium unless they expose secrets or unsafe rendering |
| Pure refactors with no logic change | Low but still verify claims |

If a PR touches both low-risk UI and high-risk auth/config files, ignore the volume and review the high-risk files first.

---

## 3. High-Signal Patterns in Diffs

| Pattern in diff | What to suspect |
|-----------------|-----------------|
| `public`, `allow`, `*`, `ANY`, `allUsers`, `everyone` | Access widened too far |
| `role`, `isAdmin`, `permissions` added to request body | Mass assignment / privilege escalation |
| new `fetch`, `requests.get`, webhook, URL input | SSRF, trust boundary expansion |
| `eval`, `exec`, `shell=True`, `child_process`, template execution | Command/code injection |
| `innerHTML`, `dangerouslySetInnerHTML`, unescaped template output | XSS |
| new `SELECT * WHERE id = ...` or string-built query | SQL injection / IDOR |
| `verify=False`, TLS bypass, cert check disabled | MITM or trust downgrade |
| new logs with request/user objects | PII / secret leakage |
| workflow permission additions or new secrets usage | CI privilege drift |
| hidden debug flags or bypass comments | Temporary bypass becoming permanent |

Search changed lines for these before deep reading.

---

## 4. Questions to Ask on Every Security-Relevant Diff

### Authentication

- Did this change create a path that can be reached without authentication?
- Was a route moved outside middleware accidentally?
- Are tokens, sessions, or cookies handled differently now?

### Authorization

- Is access checked against object ownership or tenant, not only role?
- Did a query remove a tenant/user filter?
- Are new admin-only fields or actions protected server-side?

### Input and execution

- Does new input reach SQL, shell, file path, template engine, regex, parser, or external fetch?
- Are unknown fields stripped from request bodies?
- Can a user control filenames, URLs, or identifiers in a new path?

### Data exposure

- Are logs, analytics, exports, or error responses now carrying more sensitive fields?
- Did a serializer or GraphQL field add confidential attributes?
- Did a frontend change move secrets into browser-visible code?

### Infrastructure and automation

- Did workflow or deployment permissions widen?
- Are secrets or deploy credentials now available to more jobs?
- Did a config change disable protections rather than fix root cause?

---

## 5. Fast PR Triage Heuristics

### Category A - immediate escalation

Escalate quickly when a diff includes:

- auth or policy rewrite,
- new unauthenticated route,
- role or permission model changes,
- CI workflow permission increases,
- secret handling changes,
- file upload or download path changes,
- server-side fetch or webhook changes,
- new deserialization or shell execution.

### Category B - focused review

Review carefully when a diff includes:

- serializer or DTO changes,
- new logs or analytics events,
- retention/export changes,
- new dependency with native code, postinstall scripts, or broad network access,
- frontend rendering changes touching raw HTML or URL parameters.

### Category C - low-risk unless combined with others

Usually lower risk:

- pure CSS,
- copy changes,
- internal renames,
- tests with no production code delta,
- comments only.

Still verify the PR description is truthful. Attackers and rushed reviewers both hide behind "refactor only" claims.

---

## 6. AI-Generated Diff Red Flags

AI-generated patches often fail in repeatable ways. Look for:

- insecure examples copied into production code,
- broad `try/except` or silent fallback around security checks,
- ownership checks omitted because the code "works" for happy path,
- auth enforced in frontend but not backend,
- logging of full request/response objects for debugging,
- hidden feature flags that bypass validation,
- direct browser calls to secret-bearing APIs,
- insecure defaults added to make local development easier.

If the author says "AI helped write this," increase review depth around trust boundaries and error handling.

---

## 7. Language-Agnostic Hotspots

### Request body shape changes

A new optional field can be a privilege-escalation path if it controls:

- role,
- tenant,
- ownership,
- verification state,
- pricing,
- status transitions.

### Query changes

A removed predicate can create IDOR/BOLA immediately.

Example review thought process:

```text
Before: WHERE invoice.id = ? AND invoice.owner_id = current_user.id
After:  WHERE invoice.id = ?
=> object-level authorization regression
```

### New outbound calls

Any new server-side HTTP client, webhook consumer, import job, or browser automation path expands trust boundaries. Validate destination, auth, retry logic, and logging.

### Error handling changes

If the patch changes from generic error to `return str(e)` or stack trace, treat it as information disclosure until proven otherwise.

---

## 8. Review Comments That Move Work Forward

Good security review comments are specific and minimal.

Examples:

- "`GET /invoices/:id` now fetches by ID only. Please restore object-level ownership check or tenant scoping to prevent IDOR."
- "This workflow now adds `id-token: write` and deploy credentials in the same job that processes PR code. Split untrusted test and trusted deploy jobs."
- "The new `role` field in request JSON looks mass-assignable. Please remove it from the client-controlled schema and set it server-side only."
- "This log line emits the full user object. Please log stable internal ID only and redact email/token fields."

Avoid vague comments like "security?" or "is this safe?" unless you also state the concrete risk.

---

## 9. Minimal Verification After Finding a Risk

When you find a likely issue, propose the smallest proving test.

| Risk | Quick verification |
|------|--------------------|
| IDOR/BOLA | log in as user B and request user A resource by ID |
| Mass assignment | send hidden fields like `role=admin` or `isVerified=true` |
| XSS | inject HTML/script payload into rendered field |
| SSRF | try localhost / metadata endpoint / internal hostname |
| CI privilege drift | inspect effective permissions and trigger context |
| Secret exposure | inspect browser bundle, logs, artifacts, or config output |

Related runnable examples: `security-testing-examples.md`.

---

## 10. Diff Review Output Format

When reporting findings, structure them like this:

```text
Finding: Missing object-level authorization on invoice fetch
Severity: High
Why it matters: Any authenticated user can access another user's invoice by changing the ID
Changed area: route handler / invoice query
Smallest safe fix: Re-add owner or tenant filter server-side and return 404/403 on mismatch
Verification: user B requests user A invoice and receives 403/404
```

This format speeds remediation and reduces back-and-forth.

---

## 11. Fast Review Checklist

| Check | Expected |
|-------|----------|
| New endpoints have auth and object-level authz review | Yes |
| Request schema changes do not expose privileged fields | Yes |
| New outbound fetch/webhook/import paths validate destinations | Yes |
| New logs/errors do not leak secrets or PII | Yes |
| New HTML/template/rendering paths are context-safe | Yes |
| CI/config changes do not widen trust without approval | Yes |
| Diff claims of "refactor only" are verified against behavior | Yes |

---

## 12. High-Signal Findings to Report First

1. Access control regression caused by query or middleware change.
2. New unsafe execution path (`eval`, shell, deserialization, raw template execution).
3. CI or deploy permission drift.
4. Secret or PII exposure in logs, outputs, browser bundle, or artifacts.
5. Public exposure or auth bypass due to config change.
6. AI-generated code that omits guardrails while appearing correct functionally.

Lead with exploitability, blast radius, and the smallest defensive fix.

---

## 13. Related References

- `language-patterns.md`
- `authorization-rbac.md`
- `security-testing-examples.md`
- `production-error-handling.md`
