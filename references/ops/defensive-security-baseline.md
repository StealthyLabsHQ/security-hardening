---
title: "Defensive Security Baseline"
slug: defensive-security-baseline
category: ops
depth: 2
audit_level: [1, 2, 3]
last_reviewed: 2026-04-21
sources:
  - "CISA Cyber Essentials — https://www.cisa.gov/cyber-essentials"
  - "NIST Cybersecurity Framework 2.0 — https://www.nist.gov/cyberframework (2024-02)"
  - "CIS Controls v8.1 — https://www.cisecurity.org/controls/v8-1 (adds Govern function)"
triggers_strong: ["security baseline", "founder security", "workstation hardening", "small team security"]
triggers_weak: ["baseline hardening", "security checklist"]
related: ["security-improvements", "social-engineering-physical"]
---

# Defensive Security Baseline (Developers, Founders, and Small Teams)

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: Essential | Audit Level: 1-3 | Automation: Partial (device compliance, secret scanning, backup verification, and SaaS audit logs automatable; travel/opsec drills manual)

This is the "protect yourself first" guide. Use it when the main risk is not a rare 0-day in your codebase but phishing, stolen laptops, malicious browser extensions, leaked secrets, SaaS compromise, ransomware, BEC, or unsafe AI-assisted workflows.

Goal: reduce blast radius before an attacker reaches production, payroll, customer data, or executive communications.

---

## 1. Primary Threats to Assume by Default

| Threat | Typical impact | First control |
|--------|----------------|---------------|
| Phished primary email or SSO account | Full account takeover, password resets, SaaS compromise | Phishing-resistant MFA (FIDO2/passkeys) on priority accounts |
| Stolen laptop | Offline data exposure, session theft, credential reuse | Full-disk encryption, screen lock, remote wipe |
| Leaked API token / PAT | Repo compromise, CI abuse, cloud access | Scoped short-lived tokens, inventory, rotation |
| Ransomware | Work stoppage, data loss, extortion | 3-2-1 backups with one offline/immutable copy |
| Business email compromise (BEC) | Fraudulent payments, supplier impersonation | Out-of-band verification for payment/banking changes |
| Malicious AI prompt / tool output | Unsafe commands, data exfiltration, bad commits | Read-only default, approval gates, command allowlists |
| SaaS admin compromise | Large blast radius across tickets, code, docs, HR | SSO, least privilege, audit logs, break-glass control |

---

## 2. Identity and Recovery Baseline

Protect these accounts first: **primary email**, **password manager**, **GitHub/GitLab**, **cloud admin**, **banking/finance**, **domain registrar**, and any **SSO identity provider**.

- Use a password manager and unique random passwords everywhere.
- Prefer passkeys or FIDO2 security keys over SMS OTP.
- Keep a separate admin account from the account used for daily work.
- Remove SMS fallback where the service allows it.
- Store recovery codes offline in an encrypted location.
- Review active sessions, OAuth apps, PATs, and app passwords at least monthly.
- Do not share admin accounts. Create named accounts with role-based access.
- For founders and finance staff, require out-of-band approval for wire changes, payroll changes, and invoice bank detail changes.

**Minimum account baseline:**

| Control | Expected |
|---------|----------|
| Password manager in use | Yes |
| FIDO2/passkey on primary accounts | Yes |
| Separate privileged account | Yes |
| Recovery codes stored offline | Yes |
| Old sessions and tokens reviewed monthly | Yes |

---

## 3. Workstation Hardening

- Run only supported operating systems and enable automatic updates.
- Turn on full-disk encryption (`BitLocker`, `FileVault`, `LUKS`).
- Require screen lock after short inactivity (5 minutes is a practical default).
- Do not use a local administrator account for daily browsing, email, chat, or coding.
- Keep the endpoint firewall enabled.
- Keep built-in endpoint protection enabled (`Microsoft Defender`, macOS XProtect, etc.).
- Disable or tightly restrict Office macros and unsigned scripts.
- Use a dedicated **work browser profile** with the minimum set of extensions.
- Do not install random browser extensions on the same profile that has GitHub, cloud, or banking sessions.
- Use a separate VM or sacrificial environment for malware samples, untrusted PoCs, or hostile prompt-injection testing.
- Do not store secrets in plain text on the desktop, downloads folder, notes app, or shell history.

**High-value hardening for executives and admins:**

- Enroll corporate devices in MDM where possible.
- Require device compliance before access to admin portals.
- Use privacy screens and cable locks in travel-heavy roles.
- Keep a documented lost-device response procedure with remote wipe ownership.

---

## 4. Data Separation and Confidentiality

- Separate **personal** and **business** identities, browsers, and storage.
- Separate **production**, **staging**, and **development** credentials.
- Default to synthetic or masked datasets for development and demos.
- Classify information at least as: `Public`, `Internal`, `Confidential`, `Restricted`.
- Treat payroll, HR, legal, financial, customer exports, medical data, and identity documents as `Restricted`.
- Use expiring links and access-controlled storage for file sharing.
- Do not paste raw production secrets or unredacted customer data into chat tools, ticketing systems, or AI assistants.
- Keep a list of which third parties receive personal data and why.

**Rule of thumb:** if a file would trigger legal, customer, or reputational damage when leaked, it does not belong in an AI prompt or public issue tracker unredacted.

---

## 5. Communications and BEC Resistance

- Enforce SPF, DKIM, and DMARC with `p=reject` for company domains.
- Verify urgent requests for payment, payroll, invoice changes, or credential resets through a second trusted channel.
- Do not send passwords, recovery codes, or tokens in normal email or chat.
- Use one-time secret-sharing links for short-lived secrets.
- Verify meeting invitations and sign-in pages before entering credentials.
- Keep executives and finance staff on heightened anti-impersonation procedures.
- Separate public-facing email aliases from private admin/recovery addresses.

**Do not rely on:**

- "The request came from the CEO's mailbox"
- Caller ID only
- A PDF invoice attached to email
- A chat message that says "urgent" or "confidential"

---

## 6. Network, Travel, and Remote Work

- Update home/office router firmware and change default admin passwords.
- Disable WPS and UPnP unless you have a clear operational need.
- Use a separate guest or IoT network for unmanaged devices.
- Do not expose admin panels directly to the internet if VPN or zero-trust access is available.
- Require MFA for all remote admin access.
- On public Wi-Fi, prefer a personal hotspot or a trusted VPN path.
- Disable auto-join to unknown wireless networks.
- Never leave laptops or hardware tokens unattended during travel.
- If your threat model includes customs or targeted surveillance, use a travel profile or travel device with minimum data.

---

## 7. Backups and Ransomware Resilience

- Follow **3-2-1**: three copies, two media types, one offline or immutable.
- Encrypt backups at rest and in transit.
- Test restore, not just backup creation.
- Back up more than files: include password vault export procedures, infrastructure as code state, SaaS exports, critical contracts, and finance records.
- Protect backup credentials separately from the primary workstation.
- Define recovery priorities: source code, identity systems, financial systems, and customer support data usually come first.

**Restore test checklist:**

| Check | Expected |
|-------|----------|
| Last successful backup known | Yes |
| Restore tested in the last quarter | Yes |
| Backup encryption keys recoverable | Yes |
| Offline or immutable copy exists | Yes |
| Recovery owner named | Yes |

---

## 8. SaaS, Cloud, and AI Tool Hardening

- Prefer SSO + SCIM over local passwords in each SaaS product.
- Enforce least privilege and remove unused admin roles quickly.
- Use short-lived, scoped API tokens with owners and expiry dates.
- Keep audit logs enabled and export them if the plan allows.
- Maintain an approved vendor list for tools that touch code, docs, tickets, or personal data.
- Review vendor DPA, subprocessor list, breach notification terms, and data location.
- Use separate tenants, projects, or workspaces for production vs. non-production where possible.
- Keep a monitored break-glass account with strong controls and offline recovery steps.

**For AI coding and agent tools:**

- Start read-only.
- Disable network access unless the task requires it.
- Allowlist commands and domains.
- Never let an agent push, deploy, delete, or change permissions autonomously in production.
- Treat copied web pages, issue text, and MCP content as untrusted input.
- Prefer project-scoped context over "load my whole machine" behavior.

Related guides: `quick-start-ai-coding.md`, `ai-cli-hardening.md`, `llm-agent-security.md`, `mcp-security.md`.

---

## 9. Incident Readiness

Have one-page playbooks for at least:

- phished mailbox or identity provider account,
- lost or stolen laptop,
- leaked Git token or cloud credential,
- ransomware on a workstation,
- fraudulent finance request / BEC attempt,
- suspected exposure of personal data.

Operational expectations:

- Keep a current inventory of devices, critical accounts, admin users, tokens, and SaaS owners.
- Preserve logs and evidence before wiping systems.
- Know who owns legal/privacy escalation if personal data is involved.
- Pre-write internal and external communication templates.
- Keep emergency contacts outside the potentially compromised system.

---

## 10. Rollout Plan

### First 30 minutes

- Protect primary email, password manager, GitHub, cloud admin, and finance accounts with phishing-resistant MFA.
- Turn on full-disk encryption and auto-lock on every active workstation.
- Revoke old PATs, unused sessions, and unknown OAuth apps.
- Separate work and personal browser profiles.

### First 7 days

- Remove daily local admin usage.
- Test one encrypted backup restore.
- Harden the router / remote access path.
- Document an out-of-band payment verification process.
- Inventory SaaS admins, tokens, and data flows.

### First 30 days

- Standardize SSO, password manager usage, and recovery procedures.
- Introduce synthetic data for development where possible.
- Put AI tools under an approval and allowlist policy.
- Run a tabletop exercise for phishing + token leak + lost laptop.
- Review DPAs and subprocessors for tools handling customer or employee data.

---

## Resources

- `social-engineering-physical.md`
- `secret-leak-prevention.md`
- `privacy-data-minimization.md`
- `incident-playbooks.md`
- `ai-cli-hardening.md`
- `ai-agent-incident-response.md`

