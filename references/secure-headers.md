# Secure HTTP Headers Reference

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Essential | Automation: Full (Observatory, securityheaders.com)


## Recommended Headers (Production)

### Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- Forces HTTPS for 2 years
- `preload` submits to browser preload lists (irreversible - use carefully)
- Don't set on HTTP responses

### Content-Security-Policy (CSP)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{RANDOM}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```
- Generate a fresh cryptographic nonce per request for inline scripts
- Never use `unsafe-eval` or `unsafe-inline` for scripts
- Use `report-uri` or `report-to` to collect violations in staging

**Strict API / no-HTML apps**:
```
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
```

### X-Frame-Options
```
X-Frame-Options: DENY
```
- Prevents clickjacking
- `DENY` = never framed; `SAMEORIGIN` = only same origin
- Superseded by CSP `frame-ancestors` but keep both for compatibility

### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
- Prevents MIME-type sniffing (IE/Chrome inferring content type)
- Always set this

### Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
Options (from most to least restrictive):
- `no-referrer` - never send Referer
- `no-referrer-when-downgrade` - don't send on HTTPS→HTTP
- `strict-origin-when-cross-origin` ← recommended default
- `unsafe-url` - always send full URL (avoid)

### Permissions-Policy
```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
```
- Restricts browser feature access
- Adjust to what your app actually uses
- `interest-cohort=()` opts out of FLoC

### Cross-Origin-Embedder-Policy (COEP)
```
Cross-Origin-Embedder-Policy: require-corp
```
- Required for `SharedArrayBuffer` and high-resolution timers
- Only enable if all subresources have proper CORP headers

### Cross-Origin-Opener-Policy (COOP)
```
Cross-Origin-Opener-Policy: same-origin
```
- Isolates browsing context from cross-origin windows

### Cross-Origin-Resource-Policy (CORP)
```
Cross-Origin-Resource-Policy: same-origin
```
- Prevents Spectre-style cross-origin reads of resources

---

## Cookie Security Attributes

```
Set-Cookie: session=<token>; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600
```

| Attribute | Purpose |
|-----------|---------|
| `Secure` | Cookie only sent over HTTPS |
| `HttpOnly` | Inaccessible to JavaScript (prevents XSS theft) |
| `SameSite=Strict` | Cookie not sent on cross-site requests (CSRF protection) |
| `SameSite=Lax` | Sent on top-level navigations (GET only) |
| `SameSite=None; Secure` | Cross-site (required for third-party cookies) |
| `Path=/` | Scope cookie to path |
| `Max-Age` / `Expires` | Set expiry; session cookies expire on tab close |
| `__Secure-` prefix | Enforces `Secure` flag (Chrome/Firefox) |
| `__Host-` prefix | Enforces `Secure`, no `Domain`, `Path=/` |

---

## CORS Configuration

### Authenticated APIs - Never use wildcard
```
Access-Control-Allow-Origin: https://app.yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### Public APIs (no credentials)
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
```

**Never combine** `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`

---

## Headers to Remove / Hide

| Header | Why |
|--------|-----|
| `Server: Apache/2.4.51` | Reveals version info → targeted attacks |
| `X-Powered-By: PHP/8.0` | Same |
| `X-AspNet-Version` | Same |
| `X-Generator` | CMS fingerprinting |

In nginx: `server_tokens off;`
In Apache: `ServerTokens Prod; ServerSignature Off`
In Express: `app.disable('x-powered-by')`

---

## Security Header Scanner

Test your headers at:
- https://securityheaders.com
- https://observatory.mozilla.org

---

## Quick Nginx Hardening Block

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'none'" always;
server_tokens off;
```

## Quick Cloudflare Workers Headers

```javascript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'",
};

// Apply to response:
Object.entries(securityHeaders).forEach(([key, value]) => {
  response.headers.set(key, value);
});
```
