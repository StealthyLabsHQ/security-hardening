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
triggers_strong: ["secure review and fix", "ai generated code remediation", "semgrep remediate", "review and harden ai patch", "corriger apres semgrep", "revue code ia", "scan and fix", "detect-only security review"]
triggers_weak: ["fix security findings", "remediate sast", "ai patch review"]
related: ["security-diff-review", "vibecoder-traps", "language-patterns", "quick-start-ai-coding", "secret-leak-prevention", "database-security"]
---

# AI Code Secure Remediation

> Last reviewed: 2026-08-20 | Next review: 2027-02-20 | Priority: Essential | Audit Level: 1-3 | Automation: Partial (Semgrep/Gitleaks scan and re-scan automatable; authorization logic and business abuse paths manual)

Use this runbook when an agent or reviewer must **scan AI-generated or human-written code, triage findings, optionally propose or apply defensive fixes, and re-verify**. Pair it with `security-diff-review.md` for triage order and output format.

This skill prefers defensive fixes. Do not produce exploit PoCs, weaponized payloads, or offensive operator steps. **Default mode is detect-only**: find issues without editing the product or touching a live database.

---

## 1. Goals

1. Detect exploitable risk in the changed scope without destroying frontend, backend, API, or database state.
2. Prefer the smallest safe source fix over broad rewrites.
3. Treat scanner output as a signal, not a final verdict.
4. Stop cleanly: re-scan Critical/High, or document residual risk.

---

## 2. Modes

| Mode | When | Agent may |
|------|------|-----------|
| `detect-only` (**default**) | User asks to review, audit, scan, or detect | Run `scripts/secure-review.py`, triage, report. **No file edits.** |
| `propose-fixes` | User asks for suggested patches / how to fix | Same as detect, plus `proposed_fixes` text in JSON. **Do not write files.** |
| `apply-fixes` | User explicitly says fix / remediate / apply / corriger | Write only findings with `safe_to_autofix=true`. **`db` and `secrets` are never writable.** No destructive migrations. |

Enter `apply-fixes` only on explicit intent (`fix`, `remediate`, `apply fixes`, `corriger`). Ambiguous prompts stay in `detect-only`.

Hard rule: `blast_radius` in `{db, secrets}` always has `safe_to_autofix=false`. Prefer propose-only parameterized-query templates for SQL.

### Uncovered by SAST (always mention)

Even with a clean Semgrep report, still review manually:

- IDOR / object-level authorization,
- business-logic abuse,
- mass assignment of privileged fields,
- destructive schema migrations (`DROP` / `TRUNCATE` / data rewrites).

---

## 3. Non-Destructive Safety

Detection must not "jump" the user's database or break the product.

1. Never point scanners or verification at a production database.
2. Never execute injection payloads (SQL, XSS, command) against a non-ephemeral environment.
3. Do not refactor frontend, backend, or API outside the hotspot file/lines that carry the finding.
4. Database fixes = parameterized queries / ORM binds / server-side validation. No schema change unless explicitly required, and then only an additive versioned migration proposed (prefer `propose-fixes`).
5. If a finding touches the data layer (`blast_radius: db` or SQL/raw query patterns), load `database-security.md` and `ssrf-deserialization-command-injection.md` when RCE-adjacent, and treat severity as maximum priority.
6. After `apply-fixes`: static re-scan always. Runtime tests only if an isolated local/CI suite already exists (ephemeral DB / in-memory SQLite / disposable container). Never seed from prod.

| Layer | Allowed | Forbidden |
|-------|---------|-----------|
| Code (FE/BE/API) | Semgrep/Gitleaks on files / `git diff`; hotspot review | Rewriting whole modules "to test" |
| API | Read handlers; existing isolated unit/integration tests | Active DAST/fuzz or exploit payloads to a real server |
| DB | Static SQL/ORM detection; tests on ephemeral DB only | sqlmap, DROP/TRUNCATE, prod writes, prod restores into the review path |

---

## 4. Operational Loop

1. **Choose mode** — default `detect-only` unless the user explicitly requests propose/apply.
2. **Scope** — `git diff`, listed files, or a directory. Prefer the AI patch surface.
3. **Scan** — `python scripts/secure-review.py <target> --mode detect` (Semgrep + Gitleaks). Soft-fail if a tool is missing.
4. **Map** — use `suggested_refs`, `blast_radius`, and `safe_to_autofix` from the JSON (or `python scripts/map_findings.py --report <json>`). Always load `_core-invariants.md`, this runbook, `security-diff-review.md`, and `vibecoder-traps.md` for AI patches.
5. **Triage** — by priority below (P0 first). Confirmed secrets are a hard stop.
6. **Propose or fix** — only in `propose-fixes` / `apply-fixes`. Smallest defensive change. Never ship exploit PoCs.
7. **Re-scan** — after apply only. Optionally `python scripts/rescan-after-fix.py before.json after.json`.
8. **Report** — format in `security-diff-review.md` section 10. State the mode used and that prod/DB were not touched.

### Secrets are a hard stop

If Gitleaks (or review) confirms a live secret:

- do not "patch around" the leak,
- remove the secret from the tree (only in `apply-fixes`),
- rotate/revoke the credential,
- follow `secret-leak-prevention.md`.

---

## 5. Priority (DB / malware-like first)

| Priority | Blast radius | Examples |
|----------|--------------|----------|
| **P0** | `db`, `rce`, `secrets` | SQL concat/raw queries; pickle/unsafe YAML; `eval`/`exec`/`shell=True`; uploads/path traversal to server; DB credentials in source |
| **P1** | `api` | Missing ownership / IDOR / mass assignment |
| **P2** | `frontend` | XSS / `innerHTML` / unsafe render |
| **P3** | other | Hygiene, weak crypto for non-password uses, config drift |

P0 findings: extreme caution. Prefer `detect-only` or `propose-fixes` when a real fix would require schema or API contract changes.

---

## 6. Finding → Reference Mapping

| Signal / check family | Load first |
|-----------------------|------------|
| `shell=True`, `os.system`, `eval`, `exec`, child_process shell | `language-patterns.md`, `ssrf-deserialization-command-injection.md`, `vibecoder-traps.md` |
| SQL string concat / raw queries / f-string SQL | `database-security.md`, `language-patterns.md`, `owasp-top10.md` |
| Weak password hashing (MD5/SHA) | `applied-cryptography.md`, `vibecoder-traps.md` |
| `verify=False` / TLS bypass | `language-patterns.md`, `vibecoder-traps.md` |
| Unsafe deserialization (`pickle`, unsafe YAML) | `ssrf-deserialization-command-injection.md`, `language-patterns.md` |
| XSS / `innerHTML` / unsafe render | `browser-security-modern.md`, `frontend-frameworks-security.md` |
| Missing ownership / IDOR / authz gaps | `authorization-rbac.md`, `api-security.md` (manual — SAST often misses these) |
| Secret / key / token leak | `secret-leak-prevention.md`, `pre-push-checklist.md` |
| Verbose errors / PII in logs | `production-error-handling.md`, `privacy-data-minimization.md` |
| CI / workflow permission drift | `github-actions-hardening.md`, `supply-chain-security.md` |

Stable Semgrep rule IDs under `semgrep/` stay mapped in `scripts/map_findings.py`.

---

## 7. Fix Policy (do not break the product)

| Risk | Preferred fix |
|------|----------------|
| Command / code injection | Remove shell/eval path; use argv lists or safe APIs |
| SQL injection | Parameterized queries / ORM binds only — preserve business query intent |
| Weak password hash | Argon2id / bcrypt / scrypt via a maintained library |
| TLS verification disabled | Restore verification; fix trust store instead |
| Unsafe deserialize | Reject untrusted blobs; use safe loaders / schema formats |
| Missing object-level authz | Enforce owner/tenant check server-side; return 404/403 |
| Mass assignment | Strip privileged fields from client-controlled schemas |
| Secret in source | Remove, rotate, add ignore + scanning |
| Info disclosure | Generic client errors; structured server logs without secrets |

Contract rules:

- Prefer 1–10 line diffs at the hotspot.
- Keep public API signatures and JSON/UI contracts stable unless the insecurity is the contract itself.
- If a correct fix needs a breaking API or destructive migration, stay in `propose-fixes` and document residual risk.
- Do not widen permissions "to make it work."
- Do not disable scanners with unexplained `# nosemgrep` / `# noqa` — require a one-line justification.
- `safe_to_autofix: false` means propose only — always true for `db` and `secrets` blast radii.

---

## 8. Exit Criteria

Done when:

- mode and non-touch of prod/DB are stated in the report, and
- Critical/High scanner findings in scope are reported (detect), proposed, or fixed per mode, and
- manual authz/hotspot review for AI patches covers new routes and trust-boundary changes, and
- after apply, re-scan shows no new Critical/High regressions from the fix set.

Not done when:

- only warnings were silenced,
- secrets remain in history without rotation,
- authz was "checked" only in the frontend,
- verification required writing to the user's real database.

---

## 9. Hard Limits

- No active DAST against production or shared staging with real data.
- No exploit chains, payloads meant to compromise systems, or operator-bypass guidance.
- SAST does not replace IDOR / business-logic review.
- Do not auto-merge or auto-push remediations without an operator-visible review step.
- Do not auto-apply destructive schema migrations (`DROP`, `TRUNCATE`, data rewrites).

---

## 10. Related References

- `security-diff-review.md`
- `database-security.md`
- `vibecoder-traps.md`
- `quick-start-ai-coding.md`
- `language-patterns.md`
- `secret-leak-prevention.md`
- `authorization-rbac.md`
- `ssrf-deserialization-command-injection.md`
