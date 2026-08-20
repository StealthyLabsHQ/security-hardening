---
title: "AI Code Secure Remediation"
slug: ai-code-secure-remediation
category: appsec
depth: 2
audit_level: [1, 2, 3]
last_reviewed: 2026-08-20
sources:
  - "OWASP Secure Code Review Cheat Sheet"
  - "OWASP ASVS"
  - "Semgrep — https://semgrep.dev/docs/"
  - "Gitleaks — https://github.com/gitleaks/gitleaks"
triggers_strong: ["secure review and fix", "ai generated code remediation", "semgrep remediate", "review and harden ai patch", "corriger apres semgrep", "revue code ia", "scan and fix"]
triggers_weak: ["fix security findings", "remediate sast", "ai patch review"]
related: ["security-diff-review", "vibecoder-traps", "language-patterns", "quick-start-ai-coding", "secret-leak-prevention"]
---

# AI Code Secure Remediation

> Last reviewed: 2026-08-20 | Next review: 2027-02-20 | Priority: Essential | Audit Level: 1-3 | Automation: Partial (Semgrep/Gitleaks scan and re-scan automatable; authorization logic and business abuse paths manual)

Use this runbook when an agent or reviewer must **scan AI-generated or human-written code, triage findings, apply defensive fixes, and re-verify**. Pair it with `security-diff-review.md` for triage order and output format.

This skill prefers defensive fixes. Do not produce exploit PoCs, weaponized payloads, or offensive operator steps.

---

## 1. Goals

1. Reduce exploitable risk in the changed scope first.
2. Prefer the smallest safe fix over broad rewrites.
3. Treat scanner output as a signal, not a final verdict.
4. Stop cleanly: re-scan Critical/High, or document residual risk.

---

## 2. Operational Loop

1. **Scope** — `git diff`, listed files, or a directory. Prefer the changed set for AI patches.
2. **Scan** — run `python scripts/secure-review.py` (Semgrep + Gitleaks). Soft-fail if a tool is missing; continue with available signals and manual hotspot review.
3. **Map** — use `python scripts/map_findings.py` (or the JSON `suggested_refs` field) to load only the needed references plus `references/_core-invariants.md`.
4. **Always load for AI patches** — `security-diff-review.md` and `vibecoder-traps.md` in addition to mapped refs.
5. **Triage** — exploitability, blast radius, missing controls. Lead with High/Critical.
6. **Fix** — apply defensive remediations for High/Critical first.
7. **Re-scan** — re-run `secure-review.py` on the same scope. Repeat until Critical/High are clear or residual risk is documented.
8. **Report** — use the finding format in `security-diff-review.md` section 10.

### Secrets are a hard stop

If Gitleaks (or review) confirms a live secret:

- do not "patch around" the leak,
- remove the secret from the tree,
- rotate/revoke the credential,
- follow `secret-leak-prevention.md`.

---

## 3. Finding → Reference Mapping

| Signal / check family | Load first |
|-----------------------|------------|
| `shell=True`, `os.system`, `eval`, `exec`, child_process shell | `language-patterns.md`, `ssrf-deserialization-command-injection.md`, `vibecoder-traps.md` |
| SQL string concat / raw queries | `language-patterns.md`, `database-security.md`, `owasp-top10.md` |
| Weak password hashing (MD5/SHA) | `applied-cryptography.md`, `vibecoder-traps.md` |
| `verify=False` / TLS bypass | `language-patterns.md`, `vibecoder-traps.md` |
| Unsafe deserialization (`pickle`, unsafe YAML) | `ssrf-deserialization-command-injection.md`, `language-patterns.md` |
| XSS / `innerHTML` / unsafe render | `browser-security-modern.md`, `frontend-frameworks-security.md` |
| Missing ownership / IDOR / authz gaps | `authorization-rbac.md`, `api-security.md` (manual — SAST often misses these) |
| Secret / key / token leak | `secret-leak-prevention.md`, `pre-push-checklist.md` |
| Verbose errors / PII in logs | `production-error-handling.md`, `privacy-data-minimization.md` |
| CI / workflow permission drift | `github-actions-hardening.md`, `supply-chain-security.md` |

Stable Semgrep rule IDs under `semgrep/` should stay mapped in `scripts/map_findings.py`.

---

## 4. Fix Policy

| Risk | Preferred fix |
|------|----------------|
| Command / code injection | Remove shell/eval path; use argv lists or safe APIs |
| SQL injection | Parameterized queries / ORM binds only |
| Weak password hash | Argon2id / bcrypt / scrypt via a maintained library |
| TLS verification disabled | Restore verification; fix trust store instead |
| Unsafe deserialize | Reject untrusted blobs; use safe loaders / schema formats |
| Missing object-level authz | Enforce owner/tenant check server-side; return 404/403 |
| Mass assignment | Strip privileged fields from client-controlled schemas |
| Secret in source | Remove, rotate, add ignore + scanning |
| Info disclosure | Generic client errors; structured server logs without secrets |

Do not widen permissions "to make it work." Do not disable scanners with unexplained `# nosemgrep` / `# noqa` comments — require a one-line justification.

---

## 5. Exit Criteria

Done when:

- Critical/High scanner findings in scope are fixed or explicitly accepted with owner + expiry, and
- manual authz/hotspot review for AI patches is complete for new routes and trust-boundary changes, and
- re-scan shows no new Critical/High regressions from the fix set.

Not done when:

- only warnings were silenced,
- secrets remain in history without rotation,
- authz was "checked" only in the frontend.

---

## 6. Hard Limits

- No active DAST against production.
- No exploit chains, payloads meant to compromise systems, or operator-bypass guidance.
- SAST does not replace IDOR / business-logic review.
- Do not auto-merge or auto-push remediations without an operator-visible review step.

---

## 7. Related References

- `security-diff-review.md`
- `vibecoder-traps.md`
- `quick-start-ai-coding.md`
- `language-patterns.md`
- `secret-leak-prevention.md`
- `authorization-rbac.md`
