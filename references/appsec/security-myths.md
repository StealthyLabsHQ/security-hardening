---
title: "Security Myths & Misconceptions"
slug: security-myths
category: appsec
depth: 1
audit_level: [1, 2]
last_reviewed: null
sources:
  - "OWASP Cheat Sheet Series"
  - "NIST SP 800-63B"
triggers_strong: ["security myths", "jwt is security", "cors protects api", "waf is enough"]
triggers_weak: ["security misconceptions", "myth busting"]
related: ["quick-start-ai-coding", "vibecoder-traps"]
---

# Security Myths & Misconceptions

Common beliefs that feel secure but are not. Each myth includes why it is wrong and what to do instead.

> Review frequency: **Annual** - these misconceptions are stable but new ones emerge with new technologies.

---

## "We have a WAF, so we're covered"

**Why it's wrong:** A WAF is a detection and filtering layer, not a replacement for secure code. WAFs can be bypassed (encoding tricks, novel payloads, logic flaws). They do not protect against IDOR, broken authentication, business logic flaws, or insider threats. A WAF with insecure code behind it is a speed bump, not a wall.

**What to do instead:** Fix vulnerabilities in code (SAST, code review). Use the WAF as an additional layer, not the primary control.

---

## "We hash passwords with SHA-256, so they're safe"

**Why it's wrong:** SHA-256 is a general-purpose hash designed to be fast. A modern GPU can compute 10+ billion SHA-256 hashes per second, making offline brute-force attacks trivial. Rainbow tables exist for common passwords.

**What to do instead:** Use a slow, purpose-built password hashing function: **Argon2id** (NIST recommended), **bcrypt** (cost factor >= 12), or **scrypt**.

```python
# Safe
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)
hashed = ph.hash(password)
```

---

## "JWT = security"

**Why it's wrong:** JWT is a token format, not a security guarantee. Common JWT mistakes:
- Using `alg: none` (signature skipped)
- Using `jwt.decode()` instead of `jwt.verify()`
- Not checking `exp`, `aud`, or `iss` claims
- Symmetric keys shared across services
- Storing JWTs in localStorage (XSS-accessible)

A JWT proves the token was signed. It does not prove the user is authorized to perform the action they are attempting.

**What to do instead:** Use RS256 (asymmetric), verify all claims, store in `HttpOnly` cookies, keep lifetime short (15 min).

---

## "CORS protects our API"

**Why it's wrong:** CORS is a browser-side policy. It does not protect against:
- Server-to-server requests (curl, Postman, backend services)
- Mobile apps or native clients
- Browsers with CORS disabled or bypassed
- Any non-browser attacker

CORS only controls which browser origins can make credentialed cross-origin requests.

**What to do instead:** Enforce authentication and authorization on every API endpoint regardless of origin. CORS is a usability control, not an access control.

---

## "Our secrets are safe in a .env file"

**Why it's wrong:** `.env` files are frequently:
- Accidentally committed to Git (check your `.gitignore`)
- Exposed via misconfigured web servers (`GET /.env` returns 200 on many deployments)
- Readable by any process running on the same server
- Included in Docker images, build artifacts, or logs

**What to do instead:** Use a secrets manager (HashiCorp Vault, AWS Secrets Manager, Doppler). At minimum, verify `.env` is in `.gitignore` and scan history with Gitleaks. Never include `.env` in Docker images.

---

## "HTTPS is enough - we don't need HSTS, CSP, or hardened cookies"

**Why it's wrong:** HTTPS encrypts the transport layer. It does not prevent:
- SSL stripping attacks (without HSTS)
- XSS injecting scripts from other origins (without CSP)
- Session cookie theft via JavaScript (without `HttpOnly`)
- Session cookies sent over HTTP (without `Secure` flag)
- Clickjacking (without `X-Frame-Options` or CSP `frame-ancestors`)

**What to do instead:** HTTPS is the baseline. Layer on HSTS, CSP, `HttpOnly`+`Secure`+`SameSite` cookies, `X-Content-Type-Options`, and `X-Frame-Options`. See `references/appsec/secure-headers.md`.

---

## "We don't need rate limiting - nobody would brute-force us"

**Why it's wrong:** Credential stuffing attacks use automated tools with millions of leaked username/password pairs. Attackers do not target companies specifically - they scan the entire internet. An unprotected login endpoint will be attacked.

**What to do instead:** Rate limit login, password reset, OTP, and account creation endpoints. Add lockout after N failures. Use CAPTCHA for high-risk flows.

---

## "Security through obscurity - the endpoint isn't linked anywhere"

**Why it's wrong:** Unlisted endpoints are discovered by:
- Web crawlers and search engines
- Directory brute-forcing tools (ffuf, dirbuster)
- JavaScript bundle analysis
- Historical data (Wayback Machine, Certificate Transparency logs)
- Error messages that reveal paths

**What to do instead:** Every endpoint must enforce authentication and authorization explicitly. There is no safe "hidden" route.

---

## "We use OAuth, so authentication is secure"

**Why it's wrong:** OAuth 2.0 defines an authorization framework, not an authentication protocol. Common OAuth implementation mistakes:
- Not validating the `state` parameter (CSRF on the OAuth flow)
- Accepting `access_token` in URL query parameters (logged in server/proxy logs)
- Not verifying the `aud` claim in the ID token
- Redirect URI wildcards (`redirect_uri=https://app.com/*`)
- Mixing up authentication (OIDC) and authorization (OAuth2)

**What to do instead:** Use a battle-tested library. Validate `state`, `nonce`, `aud`, `iss`, and `exp`. Use PKCE for public clients. Prefer OIDC for authentication.

---

## "Our Docker container is isolated, so RCE doesn't matter"

**Why it's wrong:** Default Docker containers share the host kernel. A container breakout (kernel exploit, misconfigured mount, privileged mode) gives full host access. Common misconfigurations:
- `--privileged` flag
- Mounting `/` or `/etc` from the host
- Running as root inside the container
- Exposed Docker socket (`/var/run/docker.sock`)

**What to do instead:** Run as a non-root user, use read-only mounts, avoid `--privileged`, never mount the Docker socket into containers, use seccomp and AppArmor profiles.

---

## "We review code before merging, so we catch security issues"

**Why it's wrong:** Code reviewers focus on correctness and logic, not security. Security vulnerabilities are often subtle and require specific expertise to spot (second-order SQL injection, race conditions, JWT claim bypasses). Without explicit security checklists and SAST tools, most reviewers miss security issues.

**What to do instead:** Use automated SAST (Semgrep, Bandit) as a first pass. Add a mandatory security checklist to PR templates. Train reviewers on the top vulnerability patterns for your stack.

---

## Quick Reference - "Is This Secure?" Red Flags

| Claim | Reality |
|-------|---------|
| "We have a WAF" | Not a replacement for secure code |
| "Password is hashed" | Ask: with what? Argon2/bcrypt or MD5/SHA? |
| "We use JWT" | Ask: RS256? Claims verified? HttpOnly cookie? |
| "CORS is configured" | Does not protect server-to-server or non-browser clients |
| "Secrets are in .env" | Is it in .gitignore? In the Docker image? In logs? |
| "We use HTTPS" | Are cookies hardened? HSTS enabled? CSP deployed? |
| "The route is not linked" | Security through obscurity is not security |
| "We use OAuth" | state/PKCE/aud validated? OIDC for auth, not raw OAuth? |
| "Container is isolated" | Running as root? Docker socket mounted? Privileged? |


