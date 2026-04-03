# Endpoint & Office Macro Security

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Recommended | Automation: Partial (CIS-CAT, OSQuery; macro signing policy manual)


## VBA / Office Macros

**Quick Wins**

- Block macros from the internet by enforcing Mark-of-the-Web (MotW) checks via Group Policy:
  `User Configuration > Administrative Templates > Microsoft Office > Security Settings > Block macros from running in Office files from the internet`
- Require all internal macros to be digitally signed with a company certificate. Only trusted publishers run without prompt.
- Enable AMSI (Anti-Malware Scan Interface) integration so AV solutions can inspect VBA, PowerShell and VBScript executed in memory.

**Dangerous VBA patterns to flag**

```vb
' Command execution
Shell "cmd.exe /c " & userInput       ' command injection
CreateObject("WScript.Shell").Run cmd ' same

' Download & execute
CreateObject("MSXML2.XMLHTTP")        ' HTTP from macro
CreateObject("ADODB.Stream")          ' write file to disk

' Disabling security from within a macro
Application.AutomationSecurity = msoAutomationSecurityLow
```

**Safe alternatives**

- Use Power Automate or approved internal APIs instead of Shell/WScript.
- Validate and sanitize any cell value used as input to macro logic.
- Log macro execution via Office telemetry or audit logs.

---

## Endpoint Hardening

**Quick Wins**

- Remove local administrator rights from standard users. Use a dedicated admin account for IT tasks only.
- Enable automatic screen lock (5-10 min idle) via GPO.
- Enforce full-disk encryption (BitLocker on Windows, FileVault on macOS).

**Long Term**

- Deploy **AppLocker** or **Windows Defender Application Control (WDAC)** to whitelist approved executables and block unknown binaries.
- Enable **Credential Guard** (Windows 10+) to protect LSASS from credential dumping (Mimikatz-style attacks).
- Deploy **EDR** (Endpoint Detection & Response) for behavioural detection beyond signature-based AV.
- Patch management: enforce critical patches within 72h, all others within 30 days.

**Audit checklist**

| Check | Expected |
|-------|----------|
| Macros from internet blocked | Yes (GPO enforced) |
| Internal macros signed | Yes |
| Local admin rights for standard users | No |
| BitLocker / FileVault enabled | Yes |
| AppLocker / WDAC policy active | Yes |
| EDR deployed on all endpoints | Yes |
| Auto-lock on idle | Yes (<=10 min) |

**Tools**

| Tool | Purpose |
|------|---------|
| Microsoft Attack Surface Analyzer | Baseline endpoint hardening |
| Sysinternals Autoruns | Detect persistence mechanisms |
| CIS-CAT Lite | Benchmark compliance scan |
| OSQuery | Endpoint visibility and audit |
