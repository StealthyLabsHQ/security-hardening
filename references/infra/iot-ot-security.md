---
title: "IoT & OT Security"
slug: iot-ot-security
category: infra
depth: 2
audit_level: [3, 4]
last_reviewed: 2026-04-21
sources:
  - "NIST SP 800-82 Rev.3 Final — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf (2023-09)"
  - "CISA ICS advisories — https://www.cisa.gov/topics/industrial-control-systems"
  - "MITRE ATT&CK for ICS — https://attack.mitre.org/matrices/ics/"
  - "IEC 62443 — https://www.iec.ch/cyber-security"
triggers_strong: ["ot security", "industrial network", "purdue model", "ics"]
triggers_weak: ["iot security", "operational technology"]
related: ["detection-engineering", "incident-playbooks"]
---

# IoT & OT / Industrial Network Security

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Context-Dependent | Automation: Partial (Zeek/Nozomi passive monitoring; OT IR manual)


---

## Network Segmentation (Purdue Model)

The Purdue Model defines zones to isolate IT (business) networks from OT (operational) networks. A ransomware infection on a business workstation must never reach a PLC or industrial controller.

```
Level 5 - Enterprise Network (ERP, email, internet)
Level 4 - Site Business Network (SCADA historian, remote access)
          ---- DMZ (data diode, unidirectional gateway) ----
Level 3 - Site Operations (SCADA servers, HMI servers)
Level 2 - Area Control (DCS, batch control, SCADA)
Level 1 - Basic Control (PLCs, RTUs, drives)
Level 0 - Process (sensors, actuators)
```

**Key principles**

- No direct connectivity between Level 5 and Level 2 or below. All cross-zone communication goes through a DMZ.
- Use **data diodes** (unidirectional gateways) where only data flowing upward (from OT to IT) is needed (e.g. for monitoring).
- Any remote access to OT (vendor support, remote monitoring) must go through a dedicated, monitored jump server in the DMZ, with MFA and session recording.

---

## Default Credential Elimination

Default credentials on IoT devices (cameras, routers, switches, PLCs, HMIs) are the single most common initial access vector in OT incidents.

**Controls**

- Maintain an asset inventory of all connected devices. Never deploy a device without changing default credentials.
- Use a password manager or PAM solution to store and rotate device credentials.
- Scan for default credentials regularly (Shodan for internet-facing, Nmap scripts for internal).
- Disable or remove unused management interfaces (web UI, Telnet, SNMP v1/v2 with default community strings).

```bash
# Scan for default SNMP community strings
nmap -sU -p 161 --script snmp-brute 192.168.1.0/24

# Check for default HTTP credentials (example with hydra)
hydra -L default-users.txt -P default-passwords.txt http-get://192.168.1.100/
```

---

## Legacy Protocol Risks

OT environments run protocols designed for reliability and availability, not security. Treat all OT protocols as unauthenticated by default.

| Protocol | Risk | Mitigation |
|----------|------|-----------|
| Modbus TCP | No authentication, any host can send commands | Network-level ACLs; only allow known masters |
| DNP3 | Weak authentication (SAv5 optional) | Enable SAv5 if supported; monitor for unexpected sources |
| BACnet | No encryption, broadcast-based | Segment to dedicated VLAN; firewall from IT |
| PROFINET | No built-in auth | Isolate to dedicated switch; use DPI firewall |
| OPC-DA (DCOM) | Requires open firewall rules | Migrate to OPC-UA (has built-in auth/encryption) |
| Telnet | Cleartext credentials | Replace with SSH everywhere possible |

---

## Firmware & Patch Management

OT patching is more complex than IT - downtime windows are rare and patches can be limited.

**Controls**

- Maintain a firmware inventory with versions and known CVEs per device.
- Subscribe to vendor security advisories and ICS-CERT / CISA alerts.
- Test patches in a staging environment (or vendor sandbox) before production.
- For devices that cannot be patched: apply **virtual patching** at the network level (IDS rules, ACLs).
- Enforce code signing for firmware updates where the device supports it.

---

## Monitoring & Anomaly Detection

In OT, normal traffic is extremely predictable (fixed devices, fixed protocols, fixed timing). Any deviation is suspicious.

**Controls**

- Deploy a **passive OT monitoring** solution that learns normal baselines without disrupting operations.
- Alert on: new devices appearing on the network, new protocol types, commands to PLCs outside normal maintenance windows, unusual data volumes.
- Forward OT logs to your SIEM while maintaining an air-gapped backup of critical logs.

**Tools**

| Tool | Purpose |
|------|---------|
| Claroty / Dragos / Nozomi Networks | Commercial OT monitoring (passive) |
| Zeek + ICS parsers | Open source network monitoring with OT protocol support |
| OSSIM / Wazuh | Open source SIEM with OT log ingestion |

---

## Incident Response in OT Environments

OT IR differs from IT because **safety takes priority over containment**.

- Never isolate or shut down a device that controls a physical process without approval from operations engineering.
- Define a **kill switch procedure** in advance: who authorizes taking a process offline, and what manual fallback exists.
- Maintain an **offline, printed network diagram** - during a cyber incident, IT systems used to access documentation may be offline.
- Coordinate with safety engineers before executing any IR action on Level 1 or Level 0 devices.

---

## Audit Checklist

| Check | Expected |
|-------|----------|
| IT / OT network segmentation with DMZ | Yes |
| No direct internet access for OT devices | Yes |
| Default credentials changed on all devices | Yes |
| Asset inventory maintained and current | Yes |
| SNMP v1/v2 with default communities disabled | Yes |
| Remote access via MFA + jump server + session recording | Yes |
| Firmware inventory with CVE tracking | Yes |
| Passive OT monitoring deployed | Yes |
| Tabletop OT incident response exercise done in last year | Yes |

**Resources**

- NIST SP 800-82 Rev 3 - Guide to OT Security
- IEC 62443 - Industrial Automation and Control Systems Security
- CISA ICS advisories - https://www.cisa.gov/news-events/ics-advisories
- MITRE ATT&CK for ICS - https://attack.mitre.org/matrices/ics/

