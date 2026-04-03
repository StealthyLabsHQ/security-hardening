---
name: security-hardening
description: >
  Audit, review, and harden code, configurations, and infrastructure against security vulnerabilities.
  Use this skill whenever the user asks to: review code for security issues, audit a file or project for vulnerabilities,
  harden a server/app/config, check for OWASP Top 10 issues, prevent XSS/SQL injection/CSRF/SSRF/LFI/RFI/RCE,
  review HTTP headers, check authentication/authorization logic, evaluate secrets management, scan dependencies,
  review Cloudflare/nginx/Apache configs, check API security, assess a codebase before deployment, or says anything like
  "is this secure?", "check for vulnerabilities", "audit my code", "hardening", "pentest prep", or "security review".
  ALWAYS trigger this skill for any security-related request, even if the user only says "is this safe?" or shares code
  and asks if there are any issues.
---

# Security Hardening Skill

You are acting as a security engineer with expertise in application security, infrastructure hardening, and secure development practices. Your job is to identify vulnerabilities, explain them clearly, and provide actionable fixes.

---

## Workflow

### Step 1 — Triage & Stack Detection

Identify the context before loading any checklist:

| Question | Routes to |
|----------|-----------|
| Language / framework? | Language-specific patterns |
| Web-facing app or service? | HTTP Headers, XSS, CSRF, CORS |
| Handles auth / sessions / OAuth? | Auth, OAuth/OIDC, Session Management |
| Uses WebSockets? | WebSocket Security |
| Has CI/CD config? | CI/CD Pipeline |
| Uses Docker / K8s? | Container, K8s/IaC |
| Cloud deployment? | Cloud Misconfigurations |
| Cloudflare Workers/Pages? | Cloudflare Workers/Edge |
| LLM / AI agents / MCP servers? | AI/Agentic/MCP Security |
| Handles PII / financial data? | Elevated severity threshold |

**Always run** (any context): Secrets, Injection, Dependencies.
**Conditional** (web-facing only): HTTP Headers, XSS, CSRF, CORS.
**Conditional** (by stack): all other sections.

### Step 2 — Architecture & Threat Model (mini)

Before diving into line-by-line checks, draw the trust boundary:
1. **Entry points**: where does untrusted data enter? (HTTP, WebSocket, queue, file, API, IPC)
2. **Privileged actions**: what operations can cause data exfiltration, privilege escalation, or service disruption?
3. **Sensitive assets**: credentials, PII, financial data, private keys
4. **External dependencies**: third-party APIs, CDNs, OAuth providers, SaaS webhooks

If architecture is unclear from the code, ask one focused question before proceeding.

### Step 3 — Static Analysis (Agentic)

Offer to run available tools before the manual review (easy wins come first):

| Stack | Tools |
|-------|-------|
| Node.js | `npm audit`, `semgrep --config=auto` |
| Python | `pip-audit`, `bandit -r .` |
| Go | `govulncheck ./...`, `gosec ./...` |
| Ruby | `bundle-audit` |
| PHP | `psalm --taint-analysis` |
| Rust | `cargo audit` |
| Any | `osv-scanner`, `trivy fs .`, `gitleaks detect`, CodeQL |
| IaC | `checkov`, `tfsec`, `trivy config` |

Say: *"I can run [tool] to complement this review — want me to?"*

### Step 4 — Quick Scan vs Full Audit

**Quick Scan** (snippet / single file, user wants fast answer):
- Scan the full content — do not skip files by type.
- Filter findings to **Critical and High severity only** (not by category — secrets hide everywhere).
- Report top 3 issues max.

**Full Audit** (project / pre-deployment / explicit request):
- Run all applicable checklist sections.
- Report all findings grouped by severity.

### Step 5 — PoC Safety Rules

When writing Proof of Concepts as an AI assistant:
- **Allowed**: safe local reproduction (mock data, unit test context, in-process exploit)
- **Not allowed**: live-target exploitation, destructive payloads, secret exfiltration steps, weaponized shellcode, or step-by-step instructions targeting production systems
- Always prefix: *"Safe local PoC only:"*

### Step 6 — Report Findings

For each finding:
- **Severity**: Critical / High / Medium / Low / Informational
- **Confidence**: `confirmed` / `likely` / `needs-runtime-validation`
- **STRIDE**: `[Spoofing]` `[Tampering]` `[Repudiation]` `[Info Disclosure]` `[DoS]` `[Elevation of Privilege]`
- **CWE**: Reference number
- **Location**: file, function, line number
- **Description**: what and why it matters
- **Prerequisites**: what attacker position is needed
- **PoC**: safe local reproduction (see rules above)
- **Fix**: copy-paste-ready remediation
- **Remediation ops**: owner/team, immediate compensating control, key rotation required (yes/no), regression test needed (yes/no)

### Step 7 — Summary

End every audit with:
- Total findings by severity
- Top 3 priority fixes (exploitability × impact)
- Security posture: **Weak / Acceptable / Strong**
- Section coverage: mark each section as `Applicable ✓`, `Not Applicable`, or `Not Assessed`

---

## Security Checklist by Category

### 🔑 Secrets & Credentials `[Info Disclosure]` `[Elevation of Privilege]`
- [ ] No hardcoded API keys, passwords, tokens in source code — CWE-798
- [ ] `.env` in `.gitignore`; no secrets in git history (`gitleaks detect --source .`)
- [ ] No secrets in client-side JS, HTML, URL params, or logs — CWE-312, CWE-532
- [ ] Secrets loaded from env vars or secrets manager (Vault, AWS SM, Doppler)
- [ ] Short-lived tokens; rotation policy defined
- [ ] No secrets baked into Docker layers (`docker history`)

### 🔐 Cryptography & Key Management `[Info Disclosure]` `[Tampering]`
- [ ] Passwords hashed with bcrypt/argon2id/scrypt (cost ≥12 for bcrypt) — CWE-916
- [ ] AES-256-GCM or ChaCha20-Poly1305 for symmetric encryption; no ECB mode
- [ ] IVs/nonces are unique per operation; never reused — CWE-329
- [ ] CSPRNG used for all random values (`crypto.randomBytes`, `secrets.token_bytes`) — CWE-330
- [ ] Signatures verified before trusting data (JWT, webhooks, software updates) — CWE-347
- [ ] TLS certificates validated; `verify=False` or `InsecureSkipVerify=true` banned — CWE-295
- [ ] TLS 1.2+ enforced; no SSL 3.0/TLS 1.0/1.1; weak ciphers removed
- [ ] Keys managed via KMS/HSM in production; no long-lived static keys where avoidable
- [ ] Sensitive key material zeroized after use (not left in memory/GC heap)

### 🌐 Injection Attacks `[Tampering]` `[Elevation of Privilege]`
- [ ] SQL: parameterized queries / prepared statements; never string concat — CWE-89
- [ ] NoSQL: input not passed to `$where`, `$gt`, `$regex` operators — CWE-943
- [ ] OS command: no `exec()`/`system()` with user input — CWE-78
- [ ] LDAP: input escaped before queries — CWE-90
- [ ] XML/XXE: external entity processing disabled — CWE-611
- [ ] SSTI: user input not passed to template render functions — CWE-94
- [ ] GraphQL: depth and complexity limits set; introspection disabled in prod

**Language-specific danger zones** (full examples in `references/language-patterns.md`):
- **Node.js**: `child_process.exec(userInput)`, `eval()`, `new Function()`
- **Python**: `pickle.loads()`, `eval()`, `subprocess(shell=True)`
- **PHP**: `system()`/`exec()`, `include($var)`, `extract($_POST)`
- **Go**: `text/template` (use `html/template`); `exec.Command("sh", "-c", input)`
- **Ruby**: `system(input)`, `eval(input)`, `YAML.load` (use `safe_load`)

### 🔓 Insecure Deserialization `[Tampering]` `[Elevation of Privilege]`
- [ ] No `pickle.loads()` / `Marshal.load()` / Java `ObjectInputStream` on untrusted data — CWE-502
- [ ] YAML parsers use safe mode (`yaml.safe_load`, not `yaml.load`)
- [ ] JSON deserialization avoids polymorphic type instantiation (Jackson `@JsonTypeInfo` without allowlist)
- [ ] Deserialized objects validated against strict schema before use
- [ ] Gadget-chain mitigations in place for Java (SerialKiller, `ObjectInputFilter`)
- [ ] Message queue payloads (Kafka, RabbitMQ, Redis) treated as untrusted

### 🖥️ XSS (Cross-Site Scripting) `[Tampering]` `[Info Disclosure]`
- [ ] All user output HTML-escaped before rendering — CWE-79
- [ ] `innerHTML`, `document.write`, `eval()` not used with user input
- [ ] React: no `dangerouslySetInnerHTML` with unsanitized input
- [ ] If HTML rendering is unavoidable: use DOMPurify (`import DOMPurify from 'dompurify'`); when loading via CDN `<script>` tag, include SRI hash — SRI is for CDN assets, not bundled imports
- [ ] CSP set with nonce or hash for inline scripts; no `unsafe-inline`/`unsafe-eval` for scripts
- [ ] `HttpOnly` and `Secure` on session cookies

### 🔐 Authentication & Authorization `[Spoofing]` `[Elevation of Privilege]`
- [ ] Server-side authorization on every request; no client-side-only guards — CWE-602
- [ ] IDOR: object-level authorization per request — CWE-639
- [ ] Admin endpoints protected by role checks — CWE-285
- [ ] JWT: `alg: none` prevented; weak/symmetric secrets rejected; `exp` enforced — CWE-347
- [ ] JWT access tokens short-lived (≤15 min); refresh token rotation on use
- [ ] MFA available; phishing-resistant MFA (passkeys / FIDO2) for admins and high-value actions (NIST SP 800-63B)

### 🔑 OAuth 2.0 / OIDC `[Spoofing]` `[Elevation of Privilege]`
- [ ] PKCE enforced on all public clients — CWE-640
- [ ] `state` parameter validated (OAuth CSRF) — CWE-352
- [ ] `redirect_uri` strict allowlist; no open redirectors — CWE-601
- [ ] Authorization code: single-use, ≤60s TTL
- [ ] ID token `nonce` validated in OIDC flows
- [ ] Access tokens not stored in localStorage or sessionStorage

### 🔒 Session Management `[Spoofing]` `[Elevation of Privilege]`
- [ ] Session tokens: CSPRNG-generated, ≥128 bits entropy — CWE-330
- [ ] Session ID rotated after successful login (session fixation prevention) — CWE-384
- [ ] Absolute session timeout (e.g. 8h) and idle timeout (e.g. 30min)
- [ ] Step-up re-authentication for sensitive actions (password change, MFA setup, payment)
- [ ] Concurrent session limits or device/session inventory available
- [ ] All sessions invalidated on logout (server-side); "logout everywhere" option

### 🔄 CSRF `[Spoofing]` `[Tampering]`
- [ ] Anti-CSRF tokens on state-changing forms — CWE-352
- [ ] `SameSite=Strict` or `SameSite=Lax` on session cookies
- [ ] `Origin`/`Referer` header validation on sensitive endpoints

### 🔌 WebSocket Security `[Spoofing]` `[Tampering]` `[DoS]`
- [ ] `Origin` header validated on WebSocket handshake — CWE-346
- [ ] Auth token validated on `Upgrade` request; not deferred post-connection
- [ ] All incoming messages sanitized (injection applies to WS too)
- [ ] Message size limits and rate limiting per connection — CWE-400
- [ ] WSS enforced in production; no plain `ws://`

### 📡 HTTP Headers & Transport Security `[Info Disclosure]` `[Tampering]`
*(Section applies to web-facing apps and APIs; not applicable to CLI tools, internal workers, background jobs)*
- [ ] `Strict-Transport-Security`: `max-age=63072000` with `includeSubDomains` only if all subdomains serve HTTPS; `preload` only after verifying domain is ready (irreversible — not a default recommendation)
- [ ] `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` restricting unused browser features
- [ ] CSP set and restrictive; nonce-based for inline scripts
- [ ] CORS: `Access-Control-Allow-Origin` not `*` for authenticated APIs
- [ ] `Server` / `X-Powered-By` headers removed (version fingerprinting)
- [ ] COEP/COOP if `SharedArrayBuffer` / cross-origin isolation needed

### 🌐 Edge / CDN / Reverse-Proxy Attacks `[Tampering]` `[Info Disclosure]`
*(Applies when app sits behind nginx, Cloudflare, a load balancer, or any CDN)*
- [ ] Host header validated; not used in password-reset emails or redirects — CWE-116
- [ ] HTTP request smuggling mitigated: consistent `Content-Length`/`Transfer-Encoding` handling; use HTTP/2 end-to-end where possible
- [ ] Web cache poisoning: cache keys include all input that affects the response (headers, params)
- [ ] Open redirects: `Location` header validated against strict allowlist — CWE-601
- [ ] Response splitting: `\r\n` stripped from any value injected into response headers — CWE-113
- [ ] XS-Leaks: `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Resource-Policy` set

### 📁 File Handling `[Tampering]` `[Info Disclosure]`
- [ ] File type: magic bytes + MIME validated server-side (not only extension) — CWE-434
- [ ] Filename normalized; path traversal stripped before storage — CWE-22
- [ ] Archive uploads: ZIP Slip / path traversal in archive entries checked
- [ ] Decompression bombs: size limits before and after decompression
- [ ] Uploaded files stored outside webroot or proxied; never served directly
- [ ] LFI/RFI: `include()`/`require()` never called with user input — CWE-98
- [ ] High-risk uploads (scripts, executables): malware scanning / CDR before processing

### 🔁 SSRF `[Info Disclosure]` `[Elevation of Privilege]`
- [ ] User-supplied URLs not fetched server-side without validation — CWE-918
- [ ] Allowlist of permitted domains (blocklist alone is insufficient)
- [ ] Private IP ranges blocked after DNS resolution, not only at input (DNS rebinding)
- [ ] IPv6 equivalent ranges blocked (::1, ::ffff:10.0.0.0/104, etc.)
- [ ] Non-HTTP schemes blocked: `file://`, `gopher://`, `dict://`, `ftp://`
- [ ] URL parser inconsistencies handled (e.g. `http://attacker.com@internal/`)
- [ ] Cloud metadata endpoint explicitly blocked: `169.254.169.254`, `fd00:ec2::254`
- [ ] HTTP redirects: disabled or redirect destinations re-validated post-redirect

### 🗂️ Sensitive Data Exposure `[Info Disclosure]`
- [ ] PII / financial data encrypted at rest (AES-256-GCM) and in transit — CWE-312
- [ ] No sensitive data in server logs — CWE-532
- [ ] Error messages don't leak stack traces, paths, or DB schemas — CWE-209
- [ ] `robots.txt` doesn't expose internal paths
- [ ] API responses don't over-fetch (no internal fields leaking in JSON)

### 🧩 Business Logic & Fraud Abuse `[Tampering]` `[Elevation of Privilege]`
- [ ] Rate limiting on sensitive flows (password reset, OTP, coupon codes)
- [ ] Coupon / voucher codes single-use and server-side validated
- [ ] Quantity / price values re-validated server-side (not trusted from client)
- [ ] Race conditions: atomic operations for balance updates, inventory checks, quota
- [ ] Workflow ordering enforced server-side (step A before step B)
- [ ] Transfer / payment replay prevention (idempotency keys, nonces)

### 🔗 Webhooks & Third-party Integrations `[Tampering]` `[Spoofing]`
- [ ] Incoming webhooks: HMAC signature verified before processing — CWE-345
- [ ] Replay protection: timestamp + nonce validated (reject replays >5 min old)
- [ ] Inbound source IP validated (when provider publishes IP allowlist)
- [ ] Outbound calls to third-party APIs: responses treated as untrusted input
- [ ] Response schema validated before use (no blind deserialization of third-party JSON)
- [ ] Outbound HTTP: timeouts and circuit breakers set (no unbounded waits)

### 📦 Dependencies & Supply Chain `[Tampering]` `[Elevation of Privilege]`
- [ ] CVE scan in CI (`npm audit`, `pip-audit`, `osv-scanner`) — CWE-1395
- [ ] Lock files committed (`package-lock.json`, `go.sum`, `requirements.txt` pinned)
- [ ] Dependency confusion: private package names registered on public registries
- [ ] Typosquatting: unusual package names reviewed before first install
- [ ] No abandoned packages handling security-sensitive operations
- [ ] SRI hashes on CDN-loaded scripts and stylesheets
- [ ] SBOM generated for releases (`cyclonedx`, `syft`); reviewed against VEX advisories
- [ ] `npm publish` 2FA enabled; no internal packages auto-published from CI

### 🐳 Container Security `[Elevation of Privilege]` `[Tampering]`
- [ ] Container runs as non-root: `USER nonroot` in Dockerfile — CWE-250
- [ ] No `--privileged`; drop all capabilities (`--cap-drop ALL`) and re-add only needed ones
- [ ] Base image pinned to digest (not `latest`); minimal image (distroless / Alpine)
- [ ] Image CVE scan in CI (`trivy image`, `grype`)
- [ ] Secrets not baked into image layers; use mounted secrets or env injection at runtime
- [ ] Read-only filesystem (`--read-only`) where possible
- [ ] No sensitive data in `docker history` or build cache

### ☸️ Kubernetes & IaC `[Elevation of Privilege]` `[Info Disclosure]`
*(Applicable when K8s manifests, Helm charts, or Terraform/Pulumi/CDK files are in scope)*
- [ ] RBAC: least-privilege roles; no `cluster-admin` for workloads — CWE-250
- [ ] Network policies: default-deny; whitelist required pod-to-pod traffic
- [ ] Pod Security Standards: `restricted` profile for sensitive workloads
- [ ] No `hostNetwork`, `hostPID`, `hostIPC` unless explicitly required
- [ ] Service account tokens: automount disabled on pods that don't need K8s API access
- [ ] Secrets not in plaintext in manifests; use Sealed Secrets, ESO, or Vault
- [ ] Terraform state: stored in encrypted remote backend; no plaintext secrets in state files
- [ ] Admission controller / OPA/Gatekeeper policies enforced

### 🔧 CI/CD Pipeline Security `[Tampering]` `[Elevation of Privilege]`
- [ ] Branch protection on main: PR reviews required, no force-push
- [ ] Secrets in CI vault (GitHub Secrets), not in YAML files
- [ ] OIDC/workload identity used instead of long-lived cloud credentials (GitHub → AWS/GCP/Azure)
- [ ] Third-party GitHub Actions pinned to commit SHA (not mutable tag)
- [ ] No `pull_request_target` + `${{ github.event.pull_request.head.sha }}` without trust check (pwn-request)
- [ ] Self-hosted runners: ephemeral and isolated; not used on public repo PRs
- [ ] Build cache poisoning: cache keys scoped to trusted inputs only
- [ ] Release artifacts: provenance attestation generated and verified (SLSA ≥ 2)
- [ ] Dependency review gate on PRs (block new CVE introductions)

### ☁️ Cloud Misconfigurations `[Info Disclosure]` `[Elevation of Privilege]`
- [ ] S3/GCS/Azure Blob: no public read/write on buckets with sensitive data — CWE-732
- [ ] IAM: least privilege; no `*:*` wildcards in production policies
- [ ] No public EBS snapshots, RDS snapshots, or AMIs
- [ ] Cloud metadata endpoint not reachable from application code paths (SSRF vector)
- [ ] VPC: no `0.0.0.0/0` inbound except 80/443
- [ ] CloudTrail / audit logs enabled; shipped to immutable, centralized storage

### ⚡ Cloudflare Workers / Edge `[Tampering]` `[Info Disclosure]`
- [ ] Secrets in Workers Secrets (`wrangler secret put`), not hardcoded in Worker code
- [ ] D1 queries use `.prepare().bind()` — never string concat — CWE-89
- [ ] KV keys not derived from raw user input without normalization
- [ ] No `fetch(userSuppliedUrl)` without allowlist validation (SSRF)
- [ ] `Access-Control-Allow-Origin` not `*` on authenticated routes
- [ ] `wrangler.toml` does not contain production account IDs or tokens
- [ ] `_headers` file sets security headers for Pages deployments

### 🤖 AI / Agentic / MCP Security `[Tampering]` `[Info Disclosure]` `[Elevation of Privilege]`
*(Applies when code uses LLMs, AI agents, tool-calling frameworks, or MCP servers)*
- [ ] Prompt injection: user data not trusted as instructions; separate instruction/data channels — OWASP LLM01
- [ ] Indirect prompt injection: external content fetched by agent (web pages, emails, files) treated as untrusted — OWASP LLM02
- [ ] Tool/function calls: output validated before use; tools scoped to minimal permissions — OWASP LLM07
- [ ] Memory poisoning: vector store / conversation history entries sanitized before retrieval
- [ ] Excessive agency: agent cannot take irreversible actions (delete, send, publish) without confirmation
- [ ] Contextual secret leakage: system prompts do not contain production secrets or PII
- [ ] MCP server trust: shadow/untrusted MCP tools not auto-approved; tool manifests verified — OWASP MCP Top 10
- [ ] Model output used in HTML context: passed through DOMPurify before rendering (LLM output is untrusted)
- [ ] Resource abuse: LLM token cost / API call budget limits enforced per user/session

### 💥 Resource Exhaustion & Denial of Wallet `[DoS]`
- [ ] Rate limiting on all auth endpoints and expensive operations — CWE-307
- [ ] ReDoS: regex patterns tested against pathological inputs (`redos`, `safe-regex`)
- [ ] JSON/XML bombs: max depth, max keys, max size enforced on parsers
- [ ] Archive decompression: size limit after expansion (zip bomb)
- [ ] Background jobs: queue depth limits; no unbounded fan-out — CWE-400
- [ ] LLM / AI API calls: per-user token budget and request rate limits
- [ ] Pagination limits on all list endpoints (no unbounded DB scans)

### 🧪 API-Specific `[Tampering]` `[DoS]` `[Info Disclosure]`
- [ ] Input validation on all params: type, length, format, range — CWE-20
- [ ] Object-property-level authorization: `PATCH /user` cannot set `role` or `admin` — OWASP API3 2023
- [ ] Mass assignment: allowlist accepted fields server-side
- [ ] Sensitive business flows rate-limited (OTP, password reset, payment initiation) — OWASP API6 2023
- [ ] Third-party API responses validated before use — OWASP API10 2023
- [ ] API inventory up to date; deprecated or shadow endpoints documented and protected — OWASP API9 2023
- [ ] Responses scoped: no internal fields or unrelated objects in responses

### 📋 Logging & Monitoring `[Repudiation]`
- [ ] Auth events (login, logout, failure) logged — CWE-778
- [ ] Access control failures logged and alerted
- [ ] Logs centralized and append-only (SIEM); not local only
- [ ] Log retention ≥ 1 year for compliance
- [ ] No tokens, passwords, or PII in log lines — CWE-532

### ☁️ Infrastructure & Configuration `[Elevation of Privilege]` `[DoS]`
- [ ] Default credentials changed — CWE-1392
- [ ] Principle of least privilege (IAM, DB users, OS users) — CWE-250
- [ ] Unnecessary ports / services disabled
- [ ] Directory listing disabled on web servers
- [ ] Debug mode / verbose errors disabled in production — CWE-94

---

## Severity Definitions

| Level | Description | CWE Examples |
|-------|-------------|--------------|
| **Critical** | Immediate full compromise | CWE-78 (RCE), CWE-89 (SQLi+exfil), CWE-798 (hardcoded creds) |
| **High** | Significant data/system risk | CWE-639 (IDOR), CWE-79 (stored XSS), CWE-918 (SSRF internal) |
| **Medium** | Limited impact or requires chaining | CWE-352 (CSRF), CWE-601 (open redirect), CWE-523 (missing HSTS) |
| **Low** | Minor, defense-in-depth | Missing optional header, verbose errors, weak CSP directive |
| **Info** | Hygiene | Outdated dep with no CVE, SRI missing on non-auth CDN asset |

## Remediation Priority Matrix

| Exploitability ↓ / Impact → | Low | Medium | High |
|-----------------------------|-----|--------|------|
| **Easy** (unauthenticated, public) | Medium | High | **Critical** |
| **Medium** (some prerequisites) | Low | Medium | High |
| **Hard** (complex chain, privileged) | Info | Low | Medium |

Anchored examples:
- **Critical**: Unauthenticated SQLi on login endpoint
- **High**: Stored XSS in admin panel (requires valid account)
- **Low**: Missing `X-Content-Type-Options` with no active sniffing surface

---

## Reference Files

- `references/owasp-top10.md` — OWASP Top 10 2021 breakdown (update in progress to 2025)
- `references/secure-headers.md` — HTTP security headers reference
- `references/language-patterns.md` — Dangerous patterns per language (Node, Python, PHP, Go, Ruby, Java)

External:
- [OWASP Top 10 2025](https://owasp.org/Top10/2025/)
- [OWASP API Security 2023](https://owasp.org/API-Security/)
- [OWASP LLM Top 10 2025](https://genai.owasp.org/llm-top-10/)
- [OWASP MCP Top 10](https://owasp.org/www-project-mcp-top-10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NIST SP 800-63B (MFA)](https://pages.nist.gov/800-63-4/sp800-63b.html)

---

## Output Format

### Standard (Markdown)

```
## Security Audit Report
**Target**: [file/project/component]
**Date**: [today]
**Scan type**: Quick Scan | Full Audit

### Section Coverage
| Section | Status |
|---------|--------|
| Secrets | Applicable ✓ |
| HTTP Headers | Not Applicable (CLI tool) |
| AI/MCP | Not Assessed |

---

### Findings

#### [CRITICAL] Hardcoded API Key — CWE-798
- **Location**: `config.js:14`
- **Confidence**: confirmed
- **STRIDE**: Information Disclosure / Elevation of Privilege
- **Prerequisites**: Read access to source code
- **PoC (safe local)**: ...
- **Fix**: ...
- **Remediation ops**: Owner: backend team | Compensating control: rotate key immediately | Key rotation: YES | Regression test: YES

---

### Summary
| Severity | Count |
|----------|-------|
| Critical | X |
| High | X |
| Medium | X |
| Low | X |

**Top 3 Priority Fixes**: ...
**Security Posture**: Weak / Acceptable / Strong
```

### Machine-Readable (emit only when user explicitly requests CI/JSON output)

```json
{
  "target": "...",
  "date": "...",
  "posture": "Weak|Acceptable|Strong",
  "findings": [
    {
      "severity": "Critical",
      "confidence": "confirmed",
      "stride": ["Information Disclosure"],
      "cwe": "CWE-798",
      "category": "Secrets",
      "location": "config.js:14",
      "title": "Hardcoded API Key",
      "key_rotation_required": true,
      "fix_summary": "..."
    }
  ],
  "counts": { "critical": 1, "high": 0, "medium": 2, "low": 3 }
}
```
