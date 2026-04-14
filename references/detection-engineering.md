# detection-engineering.md

> **Scope and Assumptions**
>
> - The source file `references/threat-modeling.md` is not visible in this session. The rules below therefore cover an **inferred reusable threat library** derived from explicitly requested threats and the most probable attack patterns.
> - The format is **Sigma YAML + operational metadata**. The `threshold`, `required_log_sources` and `falsepositives` blocks are **deployment extensions** to be translated into your SIEM/XDR backend (Elastic, Sentinel, Splunk, Panther, etc.).
> - Fields assume normalization close to ECS/OCSF: `source.ip`, `user.id`, `event.action`, `http.request.body.content`, `graphql.*`, etc.
> - The thresholds below are **starting values**, not universal truths. Tune them per application, per route, per client and per tenant.

## Coverage snapshot

- Auth abuse: credential stuffing, token/session replay
- Authorization abuse: IDOR/BOLA, BOPLA, mass assignment
- GraphQL abuse: introspection, alias DoS, batching, APQ probing, N+1
- Cloud abuse: SSRF to IMDS / internal network
- AI/agent abuse: prompt injection, exfiltration, suspicious tool sequences
- Cloud-native abuse: Kubernetes secrets / exec
- Supply chain: npm typosquatting, malicious postinstall, GitHub Actions SHA replacement

## Sigma rules

### DET-001 — Credential Stuffing Burst From Single Source

```yaml
title: Credential Stuffing Burst From Single Source
rule_ref: DET-001
id: c4f52662-79ff-464b-b771-120d667f5829
status: experimental
description: Detects a burst of authentication failures from a single source IP against many accounts, the classic
  signature of non-distributed credential stuffing.
references:
- references/threat-modeling.md#credential-stuffing
logsource:
  product: webapp
  category: authentication
detection:
  selection:
    event.action:
    - login
    - authenticate
    - session.create
    event.outcome: failure
  filter_benign_ua:
    user_agent.original|contains:
    - k6
    - synthetics
    - healthcheck
    - uptimerobot
  condition: selection and not filter_benign_ua
fields:
- source.ip
- user.name
- user.id
- user_agent.original
- destination.domain
- http.request.headers.x_forwarded_for
level: high
tags:
- attack.credential_access
- attack.t1110.004
- appsec.auth-abuse
required_log_sources:
- Application or IdP authentication logs with username, result, source IP and user-agent
- Reverse proxy or WAF logs for the same endpoint
threshold:
  group_by:
  - source.ip
  metric: distinct(user.name)
  gte: 10
  window: 5m
falsepositives:
  typical:
  - Corporate NAT during training or password reset waves
  - Synthetic monitoring hitting a login route
  filtering:
  - Allowlist corporate egress NATs and QA addresses
  - Exclude known synthetic user-agents and smoke-test accounts
```

### DET-002 — Credential Stuffing Low-and-Slow Distributed Across Many Sources

```yaml
title: Credential Stuffing Low-and-Slow Distributed Across Many Sources
rule_ref: DET-002
id: b1cac2a9-0247-4771-87b4-519e57c3ea1b
status: experimental
description: Detects authentication failures against the same account or small group of accounts from multiple IPs/ASNs
  over a longer window, typical of a botnet or low-and-slow attack.
references:
- references/threat-modeling.md#credential-stuffing
logsource:
  product: webapp
  category: authentication
detection:
  selection:
    event.action:
    - login
    - authenticate
    - session.create
    event.outcome: failure
  condition: selection
fields:
- user.name
- source.ip
- source.as.organization.name
- user_agent.original
- geo.country_iso_code
level: high
tags:
- attack.credential_access
- attack.t1110.004
- appsec.auth-abuse
required_log_sources:
- Application or IdP authentication logs
- IP enrichment (ASN / geolocation) in SIEM or data pipeline
threshold:
  group_by:
  - user.name
  metric: distinct(source.ip)
  gte: 15
  window: 30m
  secondary_signal: distinct(source.as.organization.name) >= 5
falsepositives:
  typical:
  - Shared test accounts used by distributed QA or support teams
  - Mobile users bouncing through carrier NATs and VPNs
  filtering:
  - Exclude shared non-human service accounts from this analytic
  - Suppress when recent password-reset or SSO outage tickets exist
```

### DET-003 — Refresh Token or Session Replay From Divergent Network Contexts

```yaml
title: Refresh Token or Session Replay From Divergent Network Contexts
rule_ref: DET-003
id: 8b9c4554-031b-4ae2-9ad7-94d3a3eb194a
status: experimental
description: Detects reuse of the same refresh token, session ID or cookie from multiple IPs, ASNs or user-agents
  incompatible with normal usage, a signal of session theft or token replay.
references:
- references/threat-modeling.md#session-hijack
- references/threat-modeling.md#token-replay
logsource:
  product: webapp
  category: authentication
detection:
  selection:
    event.action:
    - token.refresh
    - session.refresh
    - session.resume
    - session.authenticated
  condition: selection
fields:
- user.name
- session.id
- oauth.refresh_token_id
- source.ip
- source.as.organization.name
- user_agent.original
level: high
tags:
- attack.credential_access
- attack.valid_accounts
- appsec.session-hijack
required_log_sources:
- Application session or token refresh logs with stable session/token identifier
- IP and ASN enrichment
- Optional device fingerprint telemetry
threshold:
  group_by:
  - session.id
  metric: distinct(source.as.organization.name)
  gte: 2
  window: 10m
  secondary_signal: distinct(user_agent.original) >= 2
falsepositives:
  typical:
  - Mobile app reconnects behind rotating carrier infrastructure
  - Load balancer or gateway not preserving a stable client IP header
  filtering:
  - Use trusted client IP extraction and suppress known mobile SDK patterns
  - Prefer impossible-travel or device-fingerprint corroboration before paging
```

### DET-004 — IDOR Enumeration Over Sequential REST Object Identifiers

```yaml
title: IDOR Enumeration Over Sequential REST Object Identifiers
rule_ref: DET-004
id: b79d3f6c-1c51-4972-b859-3ec5954bc363
status: experimental
description: Detects an authenticated client rapidly iterating over many sequential or near-sequential identifiers on the
  same resource type, an indicator of IDOR/BOLA enumeration.
references:
- references/threat-modeling.md#idor
- references/threat-modeling.md#bola
logsource:
  product: webserver
  category: webserver
detection:
  selection:
    http.request.method:
    - GET
    - POST
    - PUT
    - PATCH
    url.path|re: .*/(users|orders|invoices|documents|records)/[0-9]{1,12}$
  success_or_forbidden:
    http.response.status_code:
    - 200
    - 206
    - 403
    - 404
  condition: selection and success_or_forbidden
fields:
- source.ip
- user.id
- url.path
- http.response.status_code
- http.request.referrer
- user_agent.original
level: high
tags:
- attack.initial_access
- attack.t1190
- appsec.idor
- appsec.bola
required_log_sources:
- Web server or API gateway logs with path, authenticated principal and status code
- Optional application audit logs that resolve object owner/tenant
threshold:
  group_by:
  - source.ip
  - user.id
  metric: distinct(url.path)
  gte: 20
  window: 5m
  correlation_hint: prefer backend correlation that detects monotonic or near-sequential numeric IDs
falsepositives:
  typical:
  - Back-office agents manually reviewing adjacent tickets or orders
  - Support export tools iterating legitimate datasets
  filtering:
  - Exclude approved admin roles and bulk-export endpoints
  - Require unexpected tenant/object-owner mismatch before escalating
```

### DET-005 — GraphQL Relay Node ID Enumeration

```yaml
title: GraphQL Relay Node ID Enumeration
rule_ref: DET-005
id: 8fc90ad7-0897-4021-bb6e-43b1656368f3
status: experimental
description: Detects GraphQL requests massively targeting `node(id:)` or equivalent fields with many distinct global IDs,
  an indicator of IDOR/BOLA on Relay objects.
references:
- references/threat-modeling.md#idor
- references/threat-modeling.md#graphql-id-enumeration
logsource:
  product: graphql
  category: application
detection:
  selection:
    graphql.operation.type:
    - query
    graphql.request.document|contains:
    - node(
    - nodes(
  condition: selection
fields:
- source.ip
- user.id
- graphql.operation.name
- graphql.request.document
- graphql.variables
- http.response.status_code
level: high
tags:
- attack.initial_access
- attack.t1190
- appsec.idor
- appsec.graphql
required_log_sources:
- GraphQL request logs containing normalized document text or operation metadata
- GraphQL variable capture or field-level telemetry
- Optional resolver audit logs with object owner/tenant
threshold:
  group_by:
  - source.ip
  - user.id
  metric: distinct(graphql.variables.id)
  gte: 15
  window: 10m
  correlation_hint: decode Relay/global IDs and look for heterogeneous object owners or tenants
falsepositives:
  typical:
  - Internal admin UIs loading many entities by node ID
  - Data migrations or QA explorers
  filtering:
  - Suppress known admin service accounts and trusted explorer origins
  - Require object-owner mismatch or high 403/404 ratio to raise severity
```

### DET-006 — Sensitive Field Overfetch by Low-Privilege Principal

```yaml
title: Sensitive Field Overfetch by Low-Privilege Principal
rule_ref: DET-006
id: 125a1c93-e1c8-422c-b4c9-da0621e70586
status: experimental
description: Detects GraphQL or REST requests asking for sensitive properties normally absent from the current user's
  journey, an indicator of BOPLA / excessive data exposure.
references:
- references/threat-modeling.md#bopla
- references/threat-modeling.md#excessive-data-exposure
logsource:
  product: graphql
  category: application
detection:
  selection_fields:
    graphql.request.document|contains:
    - ssn
    - salary
    - roles
    - permissions
    - isAdmin
    - apiKeys
    - mfaSecret
    - recoveryCodes
  condition: selection_fields
fields:
- user.id
- user.roles
- source.ip
- graphql.operation.name
- graphql.request.document
- http.response.status_code
level: high
tags:
- attack.initial_access
- attack.t1190
- appsec.bopla
- appsec.graphql
required_log_sources:
- GraphQL field-level telemetry or request document logging
- User role or entitlement context
- Equivalent REST audit logs if field selection is represented via sparse fieldsets
threshold:
  group_by:
  - user.id
  - source.ip
  metric: count()
  gte: 3
  window: 5m
  secondary_signal: principal lacks privileged role
falsepositives:
  typical:
  - Privileged support or compliance workflows
  - Staging or synthetic smoke tests
  filtering:
  - Join against RBAC context and suppress when role is approved for those fields
  - Allowlist test tenants and automation identities
```

### DET-007 — Mass Assignment Attempt on Protected Properties

```yaml
title: Mass Assignment Attempt on Protected Properties
rule_ref: DET-007
id: 66ebe964-5c97-4464-ba5a-f95a4c676812
status: experimental
description: Detects a create or update request attempting to set fields normally protected server-side (`role`,
  `isAdmin`, `tenantId`, `createdBy`, etc.).
references:
- references/threat-modeling.md#mass-assignment
logsource:
  product: webapp
  category: application
detection:
  selection:
    event.action:
    - object.create
    - object.update
    - mutation.execute
    - http.request
    http.request.body.content|contains:
    - isAdmin
    - role
    - roles
    - permissions
    - tenantId
    - ownerId
    - createdBy
    - plan
    - creditLimit
  condition: selection
fields:
- source.ip
- user.id
- event.action
- url.path
- http.request.body.content
- http.response.status_code
level: high
tags:
- attack.initial_access
- attack.t1190
- appsec.mass-assignment
required_log_sources:
- Application request logs or API audit logs with sanitized request body capture
- REST or GraphQL mutation telemetry
- Optional ORM / model validation error logs
threshold:
  group_by:
  - source.ip
  - user.id
  metric: count()
  gte: 1
  window: 15m
falsepositives:
  typical:
  - Privileged admin workflows legitimately setting protected fields
  - Backward-compatibility clients sending ignored fields
  filtering:
  - Join against route-level allowlist of roles permitted to set each property
  - Ignore known deprecated client versions after transition window ends
```

### DET-008 — JWT 'alg=none' Token Observed or Accepted

```yaml
title: JWT 'alg=none' Token Observed or Accepted
rule_ref: DET-008
id: f8a69076-e412-480e-a36e-92a879ae7943
status: experimental
description: Detects a JWT bearing `alg=none` or an application response indicating such a token was accepted, a signal
  of critically broken JWT validation.
references:
- references/threat-modeling.md#jwt-none-alg
logsource:
  product: webapp
  category: application
detection:
  selection_header:
    http.request.headers.authorization|contains: eyJhbGciOiJub25l
  selection_parse_error:
    error.message|contains:
    - alg=none
    - unsigned JWT
    - unsecured JWT
  condition: selection_header or selection_parse_error
fields:
- source.ip
- user.id
- http.request.headers.authorization
- url.path
- error.message
- http.response.status_code
level: critical
tags:
- attack.initial_access
- attack.t1190
- appsec.jwt
- appsec.broken-authn
required_log_sources:
- Application logs or gateway middleware logs that capture JWT header metadata safely
- Authentication error logs
- Optional WAF rules that decode JWT headers
threshold:
  group_by:
  - source.ip
  metric: count()
  gte: 1
  window: 1h
falsepositives:
  typical:
  - Security testing in preproduction
  - Malformed fuzzing traffic already blocked upstream
  filtering:
  - Suppress sanctioned scanner IPs in non-production
  - Escalate only if token reaches the app or returns non-401 status
```

### DET-009 — JWT Claim Confusion or Token Validation Bypass Attempt

```yaml
title: JWT Claim Confusion or Token Validation Bypass Attempt
rule_ref: DET-009
id: 2d491767-8ded-431d-967d-1547cb775c69
status: experimental
description: Detects tokens with `iss`, `aud`, `kid` or role claims inconsistent with the target application, as well as
  sudden privilege escalations tied to unexpected claims.
references:
- references/threat-modeling.md#jwt-confusion
- references/threat-modeling.md#claim-tampering
logsource:
  product: webapp
  category: application
detection:
  selection_errors:
    error.message|contains:
    - invalid issuer
    - invalid audience
    - unknown kid
    - unexpected signing key
    - role claim not allowed
  selection_privjump:
    event.action:
    - authorization.granted
    - session.authenticated
    user.roles|contains:
    - admin
    - superadmin
  condition: selection_errors or selection_privjump
fields:
- user.id
- user.roles
- jwt.iss
- jwt.aud
- jwt.kid
- source.ip
- error.message
level: high
tags:
- attack.initial_access
- attack.t1190
- appsec.jwt
- appsec.broken-authn
required_log_sources:
- Authentication middleware logs with JWT metadata
- Authorization decision logs that record effective role set
- Key management or JWKS fetch telemetry if available
threshold:
  group_by:
  - user.id
  - source.ip
  metric: count()
  gte: 3
  window: 15m
  secondary_signal: role elevation without matching admin grant event
falsepositives:
  typical:
  - Misconfigured integration during SSO rollout
  - Legitimate admin onboarding immediately after role grant
  filtering:
  - Correlate with IAM change events or ticketed entitlement grants
  - Suppress known staging identity providers and migration windows
```

### DET-010 — GraphQL Introspection Queried in Production

```yaml
title: GraphQL Introspection Queried in Production
rule_ref: DET-010
id: c9432058-ed02-4f6c-bfb6-3634b3d172b9
status: experimental
description: Detects introspection queries (`__schema`, `__type`) in a production environment where introspection
  should be disabled or restricted to admins.
references:
- references/threat-modeling.md#graphql-introspection
logsource:
  product: graphql
  category: application
detection:
  selection:
    graphql.request.document|contains:
    - __schema
    - __type
    deployment.environment: production
  condition: selection
fields:
- source.ip
- user.id
- graphql.operation.name
- graphql.request.document
- http.response.status_code
- deployment.environment
level: medium
tags:
- attack.discovery
- attack.t1190
- appsec.graphql
required_log_sources:
- GraphQL request logs with operation text or parsed AST summary
- Environment metadata
- Optional GraphQL explorer / IDE access logs
threshold:
  group_by:
  - source.ip
  - user.id
  metric: count()
  gte: 1
  window: 1h
falsepositives:
  typical:
  - Internal developer tooling or schema checks
  - Admin-only troubleshooting endpoints
  filtering:
  - Allowlist CI schema-publish jobs, studio explorers and admin identities
  - Escalate only when caller is untrusted or origin is internet-facing
```

### DET-011 — GraphQL Alias-Based DoS Pattern

```yaml
title: GraphQL Alias-Based DoS Pattern
rule_ref: DET-011
id: 102202bd-7d75-46e2-8c71-02a61b8f5456
status: experimental
description: Detects a GraphQL request with an excessive number of aliases, typical of an attempt to bypass naive rate
  limits or to cause a logic-level DoS.
references:
- references/threat-modeling.md#graphql-alias-dos
logsource:
  product: graphql
  category: application
detection:
  selection:
    graphql.operation.type:
    - query
    - mutation
  condition: selection
fields:
- source.ip
- user.id
- graphql.operation.name
- graphql.metrics.alias_count
- graphql.metrics.depth
- graphql.metrics.token_count
- http.response.status_code
level: high
tags:
- attack.impact
- attack.t1499
- appsec.graphql
- appsec.dos
required_log_sources:
- GraphQL telemetry exposing alias count, depth and token count per request
- Reverse proxy timing and response-size logs
threshold:
  group_by:
  - source.ip
  - user.id
  metric: max(graphql.metrics.alias_count)
  gte: 50
  window: 5m
falsepositives:
  typical:
  - Large but legitimate dashboard queries in internal tools
  filtering:
  - Set tenant- or route-specific alias caps
  - Raise only when combined with high latency, CPU or error-rate signal
```

### DET-012 — GraphQL Batch Request Abuse

```yaml
title: GraphQL Batch Request Abuse
rule_ref: DET-012
id: cf73bd50-016b-426d-b5d3-94f90d1eb11d
status: experimental
description: Detects HTTP requests containing an array of GraphQL operations or an abnormal number of operations per
  batch, a common technique to bypass per-request rate limiting.
references:
- references/threat-modeling.md#graphql-batching
logsource:
  product: graphql
  category: application
detection:
  selection:
    http.request.body.content|re: ^\\s*\\[\\s*\\{
  condition: selection
fields:
- source.ip
- user.id
- http.request.body.content
- graphql.metrics.operation_count
- http.response.status_code
level: high
tags:
- attack.impact
- attack.t1499
- attack.t1190
- appsec.graphql
required_log_sources:
- Gateway or application logs capturing request body shape or operation count
- Optional rate-limit decision logs
threshold:
  group_by:
  - source.ip
  - user.id
  metric: max(graphql.metrics.operation_count)
  gte: 10
  window: 5m
falsepositives:
  typical:
  - Trusted first-party mobile client using explicit batching
  - Internal data loaders over HTTP in legacy stacks
  filtering:
  - Allowlist approved client IDs or mTLS identities
  - Prefer persisted-query allowlists so unknown clients never batch arbitrarily
```

### DET-013 — Persisted Query / APQ Miss Storm

```yaml
title: Persisted Query / APQ Miss Storm
rule_ref: DET-013
id: ae43d85e-6737-4843-95cc-8ba1af9530f7
status: experimental
description: Detects a burst of `PersistedQueryNotFound` errors or unknown APQ hashes, a signal of probing or an attempt
  to bypass a persisted-query allowlist.
references:
- references/threat-modeling.md#apq-abuse
- references/threat-modeling.md#allowlist-bypass
logsource:
  product: graphql
  category: application
detection:
  selection:
    error.message|contains:
    - PersistedQueryNotFound
    - Unknown persisted query
    - persisted query hash not allowlisted
  condition: selection
fields:
- source.ip
- user.id
- graphql.extensions.persistedQuery.sha256Hash
- error.message
- http.response.status_code
level: medium
tags:
- attack.discovery
- attack.t1190
- appsec.graphql
- appsec.allowlist
required_log_sources:
- GraphQL server logs capturing APQ error codes or persisted-query decisions
- Optional CDN or edge logs when APQ is terminated upstream
threshold:
  group_by:
  - source.ip
  - user.id
  metric: distinct(graphql.extensions.persistedQuery.sha256Hash)
  gte: 20
  window: 10m
falsepositives:
  typical:
  - Cold-cache deploy after manifest rotation
  - Client bug after app update
  filtering:
  - Suppress during known manifest rollout windows
  - Escalate only when misses come from unrecognized client IDs or external IPs
```

### DET-014 — GraphQL N+1 or Excessive Fan-Out Behavior

```yaml
title: GraphQL N+1 or Excessive Fan-Out Behavior
rule_ref: DET-014
id: adeb95a2-1bfd-486b-a215-304a3b9fedda
status: experimental
description: Detects a single request triggering an abnormal number of backend / SQL / resolver invocations, the signature
  of N+1 abuse or unbounded logical complexity.
references:
- references/threat-modeling.md#graphql-n-plus-one
- references/threat-modeling.md#resource-exhaustion
logsource:
  product: graphql
  category: application
detection:
  selection:
    graphql.operation.type:
    - query
    - mutation
  condition: selection
fields:
- source.ip
- user.id
- graphql.operation.name
- graphql.metrics.resolver_count
- graphql.metrics.backend_call_count
- db.query.count
- event.duration
level: high
tags:
- attack.impact
- attack.t1499
- appsec.graphql
- appsec.dos
required_log_sources:
- GraphQL application telemetry with resolver_count or backend_call_count
- Database or downstream service span metrics
- APM / tracing instrumentation
threshold:
  group_by:
  - source.ip
  - user.id
  - graphql.operation.name
  metric: max(graphql.metrics.backend_call_count)
  gte: 100
  window: 5m
  secondary_signal: event.duration >= 2000ms
falsepositives:
  typical:
  - Legitimate analytics queries in back-office contexts
  - Known reports scheduled during off-hours
  filtering:
  - Require caller to be non-admin or client to be internet-facing
  - Tune per operation name and use cost baselines rather than one global threshold
```

### DET-015 — SSRF Attempt to Cloud Instance Metadata Service

```yaml
title: SSRF Attempt to Cloud Instance Metadata Service
rule_ref: DET-015
id: f57b5dc4-95f6-4aa9-9961-3ace4ac5ffd0
status: experimental
description: Detects outbound or application requests explicitly targeting IMDS endpoints (AWS/Azure/GCP) or the address
  169.254.169.254, a strong indicator of SSRF for cloud credential theft.
references:
- references/threat-modeling.md#ssrf-imds
logsource:
  product: proxy
  category: network_connection
detection:
  selection_ip:
    destination.ip:
    - 169.254.169.254
  selection_host:
    destination.domain|contains:
    - metadata.google.internal
    - metadata.azure.internal
  condition: selection_ip or selection_host
fields:
- source.ip
- source.process.name
- destination.ip
- destination.domain
- url.full
- http.request.method
- user.id
level: critical
tags:
- attack.credential_access
- attack.t1552.005
- appsec.ssrf
required_log_sources:
- Egress proxy, firewall, VPC flow, service mesh or HTTP client logs
- Application request logs showing fetched URLs where possible
threshold:
  group_by:
  - source.ip
  - source.process.name
  - user.id
  metric: count()
  gte: 1
  window: 1h
falsepositives:
  typical:
  - Expected platform agents using IMDS on compute nodes
  - Cloud-init or node bootstrap traffic
  filtering:
  - Constrain analytic to application namespaces / pods not expected to call IMDS
  - Suppress approved agent binaries and node bootstrap identities
```

### DET-016 — SSRF Attempt to RFC1918, Loopback or Internal Control Plane

```yaml
title: SSRF Attempt to RFC1918, Loopback or Internal Control Plane
rule_ref: DET-016
id: 035ec5d0-8d54-4767-91a2-1ea0f55bda5b
status: experimental
description: Detects requests to `127.0.0.1`, `localhost`, RFC1918 ranges or internal DNS names from a user-exposed
  fetch / webhook / URL import feature.
references:
- references/threat-modeling.md#ssrf-internal-network
logsource:
  product: proxy
  category: network_connection
detection:
  selection_ip:
    destination.ip|cidr:
    - 127.0.0.0/8
    - 10.0.0.0/8
    - 172.16.0.0/12
    - 192.168.0.0/16
  selection_host:
    destination.domain|contains:
    - localhost
    - .internal
    - .cluster.local
    - kubernetes.default.svc
  condition: selection_ip or selection_host
fields:
- source.process.name
- source.ip
- destination.ip
- destination.domain
- url.full
- user.id
- container.id
level: high
tags:
- attack.initial_access
- attack.t1190
- appsec.ssrf
required_log_sources:
- Egress proxy / firewall / service mesh logs
- Application outbound request logs
- Container or workload identity metadata
threshold:
  group_by:
  - source.process.name
  - container.id
  - user.id
  metric: count()
  gte: 3
  window: 15m
falsepositives:
  typical:
  - Expected service-to-service calls from trusted internal jobs
  - Health checks to localhost endpoints
  filtering:
  - Scope analytic to user-driven URL fetch features
  - Exclude control-plane sidecars, kube-probes and known service accounts
```

### DET-017 — Prompt Injection Markers in User-Supplied Content

```yaml
title: Prompt Injection Markers in User-Supplied Content
rule_ref: DET-017
id: 7bfe718f-222f-47ee-bfc4-8b8adc3d1217
status: experimental
description: Detects textual prompt injection markers in user input passed to an LLM or agent, for example
  `ignore previous instructions` or `BEGIN SYSTEM PROMPT`.
references:
- references/threat-modeling.md#prompt-injection
logsource:
  product: ai_gateway
  category: application
detection:
  selection:
    llm.input.text|contains:
    - ignore previous instructions
    - ignore all previous instructions
    - disregard system prompt
    - BEGIN SYSTEM PROMPT
    - developer message
    - tool instructions
    - jailbreak
  condition: selection
fields:
- user.id
- source.ip
- conversation.id
- llm.application
- llm.input.text
- http.request.referrer
level: medium
tags:
- appsec.prompt-injection
- attack.t1190
- attack.discovery
required_log_sources:
- AI gateway or prompt firewall logs with redacted user prompt capture
- Conversation/session identifiers
- Optional content classifier output
threshold:
  group_by:
  - user.id
  - source.ip
  - conversation.id
  metric: count()
  gte: 1
  window: 1h
falsepositives:
  typical:
  - Benign security research, internal red-team or QA prompt testing
  - Educational content discussing prompt injection
  filtering:
  - Suppress known red-team tenants or testing origins
  - Increase severity only if followed by tool access, secret exposure or policy bypass attempt
```

### DET-018 — LLM Exfiltration Request for System Prompt, Secrets or Tool Policy

```yaml
title: LLM Exfiltration Request for System Prompt, Secrets or Tool Policy
rule_ref: DET-018
id: ef268f37-492e-46b1-93ef-32f82a1e9655
status: experimental
description: Detects an explicit attempt to make the LLM reveal the system prompt, secrets, developer instructions
  or the list of available tools.
references:
- references/threat-modeling.md#prompt-exfiltration
- references/threat-modeling.md#agent-pivot
logsource:
  product: ai_gateway
  category: application
detection:
  selection:
    llm.input.text|contains:
    - reveal your system prompt
    - show hidden instructions
    - print the developer message
    - dump secrets
    - list available tools
    - show api keys
    - what are your internal policies
  condition: selection
fields:
- user.id
- source.ip
- conversation.id
- llm.input.text
- llm.application
level: high
tags:
- appsec.prompt-injection
- appsec.secret-access
- attack.discovery
required_log_sources:
- AI gateway / orchestration audit logs
- Prompt classification or moderation logs
- Optional downstream tool invocation logs
threshold:
  group_by:
  - user.id
  - source.ip
  - conversation.id
  metric: count()
  gte: 1
  window: 1h
falsepositives:
  typical:
  - Internal testing by prompt engineers
  - Security training examples
  filtering:
  - Suppress designated testing tenants and signed evaluation jobs
  - Escalate strongly only if a sensitive tool call or unexpected data exposure follows
```

### DET-019 — Suspicious Agent Tool Sequence: Browse -> Secret/File Read -> Outbound Send

```yaml
title: 'Suspicious Agent Tool Sequence: Browse -> Secret/File Read -> Outbound Send'
rule_ref: DET-019
id: 28d5a8af-748f-43f1-bd64-eabd1a12e3f4
status: experimental
description: Detects an ordered sequence of agent actions where external content is browsed, then a local or connected
  file/secret is read, then an outbound action (email, webhook, upload) is performed within the same session.
references:
- references/threat-modeling.md#agent-tool-pivot
- references/threat-modeling.md#prompt-injection
logsource:
  product: agent_platform
  category: application
detection:
  selection_browser:
    tool.name:
    - browser.open
    - web.fetch
    - connector.search
  selection_sensitive_read:
    tool.name:
    - filesystem.read
    - vault.read
    - gmail.read
    - drive.read
    - database.query
  selection_egress:
    tool.name:
    - gmail.send
    - http.post
    - webhook.send
    - storage.upload
  condition: selection_browser or selection_sensitive_read or selection_egress
fields:
- session.id
- user.id
- tool.name
- tool.args
- tool.result.summary
- source.ip
level: critical
tags:
- appsec.agent-abuse
- attack.collection
- attack.exfiltration
required_log_sources:
- Agent orchestration audit logs with ordered tool invocations
- Per-session identity and conversation IDs
- Connector audit logs for outbound actions
threshold:
  group_by:
  - session.id
  ordered_sequence:
  - browser.open|web.fetch|connector.search
  - filesystem.read|vault.read|gmail.read|drive.read|database.query
  - gmail.send|http.post|webhook.send|storage.upload
  window: 10m
falsepositives:
  typical:
  - Legitimate analyst workflow in a trusted internal automation
  - Human-approved research assistant tasks with outbound sharing
  filtering:
  - Require destination to be external or previously unseen
  - Suppress sessions with explicit human approval artifact or sandbox tag
```

### DET-020 — Suspicious Agent Override Then Connector Export

```yaml
title: Suspicious Agent Override Then Connector Export
rule_ref: DET-020
id: a2340c79-10d5-4857-8fb6-ebd370928c37
status: experimental
description: Detects a sequence where a user message attempts to override safeguards, followed by access to a sensitive
  connector and a bulk export within the same conversation.
references:
- references/threat-modeling.md#agent-override
- references/threat-modeling.md#prompt-exfiltration
logsource:
  product: agent_platform
  category: application
detection:
  selection_override:
    llm.input.text|contains:
    - ignore policy
    - override safety
    - act as root
    - bypass restrictions
    - admin mode
  selection_connector:
    tool.name:
    - crm.search
    - gmail.search
    - drive.search
    - database.query
    - slack.search
  selection_bulk:
    event.action:
    - result.export
    - bulk_download
    - bulk_email_forward
    - connector.pagination.deep
  condition: selection_override or selection_connector or selection_bulk
fields:
- conversation.id
- user.id
- llm.input.text
- tool.name
- event.action
- result.count
level: critical
tags:
- appsec.agent-abuse
- attack.collection
- attack.exfiltration
required_log_sources:
- Conversation logs for user prompts
- Agent tool audit logs
- Connector pagination/export telemetry
threshold:
  group_by:
  - conversation.id
  ordered_sequence:
  - override-like prompt
  - sensitive connector access
  - bulk export or deep pagination
  window: 15m
  secondary_signal: result.count >= 100
falsepositives:
  typical:
  - Approved eDiscovery or incident-response workflows
  - Admin-run migrations
  filtering:
  - Require conversation to originate from untrusted user tier or public tenant
  - Suppress ticket-linked admin export jobs
```

### DET-021 — Kubernetes Secret Listing by Unexpected Principal

```yaml
title: Kubernetes Secret Listing by Unexpected Principal
rule_ref: DET-021
id: 1bb571d5-69e4-458b-bc18-943d301296c9
status: experimental
description: Detects Kubernetes `list/get/watch` calls on the `secrets` resource by a service account, user or job
  that is not normally expected to access it.
references:
- references/threat-modeling.md#k8s-secret-access
logsource:
  product: kubernetes
  service: audit
detection:
  selection:
    verb:
    - get
    - list
    - watch
    objectRef.resource: secrets
  condition: selection
fields:
- user.username
- sourceIPs
- verb
- objectRef.namespace
- objectRef.name
- userAgent
- annotations.authorization.k8s.io/decision
level: critical
tags:
- attack.credential_access
- attack.t1552.007
- containers.k8s
required_log_sources:
- Kubernetes audit logs
- RBAC inventory or entitlement context for service accounts
- Optional cloud control plane audit if managed Kubernetes
threshold:
  group_by:
  - user.username
  - objectRef.namespace
  metric: count()
  gte: 1
  window: 1h
falsepositives:
  typical:
  - Approved controllers, CSI drivers or secret sync operators
  - Cluster admin break-glass activity
  filtering:
  - Allowlist expected operators per namespace
  - Escalate only when principal is new, human-unexpected or internet-originated
```

### DET-022 — Kubernetes Exec or Attach by Automation / CI Principal

```yaml
title: Kubernetes Exec or Attach by Automation / CI Principal
rule_ref: DET-022
id: b8dbe5e9-21eb-4410-b25c-1b5baeecf062
status: experimental
description: Detects `create` calls on `pods/exec` or `pods/attach` from a CI/CD principal, bot or service account,
  an indicator of interactive pivot into the cluster.
references:
- references/threat-modeling.md#k8s-exec-abuse
logsource:
  product: kubernetes
  service: audit
detection:
  selection:
    verb: create
    objectRef.subresource:
    - exec
    - attach
  condition: selection
fields:
- user.username
- sourceIPs
- objectRef.namespace
- objectRef.name
- userAgent
- requestURI
level: high
tags:
- attack.execution
- attack.t1552.007
- containers.k8s
required_log_sources:
- Kubernetes audit logs
- Identity mapping for CI/CD bots and service accounts
- Pod label / owner metadata
threshold:
  group_by:
  - user.username
  - objectRef.namespace
  metric: count()
  gte: 1
  window: 30m
falsepositives:
  typical:
  - Legitimate SRE debugging during an incident
  - Ephemeral debug containers launched from approved tooling
  filtering:
  - Suppress break-glass groups and ticket-linked maintenance windows
  - Raise only when principal is CI/bot or namespace is production
```

### DET-023 — npm Typosquatting or Dependency Confusion Install

```yaml
title: npm Typosquatting or Dependency Confusion Install
rule_ref: DET-023
id: 6c1617ab-1696-4854-b49f-87f3e2791bac
status: experimental
description: Detects installation of an npm package flagged as a typosquat, dependency confusion candidate, or a freshly
  published / low-reputation package by your proxy or pipeline.
references:
- references/threat-modeling.md#npm-typosquatting
- references/threat-modeling.md#dependency-confusion
logsource:
  product: ci
  category: process_creation
detection:
  selection:
    process.command_line|contains:
    - npm install
    - npm ci
    - pnpm install
    - yarn add
    package.risk:
    - typosquat
    - dependency_confusion
    - new_publisher
    - low_reputation
  condition: selection
fields:
- host.name
- process.command_line
- package.name
- package.version
- package.risk
- git.commit.id
- ci.pipeline.id
level: critical
tags:
- attack.resource_development
- attack.t1195.001
- supply-chain.npm
required_log_sources:
- Build logs or package proxy logs enriched with package risk metadata
- SBOM or dependency scanning output
- CI pipeline metadata
threshold:
  group_by:
  - ci.pipeline.id
  - git.commit.id
  metric: count()
  gte: 1
  window: 1d
falsepositives:
  typical:
  - False-positive similarity matches in internal scoped packages
  - Recently published legitimate private packages
  filtering:
  - Trust internal scopes and signed private registries
  - Require either risk enrichment or package-name distance to a known popular dependency
```

### DET-024 — npm Postinstall Egress or Shell Spawn in CI

```yaml
title: npm Postinstall Egress or Shell Spawn in CI
rule_ref: DET-024
id: 876aafe5-183f-44d2-b34b-4dc06d159b71
status: experimental
description: Detects execution of an npm `postinstall` / `prepare` script that spawns a shell, `curl`, `wget`, `powershell`
  or unexpected network connections during the build.
references:
- references/threat-modeling.md#npm-postinstall
- references/threat-modeling.md#build-pipeline-execution
logsource:
  product: ci
  category: process_creation
detection:
  selection_parent:
    process.parent.command_line|contains:
    - npm install
    - npm ci
    - pnpm install
    - yarn install
  selection_child:
    process.command_line|contains:
    - 'curl '
    - 'wget '
    - bash -c
    - sh -c
    - powershell
    - Invoke-WebRequest
    - 'nc '
    - python -c
  condition: selection_parent and selection_child
fields:
- host.name
- process.parent.command_line
- process.command_line
- destination.ip
- destination.domain
- ci.pipeline.id
- git.commit.id
level: critical
tags:
- attack.execution
- attack.t1195.001
- supply-chain.npm
required_log_sources:
- Process creation telemetry on CI runners
- Network egress logs from CI workers
- Package manager verbose logs if available
threshold:
  group_by:
  - ci.pipeline.id
  - host.name
  metric: count()
  gte: 1
  window: 1d
falsepositives:
  typical:
  - Known build steps that legitimately download browser binaries or toolchains
  filtering:
  - Allowlist known package download domains and expected install scripts
  - Prefer provenance / lockfile-based suppression rather than broad binary allowlists
```

### DET-025 — GitHub Action SHA Replacement or Unpinned Third-Party Action Introduced

```yaml
title: GitHub Action SHA Replacement or Unpinned Third-Party Action Introduced
rule_ref: DET-025
id: 230bed08-31ed-4e8c-a83c-20cf28c2e3b8
status: experimental
description: Detects a GitHub Actions workflow change that replaces a full-length commit SHA with a tag / short SHA,
  or introduces an unpinned third-party action.
references:
- references/threat-modeling.md#github-actions-sha-replacement
- references/threat-modeling.md#ci-cd-supply-chain
logsource:
  product: scm
  category: configuration_change
detection:
  selection_workflow:
    file.path|startswith: .github/workflows/
    file.path|endswith:
    - .yml
    - .yaml
  selection_diff:
    diff.added_lines|contains:
    - 'uses:'
  condition: selection_workflow and selection_diff
fields:
- repo.name
- actor
- file.path
- pull_request.id
- diff.added_lines
- diff.removed_lines
- git.commit.id
level: critical
tags:
- attack.resource_development
- attack.t1195.001
- supply-chain.github-actions
required_log_sources:
- SCM webhook or PR diff ingestion for workflow files
- Optional GitHub audit logs and CODEOWNERS review status
- Policy engine output checking full-length SHA pinning
threshold:
  group_by:
  - repo.name
  - pull_request.id
  metric: count()
  gte: 1
  window: 7d
  correlation_hint: flag when a `uses:` value changes from @<40-hex> to @v*, @main, or short SHA
falsepositives:
  typical:
  - Legitimate workflow modernization without a policy gate
  - Temporary PR from platform team before re-pinning in a later commit
  filtering:
  - Require failing policy check or missing CODEOWNERS approval
  - Suppress only when replacement SHA remains full-length and action owner is allowlisted
```

## MITRE ATT&CK -> Sigma Rule Matrix

> **Note**: for several application-layer abuses (GraphQL, prompt injection, agent abuse), ATT&CK does not always provide an exact sub-technique. The column below therefore shows the **closest mapping** useful for reporting.

| ATT&CK (closest) | Sigma Rules |
|---|---|
| T1110.004 Credential Stuffing | DET-001, DET-002 |
| Valid Accounts / Session replay (closest mapping, no exact fit for app token replay) | DET-003 |
| T1190 Exploit Public-Facing Application (closest for app/API abuse) | DET-004, DET-005, DET-006, DET-007, DET-008, DET-009, DET-010, DET-012, DET-013, DET-015, DET-016 |
| T1499 Endpoint Denial of Service / resource exhaustion | DET-011, DET-012, DET-014 |
| T1552.005 Cloud Instance Metadata API | DET-015 |
| T1552.007 Container API | DET-021, DET-022 |
| Prompt injection / agent abuse (no precise ATT&CK today; closest: discovery, collection, exfiltration) | DET-017, DET-018, DET-019, DET-020 |
| T1195.001 Compromise Software Dependencies and Development Tools | DET-023, DET-024, DET-025 |

---

## Appendix — GDPR / Art. 33 relevance

Detection engineering intersects GDPR through two obligations:

1. **Art. 32 (security of processing)** — monitoring is explicitly a required technical and organisational measure.
2. **Art. 33 (notification of a personal data breach)** — the controller must notify the supervisory authority within **72 hours** of *becoming aware* of a breach. Detection rules directly determine *when* awareness begins.

### Which rules support Art. 33 awareness

The following Sigma rules are the most relevant to personal data incidents. When any of these fires and the affected resource processes personal data, the Art. 33 72h clock should be considered started.

| Rule | Personal data risk | Art. 33 relevance |
|---|---|---|
| DET-001, DET-002 — Credential stuffing | Account takeover → access to personal data under victim identity | Confirmed account compromise affecting personal data = breach candidate |
| DET-003 — Session / token replay | Unauthorized session → full account data exposure | Same as above; harder to detect, higher exfiltration potential |
| DET-004, DET-005 — IDOR enumeration | Bulk extraction of personal records via predictable IDs | Direct personal data exfiltration; volume determines Art. 33(3)(c) count |
| DET-006 — Sensitive field overfetch | `ssn`, `salary`, `recoveryCodes` returned to wrong principal | Confidentiality breach of special-category or sensitive data |
| DET-007, DET-008 — Mass assignment / BOPLA | Unauthorized modification of personal data attributes | Integrity breach — Art. 4(12) includes "alteration" |
| DET-015 — SSRF to IMDS | Cloud credential theft → potential access to all data stores | Indirect but high-impact; treat as breach candidate pending investigation |
| DET-017, DET-018 — Prompt injection / agent exfiltration | LLM or agent exfiltrating personal data in responses or tool calls | Emerging vector; document as incident even without confirmed exfiltration |
| DET-021, DET-022 — Kubernetes secrets access | Secret store access → downstream data store credentials | Investigate scope before Art. 33 assessment |

### Recommended addition: personal data access anomaly rule

The rules above are security-first. The following supplementary rule targets **abnormal bulk access to personal data** — a signal with direct GDPR relevance even when no exploit is involved (e.g. insider threat, misconfigured export job, over-privileged service account).

```yaml
title: Abnormal Bulk Access to Personal Data Endpoints
rule_ref: DET-GDPR-001
id: d4e8f2a1-3b7c-4f9e-a2d1-6c8b5e9f3a2d
status: experimental
description: >
  Detects a single authenticated principal accessing an unusually large number of distinct
  personal data records within a short window. Covers REST paths and GraphQL queries
  returning user, patient, order, or financial records. Relevant to GDPR Art. 32 monitoring
  obligations and provides the earliest signal for Art. 33 breach awareness.
references:
  - references/detection-engineering.md#det-004
  - references/graphql-security.md#idor
logsource:
  product: webapp
  category: webserver
detection:
  selection:
    http.request.method:
      - GET
      - POST
    url.path|re: '.*(users|patients|customers|orders|invoices|accounts|profiles|documents)/.*'
    http.response.status_code:
      - 200
      - 206
  condition: selection
fields:
  - user.id
  - user.roles
  - source.ip
  - url.path
  - http.response.status_code
  - http.response.body.bytes
level: high
tags:
  - appsec.gdpr
  - appsec.idor
  - appsec.data-exfiltration
required_log_sources:
  - Web server or API gateway logs with authenticated principal and response status
  - Optional: response body size or record count from application audit logs
threshold:
  group_by:
    - user.id
  metric: distinct(url.path)
  gte: 50
  window: 10m
  correlation_hint: >
    Prefer backend correlation that resolves distinct record owners;
    flag when majority of accessed records belong to principals other than the requester.
falsepositives:
  typical:
    - Admin or support agents running legitimate bulk exports
    - Scheduled reporting jobs using a service account
  filtering:
    - Allowlist approved bulk-export service accounts and admin roles
    - Require unexpected tenant/owner mismatch or off-hours timing before escalating
```

### Art. 33 operational checklist for detection teams

When a rule fires and the incident scope includes personal data:

1. **Determine awareness time** — the timestamp of the first alert is the start of the 72h window.
2. **Assess breach scope** — categories of data (Art. 33(3)(b)), approximate number of records (Art. 33(3)(c)), likely consequences (Art. 33(3)(d)).
3. **Notify DPO immediately** — do not wait for the full investigation to complete.
4. **Open breach register entry** — even if notification to the authority is ultimately not required (risk too low), the register must document the decision.
5. **Document the detection rule** that provided awareness — this is evidence of the Art. 32 monitoring measure.
6. **If 72h cannot be met** — notify anyway with available information and supplement later (Art. 33(4) allows phased notification).

> **Note**: Art. 33 applies to **personal data breaches** — unauthorised access, disclosure, alteration, or destruction of personal data. Not every security incident is a personal data breach. The detection team's role is to provide timely awareness; the DPO makes the Art. 33(1) determination.