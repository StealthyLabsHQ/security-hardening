# Social Engineering & Physical Security

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Recommended | Automation: Partial (DMARC/SPF/DKIM automatable; phishing simulation manual)


The most robust technical controls can be bypassed by manipulating a person. Human-layer attacks are consistently the initial access vector in major breaches.

---

## Phishing & Spear Phishing

**What attackers do**

- Send emails impersonating trusted entities (IT helpdesk, CEO, bank, SaaS vendors).
- Clone login pages to harvest credentials.
- Send malicious attachments (Office macros, ISO files, LNK files).
- Use adversary-in-the-middle (AiTM) proxies to bypass MFA on legacy auth flows.

**Defenses**

- Deploy **email authentication**: SPF, DKIM, and DMARC (policy: `p=reject`).
- Enable **anti-phishing policies** in your email gateway (Microsoft Defender, Proofpoint, Mimecast).
- Use **phishing-resistant MFA**: FIDO2/WebAuthn or certificate-based auth. TOTP codes are bypassable by AiTM.
- Run **simulated phishing campaigns** (GoPhish, KnowBe4) at least quarterly to measure and train employees.
- Train employees to report suspicious emails to a dedicated mailbox rather than just deleting them.

**Email authentication quick setup**

```
# SPF - authorize your mail servers
v=spf1 include:_spf.google.com ~all

# DMARC - enforce and get reports
_dmarc.yourdomain.com TXT "v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com"
```

---

## CEO Fraud / Business Email Compromise (BEC)

Attackers impersonate executives to request urgent wire transfers or IBAN changes.

**Defenses**

- Establish an **out-of-band verification process**: any request to change a bank account or initiate a transfer above a threshold requires a phone call to a pre-registered number (not a number provided in the email).
- Never act on financial instructions received only by email, regardless of apparent sender.
- Flag emails from external domains that use internal display names (most email gateways support this).
- Enable DMARC to prevent spoofing of your own domain.

---

## Vishing (Voice Phishing)

Attackers call employees impersonating IT support or executives, requesting password resets, MFA codes, or VPN access.

**Defenses**

- Establish a callback verification procedure: IT support always calls back on a number the employee can verify independently.
- Never read out MFA codes over the phone (legitimate IT will never ask for this).
- Verify identity via company directory before acting on any sensitive request.

---

## Physical Security

**Clean Desk Policy**

- No confidential documents left on desks when unattended.
- Sensitive documents printed only when necessary; collected immediately and shredded when done.
- Lock workstations when leaving the desk (Win+L / Cmd+Ctrl+Q) - enforced via GPO auto-lock (5-10 min).

**Access Control**

- Badge-based access control for all office areas; sensitive zones (server rooms, finance) require separate clearance.
- Tailgating / piggybacking prevention: enforce one-person-one-badge turnstiles for high-security zones.
- Never grant physical access to unknown visitors without escort.
- Visitor badges should be visually distinct and surrendered on exit.

**Device Security**

- Laptop screens should use privacy filters in public spaces.
- Enable Secure Boot and BIOS password to prevent boot-from-USB attacks.
- USB port restrictions: use endpoint management to block unauthorized USB storage devices.
- Lost or stolen devices must be remotely wiped immediately (MDM policy).

---

## Security Awareness Program

| Activity | Frequency |
|----------|-----------|
| Simulated phishing campaigns | Quarterly |
| Security awareness training | Annual (minimum) |
| Tabletop incident response exercises | Annual |
| New employee security onboarding | On hire |
| Reminder on BEC / fraud procedures | After any near-miss or industry incident |

**Metrics to track**

- Phishing simulation click rate (target: below 5%)
- Phishing report rate (employees who reported the simulation)
- Mean time to report a real suspicious email
- Number of security incidents attributed to human error

---

## Audit Checklist

| Check | Expected |
|-------|----------|
| SPF, DKIM, DMARC (p=reject) configured | Yes |
| Phishing-resistant MFA deployed | Yes |
| Simulated phishing run in last 90 days | Yes |
| Out-of-band verification for wire transfers | Yes |
| Auto-lock enforced via GPO (<=10 min) | Yes |
| USB storage blocked on managed endpoints | Yes |
| Clean Desk Policy documented and communicated | Yes |
| Server room access restricted by badge | Yes |
| Remote wipe capability for all laptops | Yes |

**Tools**

| Tool | Purpose |
|------|---------|
| GoPhish | Open source phishing simulation |
| Social Engineer Toolkit (SET) | Phishing and vishing simulation framework |
| Have I Been Pwned (HIBP) | Check if employee emails appear in breach data |
| MXToolbox | SPF / DKIM / DMARC diagnostic |
