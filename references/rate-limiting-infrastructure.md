# Rate Limiting Infrastructure Patterns

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: Recommended | Audit Level: 2-3 | Automation: Partial (edge rules, proxy config tests, and 429 telemetry automatable; quota design and exception handling manual)

Rate limiting is not a single control. It is a stack of limits applied at the edge, reverse proxy, application, and backend cache/store.

Use this guide when you need **real** rate limiting patterns for login, password reset, OTP, search, uploads, GraphQL, public APIs, or abuse-prone business flows.

---

## 1. Design Rules

- Limit by the **best identity available**:
  - API key or client ID first,
  - authenticated user second,
  - IP fallback only when nothing better exists.
- Sensitive routes need tighter limits than general API traffic.
- Count expensive operations separately from cheap reads.
- Return `429 Too Many Requests` and include `Retry-After`.
- Log blocks with route, key, source IP, principal, tenant, user-agent, and reason.
- Do not trust `X-Forwarded-For` unless your proxy chain is correctly configured.
- Rate limiting should slow abuse, not become the only access control.

---

## 2. Where to Enforce

| Layer | Best for | Common mistake |
|-------|----------|----------------|
| CDN / edge | Volumetric abuse, bot traffic, unauthenticated brute force | Assuming edge-only limits are enough for business-flow abuse |
| Reverse proxy (`nginx`) | Fast per-route guardrails close to the app | Using raw client IP when behind a proxy chain |
| App layer | User-aware or tenant-aware throttles | Keying only by IP |
| Shared store (`Redis`) | Distributed counters across app instances | Using local memory in a multi-node deployment |

---

## 3. Nginx Example

```nginx
# Trust the real client IP only from your proxy / load balancer
set_real_ip_from 10.0.0.0/8;
real_ip_header X-Forwarded-For;
real_ip_recursive on;

# General API limit
limit_req_zone $binary_remote_addr zone=api_per_ip:20m rate=20r/s;

# Tighter login limit
limit_req_zone $binary_remote_addr zone=login_per_ip:10m rate=5r/m;

server {
    location /api/ {
        limit_req zone=api_per_ip burst=40 nodelay;
        limit_req_status 429;
    }

    location = /auth/login {
        limit_req zone=login_per_ip burst=5 nodelay;
        limit_req_status 429;
        add_header Retry-After 60 always;
        proxy_pass http://app;
    }
}
```

**Notes:**

- Keep login, OTP, password reset, invite accept, and magic-link verification on separate stricter zones.
- `burst` should be deliberate, not a giant hidden bypass.
- Pair IP-based limits with user/account-aware limits in the application.

---

## 4. Cloudflare Workers Pattern

At the edge, use Cloudflare rate limiting for coarse control and keep application-aware throttles for user/business flow abuse.

```js
export default {
  async fetch(request, env) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const url = new URL(request.url);

    if (url.pathname === "/auth/login") {
      const key = { key: `login:${ip}` };
      const { success } = await env.LOGIN_LIMITER.limit(key);
      if (!success) {
        return new Response("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
```

**Edge caveat:** edge-local counters are useful but do not replace user-aware limits in the application for account takeover, OTP abuse, or GraphQL cost abuse.

---

## 5. Redis Counter Pattern

Use a shared store when you have multiple app instances.

```python
import time
import redis

r = redis.Redis(host="redis", decode_responses=True)

def check_limit(bucket: str, limit: int, window_seconds: int) -> bool:
    now = int(time.time())
    window = now // window_seconds
    key = f"rl:{bucket}:{window}"

    with r.pipeline() as pipe:
        pipe.incr(key, 1)
        pipe.expire(key, window_seconds + 5)
        count, _ = pipe.execute()

    return count <= limit

# Example usage
if not check_limit(f"login_ip:{client_ip}", limit=10, window_seconds=60):
    raise TooManyRequests()
```

For sensitive flows, combine buckets:

- `login_ip:{ip}`
- `login_account:{email_hash}`
- `reset_email:{email_hash}`
- `graphql_cost:{user_id}`

---

## 6. Route Classes and Starting Limits

| Route class | Starting point |
|-------------|----------------|
| Login / OTP / password reset | 5-10 per minute per IP + per account/email bucket |
| Account creation | 3-10 per minute per IP + bot checks if public |
| Public search | moderate IP limit + caching |
| File upload | low request rate + size caps + concurrency caps |
| GraphQL | request count + depth + complexity budget + alias caps |
| Webhooks | provider-aware burst handling, not generic end-user limits |

Start conservative, then tune from logs.

---

## 7. Logging and Detection

Log at least:

- route or operation name,
- key used for throttling,
- source IP,
- authenticated principal if present,
- tenant / client ID,
- decision (`allow`, `delay`, `block`),
- limit, remaining, reset window.

Detection examples:

- burst of login blocks from one IP,
- distributed failures against one account,
- sudden spike in GraphQL complexity rejects,
- repeated 429 on password reset or invite flows.

Related guide: `detection-engineering.md`.

---

## 8. Common Failure Modes

- Limiting only by IP behind large NATs and thinking that is enough.
- Trusting spoofable forwarding headers.
- Applying a single global limit to every route.
- No shared store in a multi-instance deployment.
- No `Retry-After`, no logs, no alerting.
- Edge limit exists, but app still allows unlimited per-user abuse.
- Login is throttled but password reset, OTP verify, and magic-link redeem are not.

---

## 9. Checklist

| Check | Expected |
|-------|----------|
| Sensitive routes have stricter limits than generic API traffic | Yes |
| Reverse proxy trusts client IP only from known upstreams | Yes |
| Distributed deployments use shared counters | Yes |
| `429` responses include `Retry-After` | Yes |
| Logs capture allow/block decisions and keys | Yes |
| GraphQL uses count + cost/depth controls | Yes |
| Account-aware limits exist for auth flows | Yes |

---

## References

- `api-security.md`
- `graphql-security.md`
- `security-testing-examples.md`
- `detection-engineering.md`
