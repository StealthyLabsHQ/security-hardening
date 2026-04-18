---
title: "MDM Baselines: Intune, Jamf & Kandji"
slug: mdm-baselines-intune-jamf-kandji
category: platform
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-19
sources:
  - "Microsoft Intune security baselines"
  - "Apple Platform Security"
  - "Apple Platform Deployment"
  - "Jamf compliance and configuration guidance"
  - "Kandji device management guidance"
  - "CIS Benchmarks"
triggers_strong: ["intune baseline", "jamf baseline", "kandji baseline", "mdm review", "device compliance policy"]
triggers_weak: ["mdm", "device management", "endpoint baseline"]
related: ["secure-workstation-builds", "browser-isolation-and-profile-segmentation", "developer-workstation-secrets-and-local-ai"]
---

# MDM Baselines: Intune, Jamf & Kandji

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 2-4 | Automation: Partial (device compliance, encryption escrow, patch state, app inventory, and baseline drift largely automatable; exception approval, workflow fit, and high-trust role segmentation manual)

Use this guide when building or reviewing **managed endpoint baselines** with Microsoft Intune, Jamf, or Kandji.

The goal is not to turn MDM into a checkbox. The goal is to make device trust measurable: a workstation should only receive high-value access if its encryption, patching, browser posture, local privilege, and security tooling meet minimum standards.

---

## 1. Core rule

If a workstation cannot prove a minimum trust state centrally, treat it as an exception device and reduce what it can access.

MDM should enforce or verify at least:

- device identity and ownership,
- disk encryption,
- patch currency,
- screen lock,
- endpoint security tooling,
- local admin posture,
- browser baseline,
- wipe / lock capability,
- inventory and drift visibility.

For higher-trust users, MDM should also help enforce role separation and stronger conditional access.

---

## 2. Device classes to baseline differently

| Device class | Typical user | Why separate baseline matters |
|---|---|---|
| Standard corporate workstation | office, product, support | broad SaaS use, phishing risk, general browser exposure |
| Developer workstation | engineers with code and cloud access | secret sprawl, toolchain risk, local AI and container risk |
| Admin workstation | identity, cloud, security, finance admins | privileged session theft and prod blast radius |
| Shared or kiosk device | frontline or controlled environment | session hygiene and physical exposure |
| BYOD or lightly managed device | contractor or edge case | weaker control proof, should receive narrower access |

Do not use the same compliance gate for a standard laptop and a production admin workstation.

---

## 3. Minimum control domains

| Domain | Minimum expectation |
|---|---|
| Enrollment | device is in inventory, tied to owner, and not orphaned |
| Encryption | BitLocker, FileVault, or equivalent enabled with recovery process |
| Patch state | OS and browser versions within supported window |
| Endpoint protection | Defender or approved EDR present and healthy |
| Local privilege | standard user by default, admin rights controlled separately |
| Browser | managed baseline, extension control, profile separation for privileged use |
| App control | approved apps and install sources defined |
| Secrets and AI tooling | local high-risk tooling governed for dev/admin populations |
| Response | remote lock, wipe, and lost-device path documented |

---

## 4. Compliance gate model

A useful MDM posture should drive access decisions.

### 4.1 Good model

- device fails encryption -> cannot access high-trust apps,
- device misses critical patch window -> limited or blocked privileged access,
- device lacks EDR -> remediation queue and conditional access impact,
- unmanaged browser or extension posture on admin device -> prod admin access withheld,
- missing owner or stale device -> disable or quarantine.

### 4.2 Weak model

- MDM exists but only inventories devices,
- compliance rules generate alerts with no access consequence,
- exceptions never expire,
- admin and developer devices get the same browser and privilege baseline,
- local AI tooling or dev tools are invisible to policy.

---

## 5. Intune patterns

Use Intune strongly where identity-driven device access matters.

### 5.1 High-value controls

- device compliance policies tied to Conditional Access,
- BitLocker status and recovery escrow,
- Microsoft Defender health and attack-surface reduction posture,
- local admin governance via endpoint privilege management or equivalent,
- Windows security baselines for firewall, SmartScreen, Defender, Office, and browser posture,
- app protection and approved app deployment for managed populations.

### 5.2 Review questions

- Are privileged apps gated on compliant devices only?
- Are admin users prevented from routine work on non-compliant endpoints?
- Are BitLocker keys escrowed and recoverable securely?
- Are local admin exceptions time-bound and approved?
- Are browsers and extensions centrally governed on high-trust devices?

### 5.3 Intune red flags

- compliance policy not connected to Conditional Access,
- devices marked compliant without EDR health,
- permanent local admin for broad engineering groups,
- unmanaged developer scripts used to bypass baseline deployment,
- privileged admins allowed from stale or personal devices.

---

## 6. Jamf patterns

Jamf is strong for Apple fleet posture when configuration profiles, escrow, and app controls are used consistently.

### 6.1 High-value controls

- FileVault enforcement with key escrow,
- OS update and deferral policy aligned to support window,
- configuration profiles for password, screen lock, firewall, browser, and privacy controls,
- managed app deployment and removal,
- local admin management and separate admin workflow,
- inventory visibility for security tooling and browser posture.

### 6.2 Review questions

- Is FileVault universal for managed macOS devices?
- Are browser extensions and profiles governed for admin populations?
- Are PPPC/TCC permissions tightly scoped for security tools and developer tooling?
- Are unmanaged apps or sideloading paths visible and controlled?
- Are engineering exceptions documented with owner and expiry?

### 6.3 Jamf red flags

- FileVault optional on laptops with source code or admin access,
- stale macOS versions tolerated indefinitely,
- privacy permissions granted broadly to many tools without review,
- local admin normalized for convenience,
- browser segmentation guidance left purely to user behavior.

---

## 7. Kandji patterns

Kandji is useful for opinionated Apple device baselines when teams want blueprint-driven enforcement with lighter operational overhead.

### 7.1 High-value controls

- Blueprints by device role,
- FileVault enforcement and recovery flow,
- managed app lifecycle,
- automated remediation for drift,
- local admin and privilege workflow,
- rapid rollout of baseline changes for browser and workstation controls.

### 7.2 Review questions

- Are Blueprints split by developer, standard, and admin device roles?
- Are remediations actually enforced or only reported?
- Are security-relevant apps and configurations tracked centrally?
- Are exception devices visible and re-reviewed?
- Is the Apple admin population separated from standard users at the device-policy level?

### 7.3 Kandji red flags

- one blueprint for every device role,
- recovery and encryption posture not tested,
- local admin grants without expiry,
- no clear tie between device state and access to privileged SaaS,
- reliance on MDM inventory alone without browser and secrets posture review.

---

## 8. Controls that matter most for developer and admin devices

### 8.1 Developer workstations

Baseline should also account for:

- shell and secret sprawl,
- container and VM tooling,
- local AI assistants and IDE plugins,
- browser upload/download risk,
- package manager and developer tool install paths.

Use `developer-workstation-secrets-and-local-ai.md` and `secure-workstation-builds.md` with the MDM baseline.

### 8.2 Admin workstations

Require stronger controls such as:

- separate privileged browser or OS context,
- phishing-resistant MFA,
- tighter local app allowlisting,
- shorter patch tolerance,
- more restrictive extension posture,
- stronger response workflow for non-compliance.

A compliant admin workstation should be harder to drift than a general-purpose user laptop.

---

## 9. Exception management

MDM exceptions are not harmless paperwork. They are alternate trust paths.

Every exception should record:

- device identifier,
- owner,
- control bypassed,
- business justification,
- compensating control,
- expiry date,
- reviewer.

High-risk exceptions include:

- encryption disabled,
- EDR absent,
- local admin permanently granted,
- browser controls disabled for privileged user,
- unsupported OS still allowed into admin portals.

---

## 10. Common failure modes

| Failure | Why it matters |
|---|---|
| MDM only inventories devices | no meaningful trust enforcement |
| one baseline for all device roles | privileged users get under-protected endpoints |
| compliance policy detached from access control | findings do not reduce exposure |
| browser and extension posture unmanaged | most exposed application stays outside baseline |
| developer-specific risks omitted | secrets and AI tooling escape policy visibility |
| exceptions never expire | temporary risk becomes permanent posture |
| lost-device actions untested | remote response fails when needed most |

---

## 11. First audit questions

Ask these first when reviewing an MDM deployment:

1. Which controls are enforced versus merely reported?
2. What happens when a device becomes non-compliant?
3. Are developer and admin devices treated differently from standard devices?
4. Can privileged SaaS or cloud access be blocked on failing devices?
5. Are encryption and recovery processes tested?
6. Are browser posture, extensions, and local AI tooling included in baseline decisions?
7. Is there an exception register with expiry and review?

If the answer to most of these is "manual" or "best effort," the MDM program is not mature enough for high-trust access.

---

## 12. Review checklist

| Check | Expected |
|---|---|
| Device inventory has clear owner and lifecycle state | Yes |
| Encryption is enforced and recovery handled centrally | Yes |
| Patch and EDR posture influence access decisions | Yes |
| Local admin is controlled and exception-based | Yes |
| Browser baseline exists for privileged roles | Yes |
| Developer and admin devices have differentiated controls | Yes |
| Exception handling is time-bound and reviewable | Yes |
| Lost or stolen device response is tested | Yes |

---

## Resources

- `secure-workstation-builds.md`
- `browser-isolation-and-profile-segmentation.md`
- `developer-workstation-secrets-and-local-ai.md`
