---
title: "Detection Translations"
slug: detection-translations
category: ops
depth: 2
audit_level: [3, 4]
last_reviewed: 2026-04-18
sources:
  - "Sigma specification"
  - "Elastic Security detection rules guidance"
  - "Microsoft Sentinel KQL guidance"
  - "Splunk SPL security content guidance"
  - "Panther detection engineering docs"
triggers_strong: ["sigma to siem", "detection translation", "kql translation", "splunk translation", "elastic detection"]
triggers_weak: ["translate detection", "siem query", "sigma conversion"]
related: ["detection-engineering", "incident-playbooks", "security-metrics-kpis"]
---

# Detection Translations

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Recommended | Audit Level: 3-4 | Automation: Partial (field mapping checks, test replay, and some conversion linting automatable; backend-specific tuning, suppression strategy, and detection quality review manual)

Use this guide when you need to turn a portable detection idea or Sigma-like analytic into a working rule for a specific backend such as **Elastic**, **Microsoft Sentinel**, **Splunk**, or **Panther**.

The hard part is usually not the condition itself. The hard part is translating:

- field names,
- event normalization,
- time windows,
- grouping logic,
- suppression and tuning,
- alert packaging and investigation context.

---

## 1. Core rule

Do not treat detection translation as a copy-paste exercise.

A rule that looks correct syntactically can still fail because:

- the backend uses different field names,
- the parser drops the field you grouped on,
- the threshold semantics differ,
- the source data arrives late or partially normalized,
- the query runs but the alert never packages useful context.

Translation quality matters as much as rule logic.

---

## 2. Translation workflow

Use this sequence:

1. identify the analytic intent,
2. list required data sources,
3. map source fields to backend schema,
4. implement the query logic,
5. implement aggregation / threshold semantics,
6. add filters and suppressions,
7. test against known-good and known-bad samples,
8. review investigation output quality.

If a translated rule has not been tested on representative data, it is still provisional.

---

## 3. Portable analytic template

Before translating, write the analytic in backend-neutral terms.

| Element | Example |
|---|---|
| intent | detect multiple failed logins from one IP against many users |
| log sources | IdP auth logs, app auth logs, proxy logs |
| core fields | source IP, username, outcome, user agent, timestamp |
| grouping | by `source.ip` |
| threshold | distinct users >= 10 in 5m |
| exclusions | known QA IPs, synthetic monitoring |
| severity | high |
| triage hints | recent password reset campaign? corporate NAT? |

This keeps translation from becoming guesswork.

---

## 4. Field mapping discipline

### 4.1 Never assume field names

Examples of common differences:

| Concept | ECS / Sigma-like | Sentinel-style | Splunk-like | Panther / custom |
|---|---|---|---|---|
| source IP | `source.ip` | `IPAddress` / `SrcIpAddr` | `src`, `src_ip`, `clientip` | often normalized by parser |
| user | `user.name` | `UserPrincipalName`, `Account` | `user`, `src_user`, `user_name` | varies by log type |
| outcome | `event.outcome` | `ResultType`, `Status` | `action`, `result` | parser-defined |
| user agent | `user_agent.original` | custom column or parsed field | `user_agent`, `http_user_agent` | parser-defined |
| path | `url.path` | `RequestUri`, `Url` | `uri_path`, `path` | parser-defined |

### 4.2 Translation checklist

- confirm the exact table or index,
- confirm parser output field names,
- confirm data type of timestamps and counters,
- confirm whether missing fields are null or absent,
- confirm whether the backend requires explicit cast or parse steps.

Most broken translations fail here.

---

## 5. Backend patterns

### 5.1 Elastic

Common strengths:

- ECS-aligned field naming,
- good threshold and sequence rule support,
- strong Kibana investigation packaging.

Watch for:

- index selection mismatch,
- runtime field cost,
- differences between KQL filters and EQL sequence logic,
- missing ECS normalization in custom sources.

Example pattern:

```text
from logs-*
| where event.category == "authentication" and event.outcome == "failure"
| stats distinct_user_count = count_distinct(user.name) by source.ip, span(@timestamp, 5m)
| where distinct_user_count >= 10
```

### 5.2 Microsoft Sentinel

Common strengths:

- KQL flexibility,
- easy joins across identity and cloud logs,
- strong fit for M365 / Entra data.

Watch for:

- table-specific field differences,
- ingestion latency,
- noisy joins across large windows,
- scheduled-rule frequency misaligned with analytic window.

Example pattern:

```kusto
SigninLogs
| where ResultType != 0
| summarize distinct_users=dcount(UserPrincipalName) by IPAddress, bin(TimeGenerated, 5m)
| where distinct_users >= 10
```

### 5.3 Splunk

Common strengths:

- expressive SPL,
- mature security content ecosystem,
- powerful enrichment and macros.

Watch for:

- data model acceleration assumptions,
- parser inconsistency across sourcetypes,
- expensive stats over large windows,
- alert fatigue from poor macro hygiene.

Example pattern:

```spl
index=auth sourcetype=signin action=failure
| bin _time span=5m
| stats dc(user) as distinct_users values(user_agent) as user_agents by src_ip _time
| where distinct_users >= 10
```

### 5.4 Panther

Common strengths:

- code-centric detections,
- parser-backed normalization,
- clear alert object model.

Watch for:

- relying on parser fields that are not present in all log types,
- detection logic that should really be sequence or threshold-oriented in upstream aggregation,
- insufficient test fixtures.

Example pattern:

```python
def rule(event):
    return event.get("event.outcome") == "failure"
```

In Panther, complex thresholds often need dedicated aggregation or scheduled analysis patterns rather than one-event logic alone.

---

## 6. Translation of threshold semantics

This is where many "working" translations silently fail.

Questions to answer:

- Does the backend compute `distinct` exactly as intended?
- Is the window sliding or fixed-bin?
- Is grouping by event time or ingestion time?
- Does late-arriving data miss the alert?
- Does deduplication happen before or after aggregation?

### 6.1 Example mismatch

Intent:

- distinct usernames from one IP >= 10 in 5 minutes

Possible translation pitfalls:

- backend bins by ingestion time, not event time,
- null usernames collapse into one bucket,
- schedule runs every 10 minutes and misses short bursts,
- distinct count only sees parsed fields from one source, not the joined one.

---

## 7. Suppressions and environment tuning

Every backend needs explicit tuning.

Expected tuning inputs:

- trusted corporate NATs,
- QA and synthetic monitoring,
- shared service accounts,
- scheduled batch jobs,
- maintenance windows,
- mobile or carrier-network behavior,
- environment tags for dev versus prod.

A translated rule with no suppression strategy is not production-ready.

---

## 8. Investigation output quality

A good alert should answer:

- what triggered,
- against whom,
- from where,
- over what window,
- with what corroborating context,
- what the responder should check next.

### 8.1 Include fields that matter

| Use case | Useful fields |
|---|---|
| auth abuse | source IP, ASN, user count, sample users, user agent, geo |
| token replay | session ID, IPs, ASNs, user agents, impossible travel context |
| IDOR/BOLA | actor, resource path, tenant, status code mix, object count |
| AI abuse | session ID, tool sequence, prompt risk markers, blocked/allowed decision |

A minimal alert that forces the responder to rebuild all context from raw logs is too expensive.

---

## 9. Testing translations

Test at three levels:

### 9.1 Query correctness

- does it return the expected sample events?
- does field mapping work?
- do thresholds fire when the sample crosses the boundary?

### 9.2 Noise check

- does it page on known-benign workloads?
- do suppressions remove expected noise without hiding attacks?

### 9.3 Investigation usefulness

- does the alert payload contain enough context?
- can the responder pivot quickly?
- are links, entity mappings, or timeline fields present?

A detection that fires correctly but is unusable during triage still needs work.

---

## 10. First 30 minutes of a translation task

1. Read the backend-neutral analytic intent.
2. Verify required log sources actually exist in the target backend.
3. Inspect real sample events for field names and null behavior.
4. Translate the filter and threshold logic.
5. Add environment suppressions.
6. Test with representative examples.
7. Review the generated alert fields for responder usefulness.

Skipping sample-event inspection is one of the fastest ways to ship a broken translation.

---

## 11. Common red flags

| Red flag | Why it matters |
|---|---|
| Sigma fields copied directly with no schema validation | likely wrong field names |
| translation uses ingestion time by accident | window semantics drift |
| no sample-event testing | silent false negatives |
| suppression logic added after paging starts | alert fatigue and distrust |
| backend alert contains almost no entity context | slow triage |
| one rule copied to every environment unchanged | poor tuning and noisy results |

---

## 12. Minimum checklist

| Check | Expected |
|---|---|
| Analytic intent is defined in backend-neutral form first | Yes |
| Required data sources exist and are inspected in the target backend | Yes |
| Field mapping is validated against real sample events | Yes |
| Threshold and time-window semantics match the intended behavior | Yes |
| Suppressions and environment tuning are documented | Yes |
| Translation is tested on representative positive and benign samples | Yes |
| Alert output contains enough context for triage | Yes |
| Ownership exists for future tuning and maintenance | Yes |

---

## 13. Related references

- `detection-engineering.md`
- `incident-playbooks.md`
- `security-metrics-kpis.md`
