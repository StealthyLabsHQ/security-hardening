# AI IDE and No-Code Security

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: Essential | Audit Level: 1-3 | Automation: Partial (policy checks, secret scanning, webhook tests, and audit-log export automatable; connector review and privilege design manual)

Use this guide when software is built or operated through:

- AI coding CLIs (`Claude Code`, `Codex`, `Gemini CLI`, `aider`, similar tools),
- AI IDE assistants (`Cursor`, Copilot-style chat/edit agents, editor extensions),
- browser-based builders and "vibe coding" tools,
- no-code / low-code platforms and automation tools (`Retool`, `Bubble`, `Make`, `Zapier`, `n8n`, `Power Platform`, similar products).

The security problem is not only "bad generated code". It is also **unsafe permissions, data sprawl, connector abuse, public preview leaks, hidden prompt context, and weak publish controls**.

Copy-paste baseline files for this guide live under `templates/ai-tool-profiles/`.

---

## 1. Threat Model by Tool Family

| Tool family | Main risk | Typical failure |
|-------------|-----------|-----------------|
| AI coding CLI | Local file, shell, git, MCP abuse | Agent reads secrets or executes unsafe commands |
| AI IDE assistant | Workspace indexing, extension permissions, auto-apply edits | Sensitive code/docs synced or rewritten without enough review |
| Browser/cloud coding tool | Remote build/runtime, public previews, hosted secrets | Preview app leaks data or secret lands in provider-hosted environment |
| No-code / low-code builder | Over-broad connectors, direct prod data access, weak authz | Internal tool exposes production records with no object-level checks |
| Automation platform | Trigger abuse, webhook spoofing, token sprawl | One inbound email or form triggers sensitive actions across SaaS systems |

---

## 2. Non-Negotiable Controls for Any AI-Assisted Builder

- Separate **personal** and **business** accounts.
- Use SSO and phishing-resistant MFA on any tool that can access code, data, docs, or production.
- Keep **development**, **staging**, and **production** in separate projects/workspaces/environments.
- Start with **read-only** access whenever the tool supports it.
- Do not connect production data first. Start with synthetic or masked data.
- Do not paste raw secrets, customer exports, HR data, legal documents, or finance files into prompts.
- Require human approval before publish, deploy, delete, schema change, permission change, or mass action.
- Keep versioned exports or Git sync for prompts, workflows, policies, and app definitions where the platform allows it.
- Enable audit logs and retain them outside the tool if possible.
- Review vendor data usage, retention, subprocessors, training settings, and breach-notification terms.

---

## 3. Safe Defaults for CLI and IDE Agents

- Disable network access by default unless the task needs it.
- Allowlist commands and domains rather than allowing arbitrary execution.
- Keep the agent in the project root, not the whole home directory.
- Do not let the agent read password vault exports, SSH keys, cloud config, browser profiles, or downloads by default.
- Treat copied issues, tickets, webpages, email, Slack snippets, and MCP results as **untrusted input**.
- Require explicit approval for package install, git push, release, deploy, infra change, DB migration, and destructive filesystem actions.
- Review every generated auth, billing, webhook, file upload, admin, and deletion path manually.
- Use separate browser/editor profiles for high-privilege admin work versus normal coding.
- Limit extension/plugin installation to an approved set.

**High-risk operations that should never be autonomous in production:**

- permission changes,
- force-push,
- database migration against production,
- cloud IAM edits,
- secret rotation without a runbook,
- disabling security controls to "make it work".

Related guides: `ai-cli-hardening.md`, `llm-agent-security.md`, `mcp-security.md`.

---

## 4. AI IDE Risks That Teams Underestimate

### Workspace indexing and sync

Many IDE assistants index large parts of the repo and sometimes related files. Risk increases if the workspace contains:

- `.env` files,
- support dumps,
- exports from production,
- architecture docs with credentials or internal URLs,
- legal/HR/finance files mixed into the same workspace.

**Control:** keep sensitive documents and credentials outside the coding workspace; use separate repos and profiles.

### Auto-apply edits

An assistant that can rewrite multiple files quickly can introduce:

- auth bypass,
- hidden telemetry,
- weakened CSP/CORS,
- insecure dependency additions,
- silent deletion of security checks.

**Control:** require diff review and CI before merge; do not accept blind "fix all" edits on auth, infra, CI, secrets, or payment code.

### Extension marketplace risk

An IDE extension can be just as dangerous as an MCP server if it has workspace, terminal, or network permissions.

**Control:** maintain an approved extension list, review updates, and avoid random community extensions on admin-capable workstations.

---

## 5. No-Code and Low-Code Risks

No-code platforms often hide code, but they do not remove security responsibilities. They move them.

**Common failure modes:**

- public app or preview URL exposed without authentication,
- direct binding to production tables without object-level authorization,
- connector authenticated with a founder's personal Google or Microsoft account,
- OAuth tokens with excessive scopes,
- webhook endpoint without signature verification or replay protection,
- workflow triggered by untrusted inbound email or form data,
- secrets stored in plain text fields visible to many editors,
- business logic existing only in a visual editor with no version control or peer review,
- admin actions hidden in the UI but not actually protected server-side,
- no tested backup/export path for critical automations.

**Rule:** if the tool can read or modify production data, treat it like production code.

---

## 6. Connectors, OAuth, Webhooks, and Service Accounts

- Use dedicated service accounts, not a founder's personal account.
- Scope tokens to the minimum API permissions needed.
- Record owner, purpose, expiry, and dependent workflows for each connector.
- Review and revoke unused connectors regularly.
- Verify webhook signatures, timestamps, and idempotency.
- Allowlist outbound destinations for server-side fetch or webhook forwarding steps.
- Do not let a single no-code workflow hold broad access to CRM, finance, ticketing, storage, and email unless there is a clear justification.

**Connector inventory fields:**

| Field | Expected |
|-------|----------|
| Connector name | Yes |
| Owner | Yes |
| Service account vs personal account | Yes |
| Scope summary | Yes |
| Environments using it | Yes |
| Expiry / rotation date | Yes |
| Data types touched | Yes |

---

## 7. Publish and Environment Controls

- Require approval before promoting from dev to staging or prod.
- Use separate credentials per environment.
- Protect preview links with authentication when possible.
- Turn off sample/demo data exposure before publish.
- Do not let builders write directly to production databases without a reviewed access pattern.
- Mirror important artifacts to Git or scheduled exports so you can diff, back up, and recover them.
- Test rollback, not only publish.

**Minimum release gate for AI/no-code apps:**

| Check | Expected |
|-------|----------|
| Auth enabled on app / preview | Yes |
| RBAC or ownership checks verified | Yes |
| Secrets not exposed client-side | Yes |
| Webhooks verified | Yes |
| Logs and analytics reviewed for PII | Yes |
| Backup/export path tested | Yes |

---

## 8. Data, Privacy, and Prompt Hygiene

- Classify data before connecting it to an AI assistant or no-code workflow.
- Mask or synthesize personal data for demos, prompting, and template generation.
- Do not use unrestricted knowledge-base uploads for contracts, HR records, support exports, or customer dumps.
- Review whether provider settings allow prompt retention, training reuse, team-wide memory, or broad sharing.
- Keep AI chat history and workspace memory out of privileged incident-response or legal-review material unless specifically approved.
- If the platform provides sharing links, treat them as data disclosures until proven otherwise.

Related guides: `privacy-data-minimization.md`, `gdpr-security-ops.md`.

---

## 9. Mandatory Human Review Areas

Even if the tool "looks right", require manual review for:

- authentication and session logic,
- authorization / RBAC / row-level filtering,
- payment and billing flows,
- file upload and storage rules,
- webhook receivers and outbound HTTP calls,
- database schema changes and data migrations,
- deletion / retention / GDPR flows,
- security headers, CSP, and CORS,
- CI/CD, cloud IAM, and infrastructure definitions.

If the tool generated one of these areas and nobody reviewed it manually, treat the work as **unfinished**.

---

## 10. 7-Day Rollout

### Day 1

- Inventory every AI CLI, IDE assistant, browser builder, and no-code platform in use.
- Remove personal-account ownership from any production workflow or connector.
- Turn on MFA and SSO for the highest-risk tools first.

### Days 2-3

- Separate dev/staging/prod environments and credentials.
- Replace production datasets in prompts/builders with masked or synthetic data.
- Review extension/plugin/connector inventory and remove unknown items.

### Days 4-5

- Add release gates: human approval, tests, secret scan, and auth review before publish.
- Enable audit logs and export them if supported.
- Document webhook verification and connector ownership.

### Days 6-7

- Test one incident scenario: compromised AI tool account, leaked connector token, or public preview exposure.
- Test one restore/export path for a critical no-code workflow or app.

---

## 11. Quick Checklist

```
[ ] Separate personal and business identities
[ ] SSO + phishing-resistant MFA on high-risk tools
[ ] Dev/staging/prod split
[ ] Synthetic or masked data in prompts/builders
[ ] No public preview without auth
[ ] No personal account owning production connectors
[ ] Webhooks signed and replay-protected
[ ] Secrets not stored client-side or in shared prompts
[ ] Versioned export or Git sync exists
[ ] Human review on auth, RBAC, data deletion, payments, infra
```

---

## References

- `ai-cli-hardening.md`
- `quick-start-ai-coding.md`
- `mcp-security.md`
- `privacy-data-minimization.md`
- `gdpr-security-ops.md`
- `incident-playbooks.md`
