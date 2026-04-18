---
title: "Authorization Regression Testing"
slug: authorization-regression-testing
category: iam
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-19
sources:
  - "OWASP Authorization Cheat Sheet"
  - "OWASP API Security Top 10 2023"
  - "OWASP Web Security Testing Guide"
  - "Google Zanzibar / OpenFGA authorization testing patterns"
triggers_strong: ["authorization regression", "idor regression", "authz tests", "permission matrix", "field level auth test"]
triggers_weak: ["authorization testing", "access control regression", "rbac tests"]
related: ["authorization-rbac", "security-testing-examples", "api-security", "graphql-security", "security-diff-review"]
---

# Authorization Regression Testing

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (policy unit tests, route inventory checks, fixture execution, and CI gates partly automatable; business ownership rules, edge-case expectations, and support/admin workflow review manual)

Use this guide when adding or changing:

- REST or GraphQL endpoints,
- object ownership logic,
- role or permission models,
- tenant isolation logic,
- support/admin impersonation flows,
- background jobs that read or mutate user-owned data.

Authorization failures rarely come from missing login screens. They usually come from **behavior drift**: one new route, one forgotten resolver, one bulk action, or one “temporary” admin shortcut that never got negative tests.

---

## 1. Core rule

Every authorization-sensitive change should ship with:

1. a **subject-resource-action** matrix,
2. at least one **negative test** for each sensitive path,
3. tests for both **read** and **write** behavior,
4. explicit checks for **tenant boundaries**, **ownership**, and **privileged roles**.

If a route or resolver is security-sensitive but only has happy-path tests, assume the coverage is incomplete.

---

## 2. Why authz regressions happen

The most common reasons are:

- a new endpoint reuses authentication middleware but skips authorization,
- list endpoints filter in one code path but not another,
- REST handlers check ownership but GraphQL resolvers for the same object do not,
- admin/support tooling bypasses policy checks “for convenience”,
- background workers trust user-supplied identifiers without re-checking scope,
- multi-tenant constraints are enforced in the UI but not in the server query,
- bulk export / search / autocomplete endpoints expose records outside the caller’s scope.

Authz regressions are especially likely after:

- refactoring query layers,
- introducing caching,
- adding “internal only” APIs,
- splitting services,
- adding AI or automation features that act on behalf of a user.

---

## 3. Minimum matrix to maintain

Keep a lightweight matrix for sensitive resources.

| Subject | Resource | Action | Expected result | Why |
|---|---|---|---|---|
| owner | invoice | read | allow | normal use |
| different authenticated user | invoice | read | deny / 404 | IDOR prevention |
| support role | invoice | read | allow only with explicit support policy | support workflow |
| tenant A admin | tenant B invoice | read | deny | tenant isolation |
| anonymous user | invoice | read | deny | protected resource |
| owner | invoice | export | allow if export scope limited | data portability |
| support role | invoice | delete | deny unless explicit approval workflow | privilege boundary |

Do not keep the matrix only in someone’s head or in a ticket comment. A short table is enough to drive tests and review.

---

## 4. What must be tested

### 4.1 Object-level access

Test that a caller cannot access another subject’s record by:

- changing the object ID,
- changing the tenant/account ID,
- hitting equivalent routes for the same object,
- using list/search endpoints instead of direct lookup.

### 4.2 Collection filtering

Test that lists, exports, search results, dashboards, and analytics widgets do not include out-of-scope records.

### 4.3 Field-level exposure

Test that sensitive fields are hidden even when the object itself is visible.

Examples:

- billing identifiers,
- MFA secrets,
- internal notes,
- moderation flags,
- access tokens,
- processor-only metadata.

### 4.4 State-changing actions

Test create, update, delete, approve, export, resend, rotate, and impersonate actions separately from read access.

Being allowed to read an object does **not** imply permission to mutate it.

### 4.5 Role transitions and admin surfaces

Test:

- normal user against admin endpoints,
- support role against destructive actions,
- newly introduced roles with inherited permissions,
- privilege escalation via mass assignment or policy gaps.

### 4.6 Tenant isolation

For multi-tenant systems, always test:

- cross-tenant direct object lookup,
- cross-tenant search,
- cross-tenant bulk export,
- background jobs processing mixed tenant queues,
- tenant context switching in admin/support tools.

---

## 5. Recommended test layers

Use more than one layer.

| Layer | What it catches | Example |
|---|---|---|
| Policy / unit tests | rule logic drift | role-to-action mapping, ownership predicates |
| Integration tests | handler + DB query mistakes | missing `WHERE owner_id = ?` or tenant clause |
| Contract / endpoint tests | route coverage drift | new endpoint missing authz check |
| UI / e2e tests | dangerous exposed actions and impersonation workflow gaps | hidden button backed by unprotected API |

Do not rely on UI tests alone. The server is the enforcement boundary.

---

## 6. Test data design

Good authz tests depend on good fixtures.

Minimum fixture model:

- user A in tenant A,
- user B in tenant A,
- user C in tenant B,
- tenant A admin,
- support/admin actor if such a role exists,
- at least one object per actor and tenant.

If you only create one user and one object in tests, you will miss most real authorization failures.

---

## 7. REST testing pattern

### 7.1 Object ownership test

```python
import requests

BASE = "http://localhost:8000"

def test_other_user_cannot_read_invoice(user_a, user_b):
    response = requests.get(
        f"{BASE}/api/invoices/{user_a['invoice_id']}",
        headers={"Authorization": f"Bearer {user_b['token']}"},
        timeout=10,
    )
    assert response.status_code in (403, 404)
```

### 7.2 Collection filter test

```python
def test_invoice_list_only_returns_caller_records(user_a, user_b):
    response = requests.get(
        f"{BASE}/api/invoices",
        headers={"Authorization": f"Bearer {user_b['token']}"},
        timeout=10,
    )
    data = response.json()
    assert all(item["owner_id"] == user_b["user_id"] for item in data["items"])
```

### 7.3 Privileged action test

```python
def test_standard_user_cannot_delete_other_user_invoice(user_a, user_b):
    response = requests.delete(
        f"{BASE}/api/invoices/{user_a['invoice_id']}",
        headers={"Authorization": f"Bearer {user_b['token']}"},
        timeout=10,
    )
    assert response.status_code in (403, 404)
```

---

## 8. GraphQL testing pattern

GraphQL often hides authz drift because many fields share the same entry point.

Test separately:

- object lookups,
- list queries,
- nested resolvers,
- admin-only mutations,
- sensitive fields.

```python
def test_graphql_blocks_cross_tenant_lookup(gql_client, tenant_b_user, tenant_a_invoice_id):
    query = """
    query($id: ID!) {
      invoice(id: $id) {
        id
        amount
        internalNotes
      }
    }
    """
    result = gql_client(
        query,
        variables={"id": tenant_a_invoice_id},
        token=tenant_b_user["token"],
    )
    assert result["status"] in (200, 403)
    if result["status"] == 200:
        assert result["body"].get("data", {}).get("invoice") in (None, {})
```

High-risk GraphQL regression zones:

- nested relations that bypass tenant or ownership checks,
- field resolvers exposing sensitive properties,
- batch loaders that fetch by ID without caller scope,
- admin mutations exposed to any authenticated user.

---

## 9. High-risk cases to test explicitly

### 9.1 Bulk export

Bulk export often bypasses the per-object checks that work elsewhere.

Test:

- export only caller’s tenant or owned records,
- support/admin export requires explicit role and justification,
- exported fields match data-classification expectations.

### 9.2 Search and autocomplete

Search leaks are common because teams test only direct object lookups.

Test:

- foreign names/emails/order numbers are not returned,
- prefix search does not reveal existence of another tenant’s objects,
- autocomplete respects role and tenant scope.

### 9.3 Background jobs and queues

If a worker consumes user-controlled identifiers, re-check:

- tenant scope,
- ownership or delegated access,
- current privilege at execution time.

Do not assume that because a job was queued by a valid user, the target is still authorized when processed.

### 9.4 Support impersonation

If support impersonation exists, test:

- who can impersonate,
- what actions remain blocked while impersonating,
- whether impersonation is logged,
- whether high-risk actions require re-approval.

### 9.5 Soft delete and archive views

Deleted or archived objects still need authz.

Test that archive endpoints, restore flows, and audit views do not expose objects across owners or tenants.

---

## 10. CI guardrails

Minimum useful CI controls:

- run authz regression suite on every sensitive backend change,
- fail when new routes or resolvers are added without corresponding tests,
- tag authz tests so they can run fast in PRs and deeper in nightly builds,
- keep fixtures deterministic enough to pinpoint exactly which permission failed.

Useful patterns:

- route inventory snapshot reviewed with code changes,
- policy file coverage checks,
- mandatory negative test in PRs touching auth middleware or policy code,
- test matrix per critical resource type.

---

## 11. Review checklist for authorization changes

| Check | Expected |
|---|---|
| New route or resolver has explicit authz expectation | Yes |
| Negative tests exist for non-owner / wrong-tenant / low-privilege actor | Yes |
| List/search/export coverage included where relevant | Yes |
| Field-level exposure tested for sensitive properties | Yes |
| Background job or async path re-checks authorization | Yes |
| Support/admin bypass is explicit, justified, and logged | Yes |
| Multi-tenant isolation tested across at least two tenants | Yes |
| Mass-assignment / role escalation edge cases covered | Yes |

---

## 12. Red flags

Treat these as strong signals of incomplete coverage:

- “we already test login” used as a substitute for authorization tests,
- only owner happy-path tests,
- no tests for list/export/search endpoints,
- no cross-tenant fixtures,
- GraphQL tests cover only schema success and not field visibility,
- privileged roles tested only manually,
- support/admin impersonation not logged or not testable,
- 500 errors or null dereferences when unauthorized input is supplied.

---

## 13. Good output format for findings

When you find an authz regression, document:

1. **actor**,
2. **resource**,
3. **action**,
4. **expected** vs **actual**,
5. **blast radius**,
6. **minimal fix**,
7. **regression test to add**.

Example:

| Field | Example |
|---|---|
| Actor | tenant B analyst |
| Resource | tenant A invoice export |
| Action | download CSV |
| Expected | denied |
| Actual | HTTP 200 with foreign records |
| Blast radius | cross-tenant financial data exposure |
| Minimal fix | enforce tenant predicate in export query |
| Regression test | export endpoint negative test for cross-tenant actor |

---

## 14. Bottom line

Authorization quality is not proven by one middleware function. It is proven by **repeatable negative tests** that survive refactors, new endpoints, new roles, and new product surfaces.

If a team cannot quickly show the negative tests that protect its critical objects, assume the authorization model will drift under change.
