---
title: "Security Testing Examples"
slug: security-testing-examples
category: appsec
depth: 2
audit_level: [2, 3]
last_reviewed: 2026-04-14
sources:
  - "OWASP Web Security Testing Guide"
  - "OWASP ZAP"
triggers_strong: ["security tests", "idor test", "zap baseline", "upload test"]
triggers_weak: ["security testing", "verification"]
related: ["threat-modeling", "framework-examples"]
---

# Security Testing Examples

> Last reviewed: 2026-04-14 | Next review: 2027-04-14 | Priority: Recommended | Audit Level: 2-3 | Automation: Full (all examples runnable in CI)

Executable security tests you can add to your test suite today. Each test validates a specific security control - failing tests mean the control is missing or broken.

---

## Authorization / IDOR Tests

### Python (pytest + requests)

```python
import pytest, requests

BASE = "http://localhost:8000"

@pytest.fixture
def user_a(tmp_path):
    r = requests.post(f"{BASE}/auth/register", json={"email": "a@test.com", "password": "Pa$$w0rd!"})
    token = requests.post(f"{BASE}/auth/login", json={"email": "a@test.com", "password": "Pa$$w0rd!"}).json()["token"]
    invoice = requests.post(f"{BASE}/invoices", json={"amount": 100}, headers={"Authorization": f"Bearer {token}"}).json()
    return {"token": token, "invoice_id": invoice["id"]}

@pytest.fixture
def user_b():
    requests.post(f"{BASE}/auth/register", json={"email": "b@test.com", "password": "Pa$$w0rd!"})
    token = requests.post(f"{BASE}/auth/login", json={"email": "b@test.com", "password": "Pa$$w0rd!"}).json()["token"]
    return {"token": token}

def test_idor_invoice(user_a, user_b):
    """User B must not read User A's invoice."""
    r = requests.get(
        f"{BASE}/invoices/{user_a['invoice_id']}",
        headers={"Authorization": f"Bearer {user_b['token']}"}
    )
    assert r.status_code in (403, 404), f"IDOR: got {r.status_code}, expected 403/404"

def test_unauthenticated_access():
    """Protected endpoint must reject requests with no token."""
    r = requests.get(f"{BASE}/invoices/1")
    assert r.status_code == 401

def test_mass_assignment(user_a):
    """User must not be able to elevate their own role."""
    r = requests.put(
        f"{BASE}/users/me",
        json={"name": "hacker", "role": "admin", "isVerified": True},
        headers={"Authorization": f"Bearer {user_a['token']}"}
    )
    # Check actual DB value, not just response
    profile = requests.get(f"{BASE}/users/me", headers={"Authorization": f"Bearer {user_a['token']}"}).json()
    assert profile.get("role") != "admin", "Mass assignment: role was elevated"
    assert profile.get("isVerified") is not True, "Mass assignment: isVerified was set"
```

### JavaScript (Jest + supertest)

```javascript
const request = require('supertest');
const app = require('../app');

describe('Authorization', () => {
  let tokenA, tokenB, resourceId;

  beforeAll(async () => {
    // Create user A, create a resource
    await request(app).post('/auth/register').send({ email: 'a@test.com', password: 'Pa$$w0rd!' });
    const loginA = await request(app).post('/auth/login').send({ email: 'a@test.com', password: 'Pa$$w0rd!' });
    tokenA = loginA.body.token;
    const res = await request(app).post('/posts').set('Authorization', `Bearer ${tokenA}`).send({ title: 'Secret post' });
    resourceId = res.body.id;

    // Create user B
    await request(app).post('/auth/register').send({ email: 'b@test.com', password: 'Pa$$w0rd!' });
    const loginB = await request(app).post('/auth/login').send({ email: 'b@test.com', password: 'Pa$$w0rd!' });
    tokenB = loginB.body.token;
  });

  test('user B cannot read user A post (IDOR)', async () => {
    const res = await request(app)
      .get(`/posts/${resourceId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(res.status);
  });

  test('unauthenticated request is rejected', async () => {
    const res = await request(app).get('/posts/1');
    expect(res.status).toBe(401);
  });

  test('admin endpoint blocked for normal user', async () => {
    const res = await request(app)
      .delete('/admin/users/1')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(403);
  });
});
```

---

## Rate Limiting Tests

```python
# pytest
import requests, time

def test_login_rate_limit():
    """Login must be blocked after 10 failed attempts."""
    for i in range(10):
        requests.post(f"{BASE}/auth/login", json={"email": "x@x.com", "password": "wrong"})
    r = requests.post(f"{BASE}/auth/login", json={"email": "x@x.com", "password": "wrong"})
    assert r.status_code == 429, f"Rate limit not enforced: got {r.status_code}"
    assert "Retry-After" in r.headers, "Retry-After header missing on 429"

def test_password_reset_rate_limit():
    """Password reset must be throttled."""
    for _ in range(5):
        requests.post(f"{BASE}/auth/reset-password", json={"email": "x@x.com"})
    r = requests.post(f"{BASE}/auth/reset-password", json={"email": "x@x.com"})
    assert r.status_code == 429
```

---

## GraphQL Security Tests

```python
GRAPHQL_URL = f"{BASE}/graphql"

def gql(query: str, variables=None, headers=None):
    return requests.post(
        GRAPHQL_URL,
        json={"query": query, "variables": variables or {}},
        headers=headers or HEADERS,
    )

def test_graphql_blocks_introspection_in_production():
    """Unprivileged clients must not get schema introspection in production."""
    r = gql("{ __schema { types { name } } }")
    assert r.status_code in (200, 400, 403), f"Unexpected status for introspection: {r.status_code}"
    if r.status_code == 200:
        body = r.json()
        assert "__schema" not in (body.get("data") or {}), "GraphQL introspection enabled for unprivileged client"

def test_graphql_depth_limit():
    """Deep nested queries must be rejected or short-circuited."""
    query = """
    query {
      me {
        manager {
          manager {
            manager {
              reports {
                manager {
                  reports { id }
                }
              }
            }
          }
        }
      }
    }
    """
    r = gql(query)
    body = r.json() if "json" in r.headers.get("Content-Type", "").lower() else {}
    assert r.status_code in (400, 413, 422, 429) or body.get("errors"), \
        "Deep GraphQL query executed without a depth or complexity guard"

def test_graphql_alias_fanout_limit():
    """Alias fan-out must not allow cheap DoS against the same resolver."""
    aliases = "\n".join([f"u{i}: user(id: \\\"me\\\") {{ id }}" for i in range(40)])
    r = gql(f"query {{\n{aliases}\n}}")
    body = r.json() if "json" in r.headers.get("Content-Type", "").lower() else {}
    assert r.status_code in (400, 413, 422, 429) or body.get("errors"), \
        "Alias fan-out executed without cost / alias guardrails"

def test_graphql_blocks_admin_only_fields():
    """Sensitive fields must not be exposed just because the client asks for them."""
    query = """
    query {
      me {
        id
        email
        mfaSecret
        billingCustomerId
      }
    }
    """
    r = gql(query)
    assert r.status_code in (200, 400, 403), f"Unexpected status for field-level authz: {r.status_code}"
    if r.status_code == 200:
        me = (r.json().get("data") or {}).get("me") or {}
        assert me.get("mfaSecret") in (None, ""), "Field-level authz failure: mfaSecret exposed"
        assert me.get("billingCustomerId") in (None, ""), "Field-level authz failure: billingCustomerId exposed"
```

---

## File Upload Tests

```python
import io, requests

UPLOAD_URL = f"{BASE}/upload"
HEADERS = {"Authorization": f"Bearer {token}"}

def test_upload_rejects_php():
    """Server must reject PHP files."""
    r = requests.post(UPLOAD_URL, files={"file": ("shell.php", b"<?php system($_GET['cmd']); ?>", "application/x-php")}, headers=HEADERS)
    assert r.status_code in (400, 415), f"PHP upload accepted: {r.status_code}"

def test_upload_rejects_path_traversal():
    """Filename with path traversal must be sanitised."""
    r = requests.post(UPLOAD_URL, files={"file": ("../../etc/passwd", b"root:x:0:0", "text/plain")}, headers=HEADERS)
    if r.status_code == 200:
        # File must not have been written outside the upload directory
        assert "etc/passwd" not in r.json().get("path", ""), "Path traversal via filename"

def test_upload_enforces_size_limit():
    """Uploads over the limit must be rejected."""
    big = io.BytesIO(b"A" * (10 * 1024 * 1024 + 1))  # 10 MB + 1 byte
    r = requests.post(UPLOAD_URL, files={"file": ("big.jpg", big, "image/jpeg")}, headers=HEADERS)
    assert r.status_code == 413, f"Oversized upload accepted: {r.status_code}"

def test_upload_rejects_svg_xss():
    """SVG with embedded script must be rejected or sanitised."""
    svg = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    r = requests.post(UPLOAD_URL, files={"file": ("test.svg", svg, "image/svg+xml")}, headers=HEADERS)
    if r.status_code == 200:
        # If SVG is accepted, it must not be served with Content-Type: image/svg+xml
        # (which would allow XSS in browser)
        assert "svg" not in r.headers.get("Content-Type", "").lower() or \
               "attachment" in r.headers.get("Content-Disposition", "").lower(), \
               "SVG served inline - XSS risk"
```

---

## SSRF Tests

```python
def test_ssrf_blocks_localhost():
    """Server must not fetch localhost URLs."""
    for url in ["http://localhost/", "http://127.0.0.1/", "http://0.0.0.0/"]:
        r = requests.post(f"{BASE}/fetch-preview", json={"url": url}, headers=HEADERS)
        assert r.status_code in (400, 422, 403), f"SSRF: {url} was fetched (got {r.status_code})"

def test_ssrf_blocks_aws_metadata():
    """Server must not fetch AWS metadata endpoint."""
    r = requests.post(
        f"{BASE}/fetch-preview",
        json={"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"},
        headers=HEADERS
    )
    assert r.status_code in (400, 422, 403), f"SSRF: AWS metadata reachable (got {r.status_code})"

def test_ssrf_blocks_private_ranges():
    """Server must not fetch private IP ranges."""
    for ip in ["http://10.0.0.1/", "http://192.168.1.1/", "http://172.16.0.1/"]:
        r = requests.post(f"{BASE}/fetch-preview", json={"url": ip}, headers=HEADERS)
        assert r.status_code in (400, 422, 403), f"SSRF: private range {ip} reachable"
```

---

## Error Handling Tests

```python
def test_500_does_not_leak_stacktrace():
    """500 responses must not expose stack traces or internal paths."""
    # Trigger an intentional 500 (send malformed input)
    r = requests.get(f"{BASE}/users/not-a-valid-id", headers=HEADERS)
    if r.status_code == 500:
        body = r.text.lower()
        for leak in ["traceback", "at line", "exception", "/home/", "/var/", "sqlalchemy", "django"]:
            assert leak not in body, f"500 leaks internal detail: '{leak}' found in response"

def test_error_response_has_reference_id():
    """500 responses should include a reference ID for support."""
    r = requests.get(f"{BASE}/users/not-a-valid-id", headers=HEADERS)
    if r.status_code == 500:
        data = r.json()
        assert "id" in data or "reference" in data or "error_id" in data, \
            "500 response has no reference ID for support lookups"
```

---

## Security Headers Tests

```python
def test_security_headers():
    """Verify all required security headers are present."""
    r = requests.get(f"{BASE}/")
    h = r.headers

    assert "X-Content-Type-Options" in h, "Missing X-Content-Type-Options"
    assert h["X-Content-Type-Options"] == "nosniff"

    assert "X-Frame-Options" in h or "frame-ancestors" in h.get("Content-Security-Policy", ""), \
        "Missing clickjacking protection"

    assert "Strict-Transport-Security" in h, "Missing HSTS"
    assert "max-age=" in h["Strict-Transport-Security"]

    assert "Referrer-Policy" in h, "Missing Referrer-Policy"

    # Server must not reveal version
    assert "php" not in h.get("X-Powered-By", "").lower(), "X-Powered-By reveals PHP version"
    assert "express" not in h.get("X-Powered-By", "").lower(), "X-Powered-By reveals Express"
```

---

## OWASP ZAP Baseline Scan (Docker - no install needed)

Run against a staging environment. Never run active scan against production.

```bash
# Baseline scan - passive only, safe for any environment
docker run --rm \
  -v $(pwd)/zap-reports:/zap/wrk \
  owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://your-staging-app.example.com \
  -r zap-report.html \
  -I  # do not fail on warnings, only fail on alerts

# Full scan - includes active tests (use staging only)
docker run --rm \
  -v $(pwd)/zap-reports:/zap/wrk \
  owasp/zap2docker-stable \
  zap-full-scan.py \
  -t https://your-staging-app.example.com \
  -r zap-full-report.html
```

Add to CI (passive scan only, on every PR to staging):

```yaml
- name: ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.10.0
  with:
    target: https://staging.myapp.com
    rules_file_name: .zap/rules.tsv
    fail_action: true
```

---

## Webhook Signature Tests

```python
import hmac, hashlib, json

SECRET = "my-webhook-secret"

def sign(payload: bytes, secret: str) -> str:
    return "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

def test_webhook_rejects_missing_signature():
    payload = json.dumps({"event": "payment"}).encode()
    r = requests.post(f"{BASE}/webhooks/stripe", data=payload,
                      headers={"Content-Type": "application/json"})
    assert r.status_code in (400, 401), "Webhook accepted with no signature"

def test_webhook_rejects_wrong_signature():
    payload = json.dumps({"event": "payment"}).encode()
    r = requests.post(f"{BASE}/webhooks/stripe", data=payload,
                      headers={"Content-Type": "application/json",
                               "Stripe-Signature": "sha256=invalidsignature"})
    assert r.status_code in (400, 401), "Webhook accepted with wrong signature"

def test_webhook_accepts_valid_signature():
    payload = json.dumps({"event": "payment"}).encode()
    r = requests.post(f"{BASE}/webhooks/stripe", data=payload,
                      headers={"Content-Type": "application/json",
                               "Stripe-Signature": sign(payload, SECRET)})
    assert r.status_code == 200, f"Valid webhook rejected: {r.status_code}"
```

---

## Go Security Tests

```go
func TestIDOR(t *testing.T) {
    // Create invoice as user A
    invoiceID := createInvoiceAsUserA(t)

    // Attempt to access as user B
    req, _ := http.NewRequest("GET", fmt.Sprintf("/invoices/%d", invoiceID), nil)
    req.Header.Set("Authorization", "Bearer "+userBToken)
    rr := httptest.NewRecorder()
    router.ServeHTTP(rr, req)

    if rr.Code != http.StatusNotFound && rr.Code != http.StatusForbidden {
        t.Errorf("IDOR: expected 403/404, got %d", rr.Code)
    }
}

func TestStackTraceNotExposed(t *testing.T) {
    req, _ := http.NewRequest("GET", "/users/not-a-number", nil)
    req.Header.Set("Authorization", "Bearer "+validToken)
    rr := httptest.NewRecorder()
    router.ServeHTTP(rr, req)

    body := rr.Body.String()
    for _, leak := range []string{"goroutine", "panic", "/home/", "runtime/"} {
        if strings.Contains(body, leak) {
            t.Errorf("Stack trace leaked in response: found %q", leak)
        }
    }
}
```

