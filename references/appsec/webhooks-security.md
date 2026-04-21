---
title: "Webhook Security"
slug: webhooks-security
category: appsec
depth: 2
audit_level: [2, 3]
last_reviewed: 2026-04-21
sources:
  - "Stripe webhook signatures — https://stripe.com/docs/webhooks#verify-official-libraries"
  - "GitHub webhooks documentation — https://docs.github.com/en/webhooks"
  - "OWASP Webhook Security guidance"
  - "IETF RFC 8292 VAPID — https://datatracker.ietf.org/doc/html/rfc8292"
  - "CVE-2024-27564 SSRF in third-party pictureproxy.php — https://nvd.nist.gov/vuln/detail/CVE-2024-27564 (2024-03, illustrates why webhook/proxy endpoints require strict egress filtering and URL allowlists)"
triggers_strong: ["webhook signature", "replay protection", "stripe signature", "timing safe compare"]
triggers_weak: ["webhooks", "callback security"]
related: ["api-security", "applied-cryptography"]
---

# Webhook Security

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: High | Audit Level: 2-3 | Automation: Partial

How to receive (and send) webhooks safely. Covers HMAC signature verification with timing-safe comparison, replay protection, idempotency, retries, IP allowlists, and secret rotation.

The default mistake: trusting any HTTPS POST that arrives at `/webhook`. Without a signature an attacker can call your endpoint directly and trigger arbitrary state changes.

---

## 1. HMAC signature verification

Every webhook receiver must verify a signature before acting on the payload.

### Node.js (Express)

```js
import crypto from 'node:crypto';

// IMPORTANT: use express.raw, not express.json - we need the exact bytes
app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.header('Stripe-Signature') || '';
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(req.body) // raw Buffer
      .digest('hex');

    // Timing-safe comparison - never use ===
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length ||
        !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(401).end();
    }

    // ... safe to parse and act on req.body
    res.status(200).end();
  });
```

### Python (FastAPI)

```python
import hmac, hashlib
from fastapi import FastAPI, Header, HTTPException, Request

app = FastAPI()

@app.post("/webhooks/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(...),
):
    secret = os.environ["GITHUB_WEBHOOK_SECRET"].encode()
    body = await request.body()  # raw bytes, NOT request.json()

    expected = "sha256=" + hmac.new(secret, body, hashlib.sha256).hexdigest()

    # Timing-safe comparison
    if not hmac.compare_digest(expected, x_hub_signature_256):
        raise HTTPException(status_code=401)

    # ... process payload
    return {"ok": True}
```

### Go

```go
func verify(body []byte, signature, secret string) bool {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(body)
    expected := hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(expected), []byte(signature))
}
```

### Why timing-safe matters (CWE-208)

A naive `==` comparison returns as soon as it finds a mismatched byte. An attacker measures the response time to discover the signature byte by byte. `crypto.timingSafeEqual` / `hmac.compare_digest` / `hmac.Equal` always compare every byte regardless of mismatches.

---

## 2. Replay protection (CWE-294)

A valid signed request can be replayed forever unless you bind it to a timestamp.

### Pattern: timestamp + signed envelope

```
StripeSignature: t=1717248000,v1=<hmac_of("t=1717248000.<body>")>
```

```js
// Stripe-style verification with replay window
function verifyWithTimestamp(body, header, secret, toleranceSec = 300) {
  const parts = Object.fromEntries(
    header.split(',').map(kv => kv.split('=', 2))
  );
  const timestamp = parseInt(parts.t, 10);
  const signature = parts.v1;

  // Reject if outside ±5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSec) {
    throw new Error('Stale webhook (replay?)');
  }

  const signedPayload = `${timestamp}.${body.toString()}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex'),
  );
}
```

### Pattern: nonce + seen-cache

For higher value events (payments, account changes), also reject any `event_id` your system has already processed in the last N hours. Store seen IDs in Redis with a TTL slightly larger than your replay window.

```js
const seen = await redis.set(`webhook:${event.id}`, '1',
                             'EX', 3600, 'NX');
if (seen === null) {
  return res.status(200).end(); // already processed - idempotent ack
}
```

---

## 3. Idempotency

Webhook providers retry on any non-2xx response. Your handler **will** be called more than once for the same event. Make the side effect idempotent.

### Strategies

| Strategy | When to use |
|----------|-------------|
| Check-then-write with a unique key on `event_id` | Most cases. Insert into `processed_webhooks(id PRIMARY KEY)` first, fail closed on duplicate. |
| State machine | Transitions like `pending -> paid` are naturally idempotent. |
| Upsert | When the event represents desired state, not a delta. |
| Outbox + dedup | When the side effect is a downstream message. |

### Anti-pattern

```js
// BAD - increments balance every retry
await db.exec("UPDATE account SET balance = balance + ? WHERE id = ?",
              [amount, accountId]);
```

```js
// GOOD - INSERT first, abort on duplicate
try {
  await db.exec("INSERT INTO processed(event_id) VALUES(?)", [event.id]);
} catch (e) {
  if (e.code === 'SQLITE_CONSTRAINT') return; // already processed
  throw e;
}
await db.exec("UPDATE account SET balance = balance + ? WHERE id = ?",
              [amount, accountId]);
```

---

## 4. Retry handling

| Status returned | Provider behavior (typical) |
|-----------------|-----------------------------|
| 2xx             | Accepted, no retry           |
| 4xx (except 429) | Permanent fail, no retry, alert dev |
| 429             | Retry with backoff           |
| 5xx             | Retry with backoff           |
| Timeout         | Retry with backoff           |

Rules:

- Acknowledge fast (under 5 seconds) - return 200 then process async via a queue. Long handlers cause timeout-induced retries, doubling load.
- Use exponential backoff with jitter on your side too if you call back into the provider.
- Cap the number of retries for downstream effects so a poison message does not loop forever - send to a DLQ after N attempts and alert.

---

## 5. IP allowlist limitations

Provider IP allowlists (Stripe, GitHub, Slack) feel reassuring but are **not a replacement** for HMAC verification:

- Cloud providers reuse IP space - you might allow more than just the provider.
- The provider can change IPs without notice, breaking your integration silently.
- An attacker on the same shared infra can spoof requests through the allowlisted egress.

Treat IP allowlists as defense-in-depth, never the primary control. The signature is the primary control.

---

## 6. Secret rotation

Rotate webhook secrets at least annually, and immediately when:

- An employee with access leaves.
- A secret may have been logged or committed.
- A provider notifies you of a breach.

### Zero-downtime rotation pattern

Most providers (Stripe, Slack, GitHub Apps) let you have **two active secrets** during rotation. Implementation:

```js
const secrets = [
  process.env.WEBHOOK_SECRET_CURRENT,
  process.env.WEBHOOK_SECRET_PREVIOUS,
].filter(Boolean);

const valid = secrets.some(s => verify(body, signature, s));
if (!valid) return res.status(401).end();
```

After 24-48 hours, drop the old secret from the env. Log every verification path so you can confirm the old key is no longer in use before removing it.

---

## 7. Sending webhooks (outbound)

If you are the producer, give your subscribers what you would want to receive.

Checklist:

- [ ] Sign every payload with HMAC-SHA256 (or stronger).
- [ ] Include a high-resolution timestamp in the signed envelope.
- [ ] Include a unique `event_id` for idempotency.
- [ ] Use a stable `User-Agent` so receivers can allowlist you.
- [ ] Document the signature algorithm and example verification code per language.
- [ ] Provide a retry policy doc (max attempts, backoff curve).
- [ ] Provide a UI for the subscriber to rotate their secret without downtime (two active secrets).
- [ ] Send from a dedicated outbound IP range and publish it.
- [ ] Send a test event button so subscribers can verify wiring.
- [ ] Do not put PII or secrets in webhook bodies if you can send a reference and let the subscriber pull.

---

## 8. SSRF risk for webhook *receivers*

Some apps let users register a URL we will POST to (Zapier, n8n, custom webhooks). That endpoint becomes an SSRF vector:

- Block private IP ranges (`10/8`, `172.16/12`, `192.168/16`, `127/8`, `169.254/16`, `::1`, `fc00::/7`).
- Block AWS IMDS (`169.254.169.254`) and equivalent on GCP/Azure.
- Resolve DNS yourself and pin to the resolved IP to defeat DNS rebinding.
- Disallow `file://`, `gopher://`, etc. - HTTPS only.
- Set short timeouts and a small max response size.
- Run outbound webhook delivery from a dedicated subnet with no access to internal services.

See `mcp-security.md` SSRF section and `api-security.md` for code examples.

---

## 9. Testing

Add these to your security test suite (see `security-testing-examples.md`):

- Reject request with no signature header -> 401.
- Reject request with wrong signature -> 401.
- Reject request with valid signature but stale timestamp -> 401.
- Reject duplicate event_id within replay window -> 200 with no side effect.
- Accept valid signed request -> 200, side effect happens exactly once.
- Stress test idempotency by replaying the same event 100x in parallel.

---

## CWE references

- CWE-208: Observable Timing Discrepancy (timing attack)
- CWE-294: Authentication Bypass by Capture-Replay
- CWE-345: Insufficient Verification of Data Authenticity
- CWE-918: SSRF (for outbound webhooks)
- CWE-942: Permissive Cross-domain Policy with Untrusted Domains

