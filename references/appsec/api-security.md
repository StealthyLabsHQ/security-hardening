---
title: "API Security Reference"
slug: api-security
category: appsec
depth: 2
audit_level: [2, 3]
last_reviewed: 2026-04-03
sources:
  - "OWASP API Security Top 10 2023"
  - "OWASP Application Security Verification Standard"
triggers_strong: ["api security", "bola", "bfla", "api authz"]
triggers_weak: ["rest api review", "api hardening"]
related: ["authorization-rbac", "graphql-security"]
---

# API Security Reference

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Essential | Automation: Partial (rate limiting, input validation; BOLA manual)


Covers REST, GraphQL, gRPC, and webhook security. Aligned with OWASP API Security Top 10 (2023).

---

## OWASP API Top 10 (2023) - Quick Reference

| ID | Name | One-line description |
|----|------|---------------------|
| API1 | Broken Object Level Authorization (BOLA/IDOR) | User accesses another user's object by changing an ID |
| API2 | Broken Authentication | Weak auth allows account takeover |
| API3 | Broken Object Property Level Authorization | User reads/writes fields they should not see |
| API4 | Unrestricted Resource Consumption | No rate limiting / quotas - DoS or cost explosion |
| API5 | Broken Function Level Authorization (BFLA) | User calls admin endpoints |
| API6 | Unrestricted Access to Sensitive Business Flows | Bots abuse signup, checkout, voting flows |
| API7 | Server-Side Request Forgery (SSRF) | Server fetches attacker-controlled URL |
| API8 | Security Misconfiguration | Debug endpoints, verbose errors, open CORS |
| API9 | Improper Inventory Management | Forgotten old API versions with no auth |
| API10 | Unsafe Consumption of APIs | Trusting third-party API responses without validation |

---

## BOLA / IDOR (API1)

The most common API vulnerability. Accessing another user's resource by changing an ID.

```python
# Vulnerable
@app.get('/invoices/{invoice_id}')
def get_invoice(invoice_id: int, current_user=Depends(get_current_user)):
    return db.query(Invoice).filter(Invoice.id == invoice_id).first()
    # Any authenticated user can read any invoice by changing the ID

# Safe - check ownership
@app.get('/invoices/{invoice_id}')
def get_invoice(invoice_id: int, current_user=Depends(get_current_user)):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.owner_id == current_user.id  # ownership check
    ).first()
    if not invoice:
        raise HTTPException(status_code=404)
    return invoice
```

**Rules:**
- Always filter by the authenticated user's ID in addition to the resource ID.
- Use UUIDs instead of sequential integers to make enumeration harder (but this is defense in depth, not a replacement for authorization).
- Log and alert on access control failures.

---

## Broken Function Level Authorization / BFLA (API5)

Users calling administrative or privileged endpoints.

```python
# Vulnerable - role not checked
@app.delete('/admin/users/{user_id}')
def delete_user(user_id: int, current_user=Depends(get_current_user)):
    db.query(User).filter(User.id == user_id).delete()

# Safe
@app.delete('/admin/users/{user_id}')
def delete_user(user_id: int, current_user=Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403)
    db.query(User).filter(User.id == user_id).delete()
```

**Rules:**
- Apply deny-by-default. Every function must explicitly verify the required role/permission.
- Separate admin APIs onto a different path prefix or subdomain, protected by network controls in addition to app-level auth.

---

## Mass Assignment (API3)

Automatically binding all request fields to a model exposes internal fields.

```javascript
// Vulnerable - Express + Mongoose
app.put('/users/:id', async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, req.body);
  // attacker sends { role: 'admin', isVerified: true }
});

// Safe - explicit allowlist
app.put('/users/:id', async (req, res) => {
  const { name, email, bio } = req.body;
  await User.findByIdAndUpdate(req.params.id, { name, email, bio });
});
```

---

## Rate Limiting & Quotas (API4)

Apply limits to every sensitive endpoint.

```nginx
# Nginx - rate limit login to 10 req/min per IP
limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;

location /api/auth/login {
    limit_req zone=login burst=5 nodelay;
    proxy_pass http://backend;
}
```

```python
# FastAPI + slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post('/auth/login')
@limiter.limit('10/minute')
def login(request: Request, credentials: LoginCredentials):
    ...
```

**Limits to apply per endpoint type:**

| Endpoint | Suggested limit |
|----------|----------------|
| Login | 10 requests / minute / IP |
| Password reset request | 5 requests / hour / IP |
| OTP / MFA verification | 5 attempts then lockout |
| Account creation | 20 requests / hour / IP |
| Search | 60 requests / minute / user |
| File upload | 10 requests / minute / user |

---

## Input Validation & JSON Schema

Validate the shape and content of every incoming payload.

```python
# FastAPI / Pydantic - automatic validation
from pydantic import BaseModel, EmailStr, constr

class UserCreate(BaseModel):
    name: constr(min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(gt=0, lt=150)
    # role is not in the schema - cannot be set by the user
```

```javascript
// Node.js - Joi
const schema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(1).max(149).required()
});
const { error, value } = schema.validate(req.body);
if (error) return res.status(400).json({ error: error.message });
```

---

## SSRF Prevention (API7)

The server should never fetch a URL controlled entirely by the user.

```python
# Vulnerable
@app.post('/fetch-preview')
def fetch_preview(url: str):
    return requests.get(url).text  # attacker sends http://169.254.169.254/...

# Safe
import ipaddress
from urllib.parse import urlparse

ALLOWED_SCHEMES = {'https'}
BLOCKED_HOSTS = {'localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254'}

def is_safe_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_SCHEMES:
        return False
    host = parsed.hostname
    if host in BLOCKED_HOSTS:
        return False
    try:
        addr = ipaddress.ip_address(host)
        if addr.is_private or addr.is_loopback or addr.is_link_local:
            return False
    except ValueError:
        pass  # hostname, not IP - DNS will resolve it
    return True
```

---

## Secure Error Handling

Never leak internal details to the client.

```python
# Vulnerable - exposes stack trace, DB schema, internal paths
@app.exception_handler(Exception)
async def generic_error(request, exc):
    return JSONResponse(status_code=500, content={"error": str(exc), "traceback": traceback.format_exc()})

# Safe
@app.exception_handler(Exception)
async def generic_error(request, exc):
    error_id = uuid.uuid4().hex
    logger.error(f"Unhandled error [{error_id}]: {exc}", exc_info=True)  # full detail in logs
    return JSONResponse(status_code=500, content={"error": "Internal server error", "id": error_id})
```

---

## Webhook Security - Signature Verification

Always verify that incoming webhooks are genuinely from the expected sender.

```python
import hmac, hashlib

def verify_webhook(payload: bytes, signature_header: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    received = signature_header.removeprefix('sha256=')
    return hmac.compare_digest(expected, received)  # constant-time comparison

@app.post('/webhooks/stripe')
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get('Stripe-Signature', '')
    if not verify_webhook(payload, sig, STRIPE_WEBHOOK_SECRET):
        raise HTTPException(status_code=401)
    ...
```

---

## GraphQL-Specific Security

```graphql
# Vulnerable query - deep nesting causes exponential DB load (DoS)
query {
  user {
    friends {
      friends {
        friends {
          friends { id name }
        }
      }
    }
  }
}
```

**Mitigations:**
- Enforce query depth limit (max 5-7 levels).
- Enforce query complexity limit (assign a cost to each field).
- Disable introspection in production.
- Rate limit by query cost, not just request count.

```javascript
// Apollo Server - depth and complexity limits
const server = new ApolloServer({
  schema,
  validationRules: [
    depthLimit(7),
    createComplexityRule({ maximumComplexity: 1000, variables: {} })
  ],
  introspection: process.env.NODE_ENV !== 'production'
});
```

---

## Pagination Security

```python
# Vulnerable - no max limit, attacker requests 1M rows
@app.get('/users')
def list_users(limit: int = 100, offset: int = 0):
    return db.query(User).offset(offset).limit(limit).all()

# Safe
@app.get('/users')
def list_users(limit: int = Query(default=20, le=100), offset: int = Query(default=0, ge=0)):
    return db.query(User).offset(offset).limit(limit).all()
```

---

## API Versioning & Inventory

Forgotten old API versions are a major attack surface.

- Maintain a machine-readable API inventory (OpenAPI spec, service registry).
- Deprecated versions must be properly decommissioned, not just undocumented.
- Apply the same security controls (auth, rate limiting, input validation) to all versions.
- Monitor traffic to old API versions and alert on unexpected usage.

---

## Audit Checklist

| Check | Expected |
|-------|----------|
| BOLA: ownership checked on every object access | Yes |
| BFLA: role checked on every admin/privileged function | Yes |
| Mass assignment: input fields explicitly allowlisted | Yes |
| Rate limiting on auth, reset, upload, signup | Yes |
| JSON schema / input validation on all endpoints | Yes |
| SSRF: user-supplied URLs validated against allowlist | Yes |
| Error responses are generic (no stack traces) | Yes |
| Webhook signatures verified | Yes |
| GraphQL: depth + complexity limits enabled | Yes |
| Introspection disabled in production | Yes |
| API inventory maintained, old versions decommissioned | Yes |

