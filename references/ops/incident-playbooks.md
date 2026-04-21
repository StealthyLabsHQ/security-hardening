---
title: "Incident Playbooks"
slug: incident-playbooks
category: ops
depth: 2
audit_level: [3, 4]
last_reviewed: 2026-04-21
sources:
  - "NIST SP 800-61 Rev. 2 — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf"
  - "CISA incident response guidance — https://www.cisa.gov/topics/cybersecurity-best-practices/cyber-threats-and-advisories"
  - "Verizon DBIR (annual) — https://www.verizon.com/business/resources/reports/dbir/"
  - "Mandiant M-Trends (annual) — https://www.mandiant.com/m-trends"
triggers_strong: ["incident playbook", "compromised account", "jwt secret leak", "bucket exposure"]
triggers_weak: ["incident response", "recovery"]
related: ["ai-agent-incident-response", "secret-leak-prevention"]
---

# Incident Playbooks

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Recommended | Audit Level: 3-4 | Automation: None (these are human-executed response procedures)

Structured response procedures for the most common security incidents. Each playbook follows the same format: Detect, Contain, Investigate, Remediate, Review.

For secret leaks specifically, see `references/ops/secret-leak-prevention.md`.

---

## How to Use

1. **Detect**: confirm the incident is real, not a false alarm.
2. **Contain**: stop the bleeding immediately, even before you understand the full scope.
3. **Investigate**: understand what happened, what was accessed, and for how long.
4. **Remediate**: fix the root cause, not just the symptom.
5. **Review**: postmortem - what failed, what worked, what changes prevent recurrence.

---

## Playbook 1: Compromised User Account

**Indicators:** login from unexpected country or IP, unusual activity in audit logs, user reports they cannot log in, 2FA code used before the user attempted login.

### Detect

```bash
# Check recent login events for the account
SELECT event, ip, user_agent, created_at
FROM auth_events
WHERE user_id = ? AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

# Look for concurrent sessions from different IPs
SELECT ip, COUNT(*) as count FROM sessions
WHERE user_id = ? AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip HAVING count > 1;
```

### Contain

1. Invalidate all active sessions for the account immediately.
2. Lock the account (prevent further logins).
3. If the account had admin privileges: audit all actions taken in the last 24-48 hours.
4. If the account could access other accounts' data: assume those accounts are also at risk.

```python
# Invalidate all sessions
Session.query.filter_by(user_id=compromised_user_id).delete()
db.session.commit()

# Lock account
user.is_locked = True
user.locked_at = datetime.utcnow()
user.locked_reason = "Security incident - unauthorized access detected"
db.session.commit()
```

### Investigate

- How did the attacker gain access? (phishing, credential stuffing, session hijacking, compromised device)
- What did they access? (run full audit log query for the account)
- Did they escalate privileges or access other accounts?
- Were any data exports, password resets, or account changes made?

### Remediate

- Force password reset via verified out-of-band channel (email to verified address).
- Require MFA re-enrollment.
- If phishing: report sender to email provider, warn other users if targeted campaign.
- If credential stuffing: notify user to change password on other services.
- Review and tighten rate limiting on login endpoint if not already done.

---

## Playbook 2: Compromised Webhook / Integration Token

**Indicators:** unexpected webhook calls, third-party service reports suspicious activity, token found in Git history or logs.

### Detect

- Review webhook delivery logs for unexpected source IPs or unusual payloads.
- Check the integration platform's audit log (Stripe, GitHub, Slack, etc.) for recent API calls.

### Contain

1. Revoke the compromised token/webhook secret immediately.
2. Generate a new token/secret.
3. Update all systems that use the old token before re-enabling the integration.

| Service | Where to revoke |
|---------|----------------|
| Stripe webhook | dashboard.stripe.com > Developers > Webhooks > Roll signing secret |
| GitHub webhook | Repository > Settings > Webhooks > Regenerate secret |
| Slack app | api.slack.com > Your Apps > OAuth & Permissions > Revoke |
| Generic | Revoke in the integration's dashboard, then update your app's config |

### Investigate

- What events did the attacker receive? (check webhook delivery log)
- Did the attacker use the webhook secret to forge valid requests?
- Was any action taken in your system based on forged webhook events? (check application logs)

### Remediate

- Rotate the webhook secret.
- Verify all incoming webhooks validate the HMAC signature. See `references/appsec/api-security.md`.
- Audit any actions taken in the window between compromise and detection.
- If forged events triggered state changes: review and revert if necessary.

---

## Playbook 3: JWT Signing Secret Compromised

**Indicators:** found in Git history, logs, or error messages; attacker demonstrates the ability to forge tokens.

### Contain

1. Rotate the signing secret/key immediately.
2. Invalidate all existing tokens (this logs out all users - communicate before doing this if possible).
3. If using asymmetric keys (RS256): revoke the private key and issue a new key pair; update the public key in all services that validate tokens.

```python
# Invalidate all tokens by rotating the secret
# All tokens signed with the old secret will fail validation immediately
JWT_SECRET = secrets.token_hex(32)   # new random secret
# Update in secrets manager, redeploy app
```

### Investigate

- Could the attacker have forged tokens and accessed the application?
- Were there any requests with valid-looking tokens from unexpected IPs or at unusual times?
- What actions could a forged admin token have taken?

### Remediate

- Rotate signing secret/key.
- Shorten token lifetime if it was set too long.
- Add JWT ID (`jti`) claim and maintain a short-lived revocation list for critical tokens.
- Audit where the JWT secret was stored - it should be in a secrets manager, not in `.env` or code.

---

## Playbook 4: Cloud Storage Bucket Exposed (S3/GCS/Azure Blob)

**Indicators:** alert from cloud provider, bucket found in a public bucket scanner, external report, log showing unexpected public access.

### Detect

```bash
# AWS
aws s3api get-bucket-acl --bucket my-bucket
aws s3api get-bucket-policy-status --bucket my-bucket

# GCP
gsutil iam get gs://my-bucket | grep allUsers

# Azure
az storage container show-permission --name mycontainer --account-name mystorage
```

### Contain

1. Remove public access immediately.

```bash
# AWS - block all public access
aws s3api put-public-access-block --bucket my-bucket \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# GCP - remove allUsers
gsutil iam ch -d allUsers:objectViewer gs://my-bucket
```

2. If the bucket contained secrets: treat them as compromised. Rotate immediately.

### Investigate

- How long was the bucket public? (check access logs / CloudTrail / Stackdriver)
- What objects were accessed and by whom? (IP addresses, user agents)
- Did the bucket contain PII, credentials, source code, or backups?

### Remediate

- Rotate any credentials found in the bucket.
- Notify affected users if PII was exposed (regulatory requirement in most jurisdictions).
- Enable server-side encryption and access logging on the bucket.
- Audit all other buckets in the same account.

---

## Playbook 5: Verbose Error / Debug Mode in Production

**Indicators:** stack traces in HTTP responses, internal paths visible in errors, database schema visible in error messages, debug endpoint publicly accessible.

### Contain

1. Disable debug mode and redeploy immediately.
2. If the verbose errors revealed database schema, internal paths, or dependency versions: assume attackers have this information and use it to prioritize patching.

```python
# Immediate fix - generic error handler
@app.exception_handler(Exception)
async def generic_error(request, exc):
    error_id = str(uuid.uuid4())
    logger.error(f"[{error_id}] {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"error": "Internal server error", "id": error_id})
```

### Investigate

- How long was debug mode active?
- Were specific vulnerabilities revealed? (e.g., stack trace showing a dependency version with a known CVE)
- Check external vulnerability scanners (Shodan) to see if the endpoint was indexed.

### Remediate

- Add startup check: fail if `DEBUG=True` in a production environment.
- Add integration test that verifies 500 responses do not contain stack traces (see `references/appsec/security-testing-examples.md`).
- Review and patch any vulnerabilities revealed by the leaked information.

---

## Playbook 6: CORS Misconfiguration Discovered

**Indicators:** security researcher reports, browser console shows unexpected CORS headers, `Access-Control-Allow-Origin: *` on authenticated endpoints.

### Assess Severity

| Configuration | Risk level | Action |
|--------------|-----------|--------|
| `*` on public, unauthenticated endpoints | Low | Fix to be explicit, not urgent |
| `*` on authenticated endpoints | High | Fix immediately |
| `*` + `Access-Control-Allow-Credentials: true` | Critical | Fix immediately, audit requests |
| Reflecting arbitrary `Origin` header | High | Fix immediately |

### Contain

1. Replace wildcard with explicit allowlist of trusted origins.
2. Redeploy.

```python
# Safe CORS configuration
ALLOWED_ORIGINS = [
    "https://app.mycompany.com",
    "https://admin.mycompany.com",
]

@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    response = await call_next(request)
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response
```

### Investigate

- Could an attacker have used the misconfiguration to perform cross-origin requests with user credentials?
- Were there any requests from unexpected origins in access logs?

---

## Postmortem Template

Use this for every incident (even minor ones). Keep it short - 1 page maximum.

```markdown
## Incident: [short title]
Date: YYYY-MM-DD
Severity: Critical / High / Medium / Low
Duration: [detection time] to [resolution time]

### What happened
[2-3 sentences: what was the incident, what was affected]

### Timeline
- HH:MM - [event]
- HH:MM - [event]
- HH:MM - [resolution]

### Root cause
[One sentence: why did this happen?]

### What we did well
- [thing that worked]

### What we could improve
- [thing that failed or was slow]

### Action items
| Action | Owner | Due |
|--------|-------|-----|
| [specific change] | [name] | [date] |
```


