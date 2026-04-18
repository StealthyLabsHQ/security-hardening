---
title: "Production Error Handling & Logging Security"
slug: production-error-handling
category: appsec
depth: 2
audit_level: [1, 2]
last_reviewed: 2026-04-03
sources:
  - "OWASP Error Handling Cheat Sheet"
  - "OWASP Logging Cheat Sheet"
triggers_strong: ["stack trace leak", "error handling", "debug mode", "log redaction"]
triggers_weak: ["logging security", "error responses"]
related: ["privacy-data-minimization", "api-security"]
---

# Production Error Handling & Logging Security

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Essential | Automation: Partial (SAST detects stack trace in response; log PII requires manual review)

Two of the most common information leaks in production:
1. Error responses that reveal internal details (stack traces, paths, versions)
2. Logs that contain secrets, tokens, or personal data

---

## Error Responses

### Never expose internals to the client

```python
# Vulnerable - full stack trace in API response
@app.exception_handler(Exception)
async def error_handler(request, exc):
    return JSONResponse(status_code=500, content={
        "error": str(exc),              # reveals internal logic
        "traceback": traceback.format_exc(),  # reveals file paths, line numbers
        "detail": repr(exc),            # reveals class names, DB schema
    })

# Safe - generic message + reference ID for support
import uuid
@app.exception_handler(Exception)
async def error_handler(request, exc):
    error_id = str(uuid.uuid4())
    logger.error(f"[{error_id}] Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={
        "error": "An unexpected error occurred.",
        "id": error_id   # user can report this ID; support can look it up in logs
    })
```

```javascript
// Express - safe error middleware
app.use((err, req, res, next) => {
  const id = crypto.randomUUID();
  console.error(`[${id}]`, err.stack);  // full detail in server logs only
  res.status(500).json({ error: 'Internal server error', id });
});
```

### HTTP status codes - use them correctly

| Situation | Correct code | What NOT to do |
|-----------|-------------|----------------|
| Resource not found AND user not authorized | 404 | Do not use 403 (reveals resource exists) |
| Invalid input | 400 | Do not return 500 with validation details |
| Unauthenticated | 401 | Do not return 200 with `{ "success": false }` |
| Authenticated but not authorized | 403 | Do not return 404 to hide the endpoint entirely (inconsistent) |
| Server error | 500 + opaque message | Do not include exception message or stack trace |
| Rate limited | 429 | Include `Retry-After` header, no internal details |

### Remove version and technology banners

```nginx
# Nginx
server_tokens off;

# Apache
ServerTokens Prod
ServerSignature Off
```

```javascript
// Express
app.disable('x-powered-by');
// Or with Helmet (handles this automatically)
app.use(helmet());
```

```python
# FastAPI - remove default "detail" field format in validation errors
# or customize it to not reveal field names to unauthenticated callers
```

### Custom error pages for non-API routes

```nginx
error_page 404 /errors/404.html;
error_page 500 502 503 504 /errors/500.html;
```

Never let the framework's default error page (Django yellow page, Rails error page, Spring Whitelabel) reach production users.

---

## Logging - What to Log, What Not to Log

### Never log these

```python
# Vulnerable - logging sensitive data
logger.info(f"Login: user={email} password={password}")
logger.debug(f"Headers: {request.headers}")   # contains Authorization
logger.info(f"Payload: {request.json()}")      # may contain card numbers, PII
logger.error(f"Token invalid: {token}")        # logs the actual token
logger.info(f"User data: {user.__dict__}")     # may contain hashed password
```

### Always log these (for security monitoring)

```python
# Authentication events
logger.info(f"auth.login.success user_id={user.id} ip={request.client.host}")
logger.warning(f"auth.login.failure email_hash={hash_email(email)} ip={request.client.host}")
logger.warning(f"auth.login.locked email_hash={hash_email(email)} reason=too_many_attempts")

# Access control failures
logger.warning(f"authz.denied user_id={user.id} resource=invoice:{invoice_id} action=read")

# Admin actions (full audit trail)
logger.info(f"admin.action actor={admin.id} action=delete_user target={target_id}")

# Suspicious patterns
logger.warning(f"rate_limit.hit endpoint=/api/login ip={ip} count={count}")
```

### Masking sensitive fields in logs

```python
# Log a safe summary, never the full object
def safe_log_user(user):
    return {
        "id": user.id,
        "email_domain": user.email.split("@")[1],  # domain only, not full email
        # no password, no full email, no tokens
    }

# Mask a token for logging (show prefix only)
def mask_token(token: str) -> str:
    if not token or len(token) < 8:
        return "[REDACTED]"
    return token[:6] + "..." + token[-4:]
# "ghp_abc123xyz" -> "ghp_ab...xyz"
```

```javascript
// Structured logging with field redaction (Pino)
const logger = pino({
  redact: {
    paths: ['req.headers.authorization', 'body.password', 'body.token', 'user.password'],
    censor: '[REDACTED]'
  }
});
```

```go
// Zap logger - structured logging, never log raw request bodies
logger.Info("request received",
    zap.String("method", r.Method),
    zap.String("path", r.URL.Path),
    zap.String("user_id", userID),
    // do NOT log r.Body or Authorization header
)
```

---

## Logging - What Good Security Logs Look Like

Every security-relevant log entry should have:

```json
{
  "timestamp": "2026-04-03T14:23:01Z",
  "level": "warning",
  "event": "auth.login.failure",
  "user_id": null,
  "email_hash": "sha256:abc123...",
  "ip": "203.0.113.42",
  "user_agent": "Mozilla/5.0...",
  "request_id": "req_7f3a1b9c",
  "session_id": null
}
```

Fields to include: `timestamp`, `event type`, `user/session identifier`, `IP`, `request ID`.
Fields to never include: `password`, `token`, `secret`, `full email` (hash it), `card number`, `SSN`.

---

## Config Validation at Startup

Fail fast at boot rather than failing silently in production or logging a missing secret.

```python
# Python - validate required env vars at startup
import os, sys

REQUIRED_ENV = [
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "JWT_PRIVATE_KEY",
    "STRIPE_SECRET_KEY",
]

missing = [var for var in REQUIRED_ENV if not os.environ.get(var)]
if missing:
    print(f"FATAL: Missing required environment variables: {', '.join(missing)}", file=sys.stderr)
    sys.exit(1)
```

```javascript
// Node.js - fail on startup if secrets are missing
const REQUIRED = ['DATABASE_URL', 'OPENAI_API_KEY', 'JWT_SECRET'];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}
```

```go
// Go - validate at init
func mustGetEnv(key string) string {
    val := os.Getenv(key)
    if val == "" {
        log.Fatalf("required environment variable %s is not set", key)
    }
    return val
}

var (
    databaseURL = mustGetEnv("DATABASE_URL")
    jwtSecret   = mustGetEnv("JWT_SECRET")
)
```

---

## Debug Mode in Production

Debug mode typically:
- Shows full stack traces in HTTP responses
- Enables auto-reload (file system access)
- Disables CSRF protection
- Exposes admin interfaces
- Shows SQL queries

```python
# Django - must be False in production
DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"
# Never: DEBUG = True

# FastAPI - remove debug from uvicorn in production
# Development: uvicorn app:app --reload --log-level debug
# Production:  uvicorn app:app --workers 4 --log-level warning
```

```javascript
// Express - disable verbose error output in production
if (process.env.NODE_ENV !== 'production') {
  app.use(errorhandler()); // detailed errors in dev only
}
// Production error handler defined separately (opaque messages)
```

---

## CORS Error Responses

Do not reveal allowed origins in error messages:

```python
# Vulnerable - reveals internal configuration
raise HTTPException(
    status_code=403,
    detail=f"Origin {origin} not in allowed list: {ALLOWED_ORIGINS}"
)

# Safe
raise HTTPException(status_code=403, detail="Forbidden")
```

---

## Checklist

| Check | Expected |
|-------|----------|
| No stack traces in HTTP responses | Yes |
| No exception messages exposed to client | Yes |
| Generic 500 message with reference ID | Yes |
| Server version headers removed | Yes |
| Debug mode disabled in production | Yes |
| Passwords/tokens never logged | Yes |
| Auth events logged (success and failure) | Yes |
| Access control failures logged | Yes |
| Startup fails if required secrets are missing | Yes |
| PII fields redacted or hashed in logs | Yes |
| Custom error pages configured | Yes |

