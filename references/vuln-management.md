# Vulnerability Management Process

> Last reviewed: 2026-04-03 | Next review: 2026-10-03 | Priority: Recommended | Audit Level: 3 | Automation: Partial (SAST/SCA/DAST generate findings; triage, risk acceptance, and exceptions require human judgment)

A vulnerability management process turns scanner output into prioritized action. Without it, teams either fix everything indiscriminately (burnout) or nothing at all (exposure). This file covers the full lifecycle: triage, SLA, false positives, compensating controls, risk acceptance, and exception documentation.

---

## 1. Vulnerability Lifecycle

```
Discovered -> Triaged -> Assigned -> Remediated -> Verified -> Closed
                |                                      |
                v                                      v
           False Positive                     Risk Accepted / Exception
           (document + close)                 (document + review date)
```

**Sources of vulnerability findings:**

| Source | Type | Volume | Signal Quality |
|--------|------|--------|----------------|
| SAST (Semgrep, Bandit, Gosec) | Code | High | Medium (false positive rate ~30-50%) |
| SCA / dependency scan (Trivy, npm audit) | Dependencies | Medium | High (CVEs are confirmed) |
| DAST (OWASP ZAP) | Runtime | Low | High (confirmed exploitable in your app) |
| Container scan (Trivy image) | OS + packages | High | Medium (many base image CVEs not exploitable) |
| Manual pentest / bug bounty | Various | Low | Very high (researcher-confirmed) |
| Secret scan (Gitleaks, TruffleHog) | Secrets | Low | Very high (fix immediately, no exceptions) |

---

## 2. Severity Classification

Use CVSS v3.1 as the base, then adjust for your context (exploit availability, internet exposure, data sensitivity).

| Severity | CVSS Score | Effective Risk Adjustment |
|----------|-----------|--------------------------|
| **Critical** | 9.0-10.0 | Actively exploited in the wild, or exposes credentials/PII at scale |
| **High** | 7.0-8.9 | Remote code execution or auth bypass without mitigating factors |
| **Medium** | 4.0-6.9 | Requires authentication or unusual conditions to exploit |
| **Low** | 0.1-3.9 | Minimal impact or very limited exploitability |
| **Informational** | N/A | Best practice deviation, no direct exploitability |

**Context factors that increase severity:**

- Internet-facing (vs. internal only) - bump up one level
- Handles PII, payment data, or credentials - bump up one level
- No authentication required to reach the vulnerable component - bump up one level
- Public exploit or CVE with known weaponization - treat as Critical regardless of CVSS

**Context factors that decrease severity:**

- Vulnerability requires local access on a hardened system
- Defense-in-depth controls make exploitation impractical
- Component is scheduled for replacement within 30 days

---

## 3. Remediation SLA

SLAs must be enforced by automated tracking, not by goodwill.

| Severity | Acknowledge | Remediate | Re-verify |
|----------|-------------|-----------|-----------|
| **Critical** | 4 hours | 24 hours | 24 hours after fix |
| **High** | 24 hours | 7 days | 7 days after fix |
| **Medium** | 3 days | 30 days | 30 days after fix |
| **Low** | 7 days | 90 days | Next quarterly review |
| **Informational** | Next sprint | Best effort | Annual review |

**Exceptions require written approval** from the security lead or CISO before the SLA expires (see Section 6).

**Track SLA compliance:**

```python
# Example: automated SLA breach detection
from datetime import datetime, timedelta

SLA_DAYS = {
    "critical": 1,
    "high": 7,
    "medium": 30,
    "low": 90,
}

def check_sla_breach(vuln):
    sla = SLA_DAYS.get(vuln.severity.lower())
    if not sla:
        return False
    deadline = vuln.discovered_at + timedelta(days=sla)
    return datetime.utcnow() > deadline and vuln.status not in ("closed", "accepted", "false_positive")

# Report breached SLAs daily
breached = [v for v in open_vulns if check_sla_breach(v)]
if breached:
    notify_security_team(breached)
```

---

## 4. Triage Process

Not every scanner finding requires a fix. Triage determines the real risk before assigning work.

**Triage questions (answer in order):**

1. **Is it reachable?** Can an attacker actually reach this code path in your production environment?
2. **Is it exploitable?** Does your configuration, framework version, or surrounding code make exploitation possible?
3. **What is the blast radius?** If exploited, what data or systems are affected?
4. **Are there mitigating controls?** WAF rule, network policy, authentication gate, monitoring alert?
5. **Is the fix available?** Is there a patched version, or only a workaround?

**Triage outcome classification:**

| Outcome | Condition | Action |
|---------|-----------|--------|
| **Fix immediately** | Critical/High, reachable, exploitable | Assign to dev, start SLA timer |
| **Fix in sprint** | Medium, reachable, exploitable | Add to backlog, assign SLA |
| **False positive** | Finding is technically incorrect for your code | Document reasoning, close |
| **Not applicable** | Vulnerable code path is unreachable in production | Document reasoning, close with note |
| **Risk accepted** | Known, reachable, but fix cost exceeds risk in context | Document + set review date |
| **Compensating control** | Cannot fix now, but mitigating control deployed | Document control + set remediation date |

---

## 5. False Positive Documentation

Do not silently suppress findings. Document why a finding is a false positive so the decision is auditable and reviewable.

**False positive record (minimum fields):**

```yaml
# Example: false positive record in your issue tracker or a file
id: FP-2026-042
scanner: semgrep
rule: python.lang.security.audit.subprocess-shell-true
file: scripts/build_release.sh
line: 47
finding: "subprocess.run(cmd, shell=True)"

rationale: |
  This script runs in a restricted CI environment with no user input.
  The `cmd` variable is constructed entirely from hardcoded strings and
  environment variables set by the CI system, never from user-controlled input.
  shell=True is required for glob expansion in the build command.

mitigations:
  - CI runner has no network access during build phase
  - Script is not deployed to production systems
  - Command arguments are static and reviewed in code review

reviewed_by: alice@company.com
reviewed_at: 2026-04-03
next_review: 2027-04-03
suppression_scope: this file only, not global
```

**In-code suppression (always with justification):**

```python
# Semgrep suppression - ALWAYS include justification
subprocess.run(cmd, shell=True)  # nosemgrep: subprocess-shell-true
# Rationale: cmd is constructed from hardcoded build args only, CI-only script

# Bandit suppression
subprocess.run(cmd, shell=True)  # noqa: S603
# Rationale: see FP-2026-042

# Never suppress without a comment explaining why
subprocess.run(cmd, shell=True)  # nosemgrep  <-- BAD, no justification
```

---

## 6. Risk Acceptance and Exceptions

When a vulnerability cannot be fixed within SLA due to business constraints, a formal risk acceptance is required.

**Risk acceptance template:**

```markdown
## Risk Acceptance Record

**ID:** RA-2026-017
**Date:** 2026-04-03
**Expires:** 2026-07-03 (90 days - required re-review)

### Vulnerability
- **Finding:** CVE-2023-XXXXX in dependency `some-library v1.2.3`
- **Severity:** High (CVSS 7.8)
- **Affected system:** Internal admin dashboard

### Why the fix is not applied now
The patched version (2.0.0) introduces a breaking API change that requires
3-4 weeks of migration work. The next planned migration window is 2026-05-15.

### Risk justification
- The affected endpoint requires admin authentication (reduces attack surface)
- The admin dashboard is accessible only from the corporate VPN
- No known public exploit exists as of 2026-04-03

### Compensating controls in place
1. Network policy: admin dashboard restricted to VPN CIDR range
2. Monitoring: alert on anomalous requests to `/admin/*`
3. Auth: admin accounts require MFA

### Remediation commitment
Migration to patched version scheduled for sprint starting 2026-05-12.
Ticket: JIRA-4821

### Approvals
- Engineering lead: bob@company.com - approved 2026-04-03
- Security lead: alice@company.com - approved 2026-04-03
```

**Key rules for risk acceptance:**
- Maximum duration: 90 days (Critical: 30 days)
- Must be re-reviewed before expiry
- Compensating controls must be documented and verified
- Two approvals required (engineering + security)
- Never accept the same vulnerability twice without escalation

---

## 7. Compensating Controls

When a fix is not immediately feasible, document the controls that reduce risk until remediation.

| Vulnerability Type | Possible Compensating Controls |
|-------------------|-------------------------------|
| Unpatched dependency (CVE) | WAF rule blocking the exploit vector, network isolation, enhanced monitoring |
| Missing authentication | IP allowlist, VPN requirement, rate limiting |
| SQL injection | WAF rule, read-only DB user, query result size limit |
| SSRF | Egress firewall blocking internal CIDR, metadata service restriction |
| Outdated TLS | Network-level TLS termination at load balancer |
| Known weak password policy | MFA requirement for all accounts |

**Compensating controls are NOT a permanent substitute for fixing the vulnerability.** They reduce probability/impact but do not eliminate the root cause. Always set a remediation deadline.

---

## 8. Metrics and Reporting

Track these metrics to demonstrate program maturity and identify systemic issues.

| Metric | Target | Frequency |
|--------|--------|-----------|
| Mean Time to Remediate (MTTR) - Critical | < 24h | Weekly |
| Mean Time to Remediate (MTTR) - High | < 7 days | Weekly |
| SLA compliance rate | > 95% | Monthly |
| Open Critical/High count (trend) | Decreasing | Weekly |
| False positive rate per scanner | < 20% | Quarterly |
| Risk acceptances open > 90 days | 0 | Monthly |
| Recurring vulnerability types | Trending down | Quarterly |

**Weekly security dashboard query (example):**

```sql
-- Open vulnerabilities by severity and age
SELECT
    severity,
    COUNT(*) as total,
    COUNT(CASE WHEN discovered_at < NOW() - INTERVAL '7 days' THEN 1 END) as overdue_high,
    AVG(EXTRACT(EPOCH FROM (NOW() - discovered_at))/86400)::int as avg_age_days
FROM vulnerabilities
WHERE status = 'open'
GROUP BY severity
ORDER BY CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
END;
```

---

## 9. Dependency Vulnerability Triage Quick Reference

Most teams are overwhelmed by dependency scanner output. Apply this filter:

```
Is the vulnerable function actually called in your code?
  No  -> Not applicable, document and close
  Yes -> Is there a patched version available?
           No  -> Risk accept with compensating control
           Yes -> Is the upgrade breaking?
                    No  -> Fix within SLA
                    Yes -> Plan migration, risk accept with SLA
```

**Tools to check reachability (not just presence):**

```bash
# govulncheck - only reports vulnerabilities in code you actually call
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...

# pip-audit with call graph (experimental)
pip-audit --fix

# Trivy - check if OS package CVE affects your distroless image
trivy image --ignore-unfixed myapp:latest
```

---

## 10. Vuln Management Checklist

| Check | Expected |
|-------|----------|
| All scanner findings triaged within SLA acknowledge time | Yes |
| False positives documented with justification (not silently suppressed) | Yes |
| Risk acceptances have expiry date, two approvals, compensating controls | Yes |
| SLA compliance rate tracked and reported monthly | Yes |
| Critical/High vulnerabilities never left open past SLA without formal acceptance | Yes |
| Recurring vulnerability types tracked for root cause (training, library replacement) | Yes |
| Dependency scanner runs in CI, blocks on Critical/High unfixed CVEs | Yes |
| govulncheck / reachability analysis used to reduce false positives | Yes |
| Risk acceptances reviewed before expiry | Yes |

---

## Resources

- NIST SP 800-40 - Guide to Enterprise Patch Management
- CVSS v3.1 Specification - https://www.first.org/cvss/v3.1/specification-document
- OWASP Vulnerability Disclosure Cheat Sheet
- CVE Numbering Authority (NVD) - https://nvd.nist.gov
