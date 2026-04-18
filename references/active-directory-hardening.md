---
title: "Active Directory & Entra ID Hardening"
slug: active-directory-hardening
category: iam
depth: 2
audit_level: [3, 4]
last_reviewed: 2026-04-03
sources:
  - "Microsoft Windows LAPS"
  - "Microsoft Entra ID documentation"
triggers_strong: ["active directory", "entra id", "kerberos", "laps"]
triggers_weak: ["identity hardening", "directory security"]
related: ["cloud-iam-hardening", "authorization-rbac"]
---

# Active Directory & Entra ID Hardening

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Recommended | Automation: Partial (BloodHound, PingCastle; PIM and Conditional Access manual)


## Privilege Architecture (Tiering Model)

Never let Tier 0 (Domain Controllers, PKI, AD Connect) admins log into Tier 1 (servers) or Tier 2 (workstations) machines. A compromised workstation must not allow lateral movement to the domain.

```
Tier 0 - Domain Controllers, AD, PKI, Azure AD Connect
Tier 1 - Member servers, applications
Tier 2 - Workstations, endpoints
```

- Use separate admin accounts per tier (e.g. `john.doe` for daily use, `adm-jdoe-t1` for server admin, `adm-jdoe-t0` for domain admin).
- Restrict logon rights with GPO (`Deny log on locally`, `Deny access to this computer from the network`) per tier.
- Enable **Protected Users** security group for all Tier 0 accounts (disables NTLM, DES, RC4, credential caching).

---

## Local Administrator Password Solution (LAPS)

- Deploy **Microsoft LAPS** (or Windows LAPS built into Windows Server 2022 / Win 11) to generate unique, rotating local admin passwords per machine.
- Store passwords in AD attribute, accessible only to delegated IT accounts.
- Rotate on a schedule (30 days recommended) and immediately after use.

---

## Weak Protocol Deprecation

Attackers use legacy protocols for credential theft (Pass-the-Hash, LLMNR poisoning, relay attacks).

| Protocol | Risk | Action |
|----------|------|--------|
| NTLMv1 | Pass-the-Hash, easily cracked | Disable via GPO |
| SMBv1 | EternalBlue (WannaCry/NotPetya) | Disable via GPO / PowerShell |
| LLMNR | Credential poisoning (Responder) | Disable via GPO |
| NBT-NS | Same as LLMNR | Disable via GPO |
| WPAD | Proxy credential hijacking | Disable via GPO |

```powershell
# Disable SMBv1
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force

# Disable LLMNR (GPO path)
# Computer > Admin Templates > Network > DNS Client > Turn off multicast name resolution = Enabled

# Disable NTLMv1 (GPO path)
# Security Settings > Local Policies > Security Options
# Network security: LAN Manager authentication level = NTLMv2 only
```

---

## Kerberos & Privileged Access

- **Kerberoasting mitigation:** use long (25+ chars), random service account passwords; prefer Group Managed Service Accounts (gMSA).
- **AS-REP Roasting mitigation:** never disable "Kerberos pre-authentication required" unless explicitly needed.
- **Privileged Access Workstations (PAW):** dedicated hardened machines for Tier 0/1 admin tasks only (no email, no browsing).
- Enable **audit logging** for AD changes: account creation/deletion, group membership changes, GPO modifications.

---

## Entra ID (Azure AD) Specifics

- Enable **Conditional Access** policies: block legacy auth protocols, require MFA for all admin accounts, require compliant device for sensitive apps.
- Enable **Privileged Identity Management (PIM):** just-in-time elevation for Global Admin and other privileged roles (no standing permissions).
- Monitor **risky sign-ins** via Entra ID Protection (impossible travel, leaked credentials, unfamiliar locations).
- Disable legacy authentication in Exchange Online and all Microsoft 365 services.

---

## Audit Checklist

| Check | Expected |
|-------|----------|
| Tiering model enforced via GPO | Yes |
| LAPS deployed on all workstations | Yes |
| SMBv1 disabled | Yes |
| LLMNR / NBT-NS disabled | Yes |
| NTLMv1 disabled | Yes |
| Protected Users group used for Tier 0 | Yes |
| gMSA used for service accounts | Yes |
| PIM enabled for privileged Entra roles | Yes |
| Conditional Access requires MFA for admins | Yes |

**Tools**

| Tool | Purpose |
|------|---------|
| BloodHound (Community) | AD attack path analysis |
| PingCastle | AD risk assessment and scoring |
| Microsoft Entra ID Protection | Risky sign-in detection |
| Purple Knight | AD security posture assessment |

