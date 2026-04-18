---
title: "Security Myths & Misconceptions"
slug: security-myths
category: appsec
depth: 1
audit_level: [1, 2]
last_reviewed: 2026-04-19
sources:
  - "OWASP Cheat Sheet Series"
  - "OWASP API Security Top 10 2023"
  - "NIST SP 800-63B"
  - "OAuth 2.0 Security Best Current Practice"
  - "CISA Secure by Design"
triggers_strong: ["security myths", "jwt is security", "cors protects api", "waf is enough"]
triggers_weak: ["security misconceptions", "myth busting"]
related: ["quick-start-ai-coding", "vibecoder-traps", "api-security", "ai-tool-profiles"]
---

# Security Myths & Misconceptions

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 1-2 | Automation: Low (linting and policy checks may detect some bad patterns; the misconception itself is usually human and process-driven)

Use this file when a design sounds secure because it uses a familiar buzzword, product, or acronym, but you need to test whether the underlying control actually exists.

A recurring security failure is not missing technology. It is **confusing a component with a guarantee**.

---

## 1. "We have a WAF, so we're covered"

**Why it's wrong:**
A WAF is a filtering and visibility layer, not a replacement for secure application design. It will not fix:

- IDOR / BOLA,
- broken authorization,
- mass assignment,
- insecure workflow logic,
- internal misuse,
- over-privileged CI/CD or admin paths.

**What to do instead:**
Use the WAF as a supporting control. Keep secure code review, validation, authz checks, and rate limiting in the application itself.

---

## 2. "We hash passwords with SHA-256, so they're safe"

**Why it's wrong:**
SHA-256 is intentionally fast. Fast password hashing helps attackers, not defenders.

**What to do instead:**
Use a password hashing function designed for password storage:

- `Argon2id` preferred,
- `bcrypt` with a modern cost,
- `scrypt` where appropriate.

Also salt automatically, tune cost over time, and protect password-reset flows just as carefully as password storage.

---

## 3. "JWT = security"

**Why it's wrong:**
A JWT is only a token format. It does not prove:

- the user is authorized for this object,
- the token claims were validated correctly,
- the token is stored safely,
- the issuer and audience are trustworthy,
- the lifetime is appropriate.

**What to do instead:**
Treat JWT as one building block. Verify signature, `exp`, `aud`, `iss`, and relevant claims. Keep object-level authorization server-side. Prefer `HttpOnly` cookies or equally deliberate storage decisions.

---

## 4. "CORS protects our API"

**Why it's wrong:**
CORS is a browser behavior. Attackers using curl, mobile apps, backend code, or compromised clients are outside that model.

**What to do instead:**
Authenticate and authorize every sensitive action regardless of origin. Use CORS to control browser interaction, not as access control.

---

## 5. "Our secrets are safe in a .env file"

**Why it's wrong:**
`.env` files routinely leak through:

- accidental commits,
- debug endpoints,
- container images,
- support bundles,
- shell history,
- local AI tooling or editor plugins that ingest workspace files.

**What to do instead:**
Use a secrets manager or ephemeral identity where possible. Keep `.env` out of Git, images, and shared archives. Scan commits and history for secrets.

---

## 6. "HTTPS is enough; we don't need HSTS, CSP, or hardened cookies"

**Why it's wrong:**
HTTPS protects transport confidentiality, not all browser abuse. Without layered controls you still risk:

- SSL stripping without HSTS,
- cookie theft or misuse without `Secure`, `HttpOnly`, and `SameSite`,
- clickjacking without frame protections,
- script-origin abuse without CSP where applicable.

**What to do instead:**
Treat HTTPS as the floor. Add browser and session controls appropriate to the application.

---

## 7. "We don't need rate limiting; nobody would brute-force us"

**Why it's wrong:**
Most credential attacks are opportunistic and automated. They do not require a motivated, bespoke attacker.

**What to do instead:**
Rate-limit login, signup, password reset, MFA verification, search, upload, and export flows. Add monitoring for credential stuffing and abuse of business-critical actions.

---

## 8. "Security through obscurity works because the endpoint isn't linked anywhere"

**Why it's wrong:**
Attackers discover routes through JavaScript bundles, source maps, browser history, crawlers, archived URLs, leaked logs, or predictable naming.

**What to do instead:**
Assume every route can be found. Protect it explicitly with authentication, authorization, and abuse controls.

---

## 9. "We use OAuth, so authentication is secure"

**Why it's wrong:**
OAuth is an authorization framework. Authentication requires the right OIDC controls and implementation details.

Common failures:

- missing `state` validation,
- weak redirect URI rules,
- missing `nonce` where needed,
- audience confusion,
- confusing an access token with proof of identity.

**What to do instead:**
Use a hardened library. Validate `state`, `nonce`, `iss`, `aud`, and expiry. Prefer OIDC for authentication and PKCE for public clients.

---

## 10. "Our Docker container is isolated, so RCE doesn't matter"

**Why it's wrong:**
Container compromise still matters because containers may expose:

- sensitive environment variables,
- cloud credentials,
- internal networks,
- service-to-service trust,
- mounted volumes,
- orchestration APIs.

**What to do instead:**
Run as non-root where possible, reduce Linux capabilities, avoid privileged mode, protect the container runtime, and scope network and secret access tightly.

---

## 11. "We review code before merging, so we catch security issues"

**Why it's wrong:**
General code review often focuses on correctness and style, not exploitability or trust-boundary regressions.

**What to do instead:**
Use explicit security review heuristics, automation, and stack-specific testing. Review diffs for access-control, data-exposure, and execution-path changes first.

---

## 12. "MFA means phishing-resistant authentication"

**Why it's wrong:**
All MFA is not equal. OTP by SMS or app can still be phished, relayed, or fatigue-attacked.

**What to do instead:**
Prefer phishing-resistant methods such as passkeys / WebAuthn or hardware-backed FIDO2 for privileged users. Treat weaker MFA as better than password-only, not as the end state.

---

## 13. "Private repo means secrets are safe"

**Why it's wrong:**
A private repo can still leak through:

- over-broad collaborator access,
- CI logs and artifacts,
- forks and mirrors,
- local clones on unmanaged devices,
- copied snippets into tickets or chat,
- AI coding tools that can read the workspace.

**What to do instead:**
Assume repository contents can spread. Do not store long-lived secrets in Git. Use secret scanning, branch protections, and short-lived credentials.

---

## 14. "Read-only AI tools are harmless"

**Why it's wrong:**
A read-only AI assistant can still cause damage by:

- exfiltrating sensitive content through prompts or outputs,
- reading secrets from config files or logs,
- generating unsafe remediation steps,
- widening access if it sees privileged browser sessions or internal knowledge bases.

**What to do instead:**
Apply least privilege, approved tool profiles, prompt minimization, and separate browser/workspace trust zones. Read-only is safer than write access, not risk-free.

---

## 15. "If it passed the scanner, it's secure"

**Why it's wrong:**
Scanners are excellent for known patterns and hygiene gaps. They are weaker against business-logic flaws, tenant-boundary mistakes, bad rollout decisions, and unsafe exceptions.

**What to do instead:**
Use scanners as the first pass, not the only pass. Pair them with design review, threat modeling, and focused manual checks on high-risk changes.

---

## 16. Quick reference

| Claim | Reality check |
|---|---|
| "We have a WAF" | Ask whether authz, validation, and object scoping still live in code |
| "Password is hashed" | Ask with what algorithm and cost |
| "We use JWT" | Ask whether claims are verified and authz is separate |
| "CORS is configured" | Ask what protects non-browser callers |
| "Secrets are in .env" | Ask where else that file can leak |
| "We use HTTPS" | Ask about cookies, HSTS, CSP, and framing |
| "The route is hidden" | Ask what enforces access if the route is discovered |
| "We use OAuth" | Ask whether OIDC, PKCE, state, and audience validation are present |
| "It's in a container" | Ask what the container can still reach |
| "AI tool is read-only" | Ask what data it can read and where outputs go |

---

## 17. Design rule to remember

Whenever a statement sounds like **tool = security**, translate it into:

1. what threat is supposedly mitigated,
2. what trust boundary still remains,
3. what verification proves the control really works.

If nobody can answer those three questions, the control is mostly a myth.
