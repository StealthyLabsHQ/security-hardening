# Privacy and Data Minimization

> Last reviewed: 2026-04-03 | Next review: 2026-10-03 | Priority: Recommended | Audit Level: 2-3 | Automation: Partial (log scanning for PII patterns; retention and masking policy manual)

Privacy by design means collecting only what you need, storing it only as long as necessary, and never accidentally leaking it through logs, errors, exports, or analytics. Aligned with GDPR Article 5 (data minimization, purpose limitation, storage limitation).

---

## 1. PII in Logs - the Most Common Leak

Application logs are often forwarded to centralized platforms (Datadog, Splunk, ELK) with broad access, retained for years, and excluded from GDPR deletion requests. A single log line can expose thousands of users.

**What counts as PII in logs:**

| Category | Examples |
|----------|----------|
| Direct identifiers | Full name, email, phone, national ID, passport |
| Quasi-identifiers | IP address, user ID, device ID, session ID |
| Sensitive categories | Health data, financial data, location, race, religion |
| Credentials | Passwords, tokens, API keys, session cookies |
| Behavioral | Search queries, purchase history, browsing path |

**Vulnerable patterns:**

```python
# Logs the full request body - may contain passwords, card numbers, PII
logger.info(f"Received request: {request.body}")

# Logs the full user object
logger.debug(f"User authenticated: {user}")

# Logs exception with full context including PII
logger.exception(f"Payment failed for {payment_data}")
```

**Safe patterns - log only what you need for debugging:**

```python
import logging
import re

# Log only non-sensitive fields
logger.info("User authenticated", extra={
    "user_id": user.id,          # internal ID - ok
    "event": "login_success",
    "ip_hash": hash_ip(request.remote_addr),  # hashed - ok
    # never: email, name, password, token
})

# Mask sensitive fields before logging
def mask_card(number: str) -> str:
    return f"****-****-****-{number[-4:]}"

def mask_email(email: str) -> str:
    local, domain = email.split("@")
    return f"{local[0]}***@{domain}"

logger.info("Payment processed", extra={
    "card": mask_card(card_number),
    "email": mask_email(user.email),
    "amount": amount,
})
```

**Structured log field redaction:**

```javascript
// Pino (Node.js) - redact sensitive fields at the logger level
const pino = require('pino');

const logger = pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.creditCard',
      'body.ssn',
      'user.email',
      'user.phone',
      '*.token',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
});
```

```go
// Zap (Go) - custom field masking
import "go.uber.org/zap"

func safeUserFields(u User) []zap.Field {
    return []zap.Field{
        zap.String("user_id", u.ID),
        zap.String("email_domain", emailDomain(u.Email)), // only domain, not full email
        // never: u.Email, u.Phone, u.Name
    }
}

logger.Info("user action", safeUserFields(user)...)
```

**Automated detection - scan logs for PII patterns:**

```bash
# Scan log files for common PII patterns
grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" app.log  # emails
grep -E "\b[0-9]{16}\b" app.log                                      # card numbers
grep -E "\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b" app.log                    # US SSN
grep -iE "password|passwd|secret|token|api_key" app.log              # credentials

# Use a dedicated tool
pip install detect-secrets
detect-secrets scan app.log
```

---

## 2. Data Retention

Storing data indefinitely is a GDPR violation and increases breach impact. Define retention periods per data category and enforce them.

**Retention policy template:**

| Data Type | Retention | Legal Basis | Deletion Method |
|-----------|-----------|-------------|-----------------|
| User account data | Duration of account + 30 days | Contract | Hard delete + anonymize foreign keys |
| Transaction records | 7 years | Legal obligation (tax) | Archive, then delete |
| Application logs | 90 days | Legitimate interest | Log rotation + deletion |
| Security/audit logs | 1-3 years | Legal/security | Immutable storage, then delete |
| Session tokens | Until expiry | Contract | Automatic TTL expiry |
| Email communications | 2 years | Legitimate interest | Scheduled deletion job |
| Analytics/tracking | 13 months | Consent | Aggregated retention only |
| Support tickets | 3 years post-close | Legitimate interest | Anonymize user fields |
| Backup snapshots | 30-90 days | Contract | Automated snapshot rotation |

**Implement retention with scheduled jobs:**

```python
# Django example - scheduled deletion job
from datetime import timedelta
from django.utils import timezone

def purge_expired_data():
    cutoff_logs = timezone.now() - timedelta(days=90)
    cutoff_sessions = timezone.now() - timedelta(days=30)
    cutoff_deleted_users = timezone.now() - timedelta(days=30)

    # Purge old logs
    ApplicationLog.objects.filter(created_at__lt=cutoff_logs).delete()

    # Purge expired sessions
    Session.objects.filter(expire_date__lt=cutoff_sessions).delete()

    # Hard delete soft-deleted user accounts
    User.objects.filter(
        deleted_at__lt=cutoff_deleted_users,
        is_deleted=True
    ).delete()
```

```sql
-- PostgreSQL - schedule via pg_cron or external scheduler
-- Delete logs older than 90 days
DELETE FROM application_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Anonymize old orders (keep for tax, remove PII)
UPDATE orders
SET
    customer_email = 'anonymized@deleted.invalid',
    customer_name = 'Deleted User',
    shipping_address = NULL
WHERE
    created_at < NOW() - INTERVAL '7 years'
    AND anonymized_at IS NULL;
```

---

## 3. Right to Erasure (GDPR Article 17)

When a user requests deletion, you must delete or anonymize their data across all systems.

**Erasure checklist per system:**

| System | Action |
|--------|--------|
| Primary database | Hard delete or anonymize |
| Read replicas | Replicated automatically (verify lag) |
| Backups | Document that backups contain data until rotated; note in privacy policy |
| Search indexes (Elasticsearch) | Delete by user ID |
| Cache (Redis) | Flush user-specific keys |
| CDN / object storage | Delete uploaded files |
| Email service | Unsubscribe + delete contact |
| Analytics (Mixpanel, Amplitude) | Delete user via API |
| Logs | Cannot retroactively delete (explain in privacy policy); ensure no PII in future logs |
| Third-party processors | Notify each processor per DPA |

**Implementation pattern - erasure service:**

```python
class UserErasureService:
    def erase_user(self, user_id: str, requested_by: str):
        user = User.objects.get(id=user_id)

        # 1. Anonymize the user record (do not hard delete if foreign keys exist)
        user.email = f"deleted_{user_id}@erased.invalid"
        user.name = "Deleted User"
        user.phone = None
        user.address = None
        user.erased_at = timezone.now()
        user.erased_by_request = True
        user.save()

        # 2. Delete user content
        UserPost.objects.filter(user_id=user_id).delete()
        UserFile.objects.filter(user_id=user_id).delete()
        self._delete_s3_files(user_id)

        # 3. Revoke all sessions and tokens
        Session.objects.filter(user_id=user_id).delete()
        APIKey.objects.filter(user_id=user_id).delete()

        # 4. Remove from external services
        self._remove_from_email_service(user.email)
        self._remove_from_analytics(user_id)

        # 5. Audit log (keep the fact of deletion, not the PII)
        AuditLog.objects.create(
            event="user_erased",
            user_id=user_id,    # keep ID for referential integrity
            requested_by=requested_by,
            timestamp=timezone.now(),
        )
```

---

## 4. Sensitive Data in Error Messages and Stack Traces

Stack traces and debug output often expose PII embedded in function arguments or local variables.

```python
# Vulnerable - stack trace includes user data
def process_payment(user_email, card_number, amount):
    result = payment_gateway.charge(card_number, amount)
    # If this raises, the stack trace shows card_number in locals

# Safe - separate PII from processing
def process_payment(user_id, card_token, amount):
    # card_token is a reference, not the actual card number
    result = payment_gateway.charge(card_token, amount)
    # Stack trace shows only card_token (useless to attacker)
```

**Filter sensitive locals from exception reporting (Sentry):**

```python
# sentry_sdk configuration - scrub PII from events
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="...",
    send_default_pii=False,  # CRITICAL: never send PII to Sentry
    before_send=scrub_sensitive_data,
)

def scrub_sensitive_data(event, hint):
    # Remove request body from error events
    if "request" in event:
        event["request"].pop("data", None)
        event["request"]["headers"].pop("Authorization", None)
        event["request"]["headers"].pop("Cookie", None)
    return event
```

---

## 5. PII in Support Dumps, Exports, and Backups

**Support / debug dumps:**

```python
# Vulnerable - support dump includes full user data
def generate_support_dump(user_id):
    return {
        "user": User.objects.get(id=user_id).__dict__,  # includes everything
        "orders": list(Order.objects.filter(user_id=user_id).values()),
    }

# Safe - include only what support needs
def generate_support_dump(user_id):
    user = User.objects.get(id=user_id)
    return {
        "user_id": user.id,
        "account_created": user.created_at,
        "subscription_status": user.subscription_status,
        "recent_order_ids": list(
            Order.objects.filter(user_id=user_id)
            .order_by("-created_at")[:10]
            .values_list("id", flat=True)
        ),
        # No: email, name, address, payment info
    }
```

**Database backups - encrypt and restrict access:**

```bash
# Encrypt backup before storing
pg_dump mydb | gzip | \
  openssl enc -aes-256-gcm -pbkdf2 -k "$BACKUP_ENCRYPTION_KEY" \
  > backup_$(date +%Y%m%d).sql.gz.enc

# Never store unencrypted PII backups in S3 with public access
# Apply bucket policy: block public access + require SSE-S3 or SSE-KMS
```

---

## 6. Analytics and Tracking

Analytics platforms often receive more PII than necessary.

```javascript
// Vulnerable - sends PII to analytics
analytics.track('purchase', {
    userId: user.id,
    email: user.email,          // PII - not needed
    phone: user.phone,          // PII - not needed
    amount: order.total,
    product: order.product_name,
});

// Safe - send only what analytics needs
analytics.track('purchase', {
    userId: user.id,            // pseudonymous ID is fine
    amount: order.total,
    product_category: order.category,  // aggregate, not specific
    // no email, no phone, no name
});
```

**Cookie consent and analytics:**

```javascript
// Only initialize analytics after consent
if (userConsent.analytics === true) {
    analytics.initialize(ANALYTICS_KEY);
} else {
    // No tracking without consent
    analytics.disable();
}
```

---

## 7. Screenshots and Screen Recording (Support Tools)

Tools like Intercom, FullStory, Hotjar, or LogRocket record user sessions and may capture PII on screen.

**Mask sensitive fields in session recording:**

```html
<!-- FullStory / LogRocket - mark sensitive elements -->
<input type="text" name="ssn" data-private="true" />
<div class="payment-card" data-recording-ignore="true">
  {{ card_number }}
</div>

<!-- LogRocket - programmatic masking -->
<script>
LogRocket.init('app/id', {
  dom: {
    inputSanitizer: true,          // mask all input values
    textSanitizer: true,           // mask text nodes
    privateAttributeBlocklist: ['data-sensitive'],
  },
});
</script>
```

---

## 8. Data Minimization Checklist

| Check | Expected |
|-------|----------|
| Logs contain no email, name, phone, or payment data | Yes |
| Structured logger redacts sensitive fields at config level | Yes |
| Retention periods defined per data category | Yes |
| Automated deletion/anonymization jobs scheduled | Yes |
| Right to erasure procedure documented and tested | Yes |
| Error tracking (Sentry) configured with `send_default_pii=False` | Yes |
| Database backups encrypted at rest | Yes |
| Analytics receives only pseudonymous IDs, no email/phone | Yes |
| Session recording tools configured to mask PII fields | Yes |
| Support dumps scoped to non-PII operational fields | Yes |
| GDPR processing register maintained (Article 30) | Yes |
| Third-party processors covered by Data Processing Agreements | Yes |

---

## Resources

- GDPR Article 5 - Principles relating to processing of personal data
- OWASP Top 10 Privacy Risks
- NIST Privacy Framework
- ICO - Guide to data minimisation
- CNIL - GDPR developer guide (English version available)
