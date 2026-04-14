# Threat Modeling

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: Essential | Audit Level: 2-4 | Automation: None

A practical threat modeling reference. Covers STRIDE, LINDDUN (privacy), PASTA (risk), Data Flow Diagrams, trust boundaries, abuse cases, a reusable threat library, and a sample 90-minute workshop agenda.

If you remember nothing else: **threat modeling is asking "what can go wrong here, who could make it go wrong, and what would we do about it" before you build.**

---

## When to threat model

| Trigger | Depth |
|---------|-------|
| New product or major feature | Full workshop (90 min) |
| New external entry point (API, webhook, file upload, agent tool) | Lightweight DFD review (30 min) |
| New trust boundary (multi-tenant, new identity provider) | Full workshop |
| Refactor crossing existing boundaries | Diff review |
| Vulnerability discovered | Update model, look for siblings |

Threat modeling is **not** a compliance artifact. If your model lives in a PDF nobody opens, you are doing it wrong. Keep it in the repo as a living markdown file next to the code it describes.

---

## The four questions (Shostack)

Adam Shostack reduced threat modeling to four questions. Use these as the agenda for any session:

1. **What are we working on?** (Diagram)
2. **What can go wrong?** (Threats)
3. **What are we going to do about it?** (Mitigations)
4. **Did we do a good job?** (Validation, retro)

Everything else is detail.

---

## Methodology choice

Pick one based on goal. Do not pick "all of them".

| Methodology | Best for | Output |
|-------------|----------|--------|
| **STRIDE** | Product features, technical threats | Per-element threat list |
| **LINDDUN** | Privacy reviews, GDPR/CCPA-relevant systems | Per-element privacy threats |
| **PASTA** | Business-critical apps, risk quantification | Risk-ranked attack scenarios |
| **Attack Trees** | Specific high-stakes asset (signing key, root account) | Tree of attack paths |
| **Kill Chain / MITRE ATT&CK** | Detection engineering, red team alignment | Coverage matrix |
| **Quick / "rapid risk"** | Sprint-scoped features | Single-page summary |

Most teams should default to **STRIDE for tech**, **LINDDUN when PII is involved**, and switch to **PASTA** for revenue-critical or regulated systems.

---

## STRIDE in 60 seconds

| Letter | Threat | Property violated | Example |
|--------|--------|-------------------|---------|
| **S** | Spoofing | Authenticity | JWT `alg: none`, IP allowlist bypass |
| **T** | Tampering | Integrity | Modifying webhook body in transit, prototype pollution |
| **R** | Repudiation | Non-repudiation | No audit log, shared admin accounts |
| **I** | Information disclosure | Confidentiality | Stack traces in 500s, IDOR, log PII |
| **D** | Denial of service | Availability | Unbounded recursion, no rate limit, ZIP bomb |
| **E** | Elevation of privilege | Authorization | RCE, missing authz check, sudo via crafted input |

Apply STRIDE to every element type as follows:

| Element | S | T | R | I | D | E |
|---------|---|---|---|---|---|---|
| External entity | Y |   | Y |   |   |   |
| Process         | Y | Y | Y | Y | Y | Y |
| Data flow       |   | Y |   | Y | Y |   |
| Data store      |   | Y | Y | Y | Y |   |

Use this matrix to drive a structured walk: for every box marked Y, ask "how could this happen here?".

---

## LINDDUN in 60 seconds (privacy)

| Letter | Threat |
|--------|--------|
| **L** | Linkability (correlate two records to the same person) |
| **I** | Identifiability (re-identify a pseudonymous record) |
| **N** | Non-repudiation (forced accountability for the user) |
| **D** | Detectability (an attacker can detect a record exists) |
| **D** | Disclosure of information |
| **U** | Unawareness (user has no idea what is collected) |
| **N** | Non-compliance (GDPR / CCPA / sector law) |

Pair with `privacy-data-minimization.md` for mitigations.

---

## PASTA in 60 seconds (risk-centric)

Seven stages, business-driven:

1. Define business objectives
2. Define technical scope
3. Application decomposition (DFD + components)
4. Threat analysis (intel-driven: who would attack you)
5. Vulnerability and weakness analysis (combine with SAST/SCA findings)
6. Attack modeling (build trees, simulate)
7. Risk and impact analysis (quantify, prioritize, accept or fix)

PASTA produces ranked attack scenarios with business impact, which is what you need to defend a remediation budget to leadership.

---

## Data Flow Diagrams (DFD)

The single most useful artifact. Five symbols, that is it:

| Symbol | Meaning |
|--------|---------|
| Square / rectangle | External entity (user, third-party API, identity provider) |
| Circle | Process (your code) |
| Two parallel lines | Data store (DB, S3 bucket, KV cache) |
| Arrow | Data flow |
| Dashed line | **Trust boundary** (this is where threats are born) |

### Example - file upload feature

```
┌──────────┐  HTTPS POST /upload   ╔═════════╗   put         ┌─────────┐
│ Browser  │ ────────────────────► ║ API     ║ ────────────► │   S3    │
└──────────┘   (cookie auth)       ║ process ║                └─────────┘
                                   ╚═════════╝
                                       │ AV scan req
                                       ▼
                                   ┌─────────┐
                                   │ ClamAV  │
                                   └─────────┘

      └──── trust boundary: internet ─────┘└── trust boundary: VPC ──┘
```

Once you have the diagram, every arrow that crosses a dashed line is a place to ask STRIDE questions. That is 80% of threat modeling done.

### Tools

- **draw.io / diagrams.net** - free, runs in the browser, exports `.drawio.svg` you can commit to git.
- **OWASP Threat Dragon** - DFD + STRIDE, web and desktop.
- **pytm / threagile** - threat modeling as code, integrates with CI.
- **Microsoft Threat Modeling Tool** - Windows-only, generates STRIDE threats automatically.

---

## Trust boundaries cheat sheet

A trust boundary exists wherever the level of trust changes. Common ones:

- Internet -> your edge (CDN, WAF, ALB)
- Edge -> application
- Application -> database
- Application -> third-party API
- Tenant A -> tenant B (multi-tenant SaaS)
- User space -> kernel
- Frontend (untrusted runtime) -> backend
- LLM agent -> tool execution layer (see `mcp-security.md`)
- Production -> non-production
- Service mesh sidecar boundaries (mTLS terminations)

For each boundary: what authenticates? What authorizes? What logs? What rate-limits?

---

## Abuse cases

For every user story, write the matching abuse story:

| User story | Abuse story |
|------------|-------------|
| As a user, I can reset my password via email | As an attacker, I can take over an account by hijacking the reset link |
| As a user, I can upload a profile picture | As an attacker, I can upload a polyglot file that runs JS or executes server-side |
| As a user, I can invite teammates by email | As a spammer, I can use the invite endpoint to send phishing |
| As an admin, I can impersonate a user for support | As a malicious admin, I can read PII without an audit trail |
| As a user, I can ask the agent to summarize my docs | As an attacker, I can hide instructions in a doc to make the agent exfiltrate data |

Add abuse stories to the same backlog as user stories, with the same "definition of done" for security tests.

---

## Reusable threat library

Pull from this list before starting any session - it covers 80% of what you will find.

### Auth and identity

- Credential stuffing on /login (no rate limit, no captcha after N failures)
- Account enumeration via differential responses on /login or /forgot
- Password reset token guessable / unbounded validity / reusable
- JWT `alg: none`, `alg` confusion, signing key in repo
- OAuth `state` missing -> CSRF on link account
- Session fixation, session not rotated on privilege change
- MFA bypass via "remember device" cookie with no binding

### Authorization

- IDOR via `?id=`, `/users/123`
- BFLA: regular user calls admin endpoint that exists but is not linked
- Mass assignment: setting `is_admin` in a profile update
- Tenant cross-talk in shared tables (no `WHERE tenant_id` enforced)
- Frontend-only role check (server trusts the JWT claim without re-verifying)

### Data and storage

- Backups public or readable by anyone in the cloud account
- Logs contain tokens / PII / passwords
- Third-party error tracker receives full stack with PII
- Database snapshot shared with a wrong account ID

### Crypto

- Passwords hashed with SHA-256 (see `applied-cryptography.md`)
- Hand-rolled crypto, ECB mode, static IV
- TLS 1.0/1.1 still enabled, weak ciphers
- Signing key in environment variable, never rotated

### Supply chain

- Direct dep with known CVE, no policy to patch
- Transitive dep with known CVE
- Typo-squatted package, dependency confusion
- CI uses `actions/checkout@main` (mutable ref)

### Agent / LLM

- Indirect prompt injection via fetched content
- Tool with too-broad scope (`exec_shell` instead of `git_commit`)
- Confused deputy: agent runs as a powerful user, takes a low-trust user's instructions
- Output of one tool is fed to another without sanitization

### Operational

- Single point of failure with no failover
- No incident runbook (see `incident-playbooks.md`)
- No way to revoke a compromised user session at scale
- No detection on the high-value action you are most worried about

---

## Sample 90-minute workshop agenda

Pre-work for the team (must be done the day before, not in the room):

- Read the design doc.
- Skim this file and `owasp-top10.md`.
- Bring laptops.

| Time   | Activity |
|--------|----------|
| 0:00 - 0:10 | Scope and goals. What feature, what is in/out, who is the attacker we care about. |
| 0:10 - 0:25 | Draw the DFD on a whiteboard / Excalidraw / draw.io. Mark trust boundaries. |
| 0:25 - 0:35 | List assets and what "compromise" means for each (CIA + privacy). |
| 0:35 - 1:05 | STRIDE walk per element. Timebox 30 minutes. One scribe captures threats in a markdown table. |
| 1:05 - 1:20 | Triage: for each threat, decide mitigate / accept / transfer / eliminate. Owner + due date. |
| 1:20 - 1:30 | Wrap-up. Confirm follow-up tickets exist. Schedule a 15-minute retro after the feature ships. |

Output (commit this in the repo):

```markdown
# Threat model: <feature>

- Date:
- Facilitator:
- Participants:

## DFD
![](./threat-model.drawio.svg)

## Assumptions
- ...

## Threats
| ID | Element | STRIDE | Threat | Likelihood | Impact | Mitigation | Owner | Status |
|----|---------|--------|--------|------------|--------|------------|-------|--------|
| 01 | /upload process | T | Polyglot SVG XSS | Med | High | DOMPurify on render, CSP | @alice | Open |
| 02 | S3 store        | I | Bucket public | Low | Critical | Block public access, CIS scan | @bob | Done |

## Decisions and accepted risks
- ...
```

---

## Pitfalls (from real workshops)

- **Boil the ocean** - trying to model the whole system. Always scope to a feature.
- **No diagram** - skipping the DFD because "we all know how it works". You do not.
- **No follow-through** - threats become tickets or the session was theater.
- **One person modeling alone** - threat modeling is a team activity. Different roles surface different threats.
- **Treat it as a phase gate** - it should be continuous, not a one-time signoff.
- **Use jargon to look smart** - if a junior dev cannot follow the session, you are doing it wrong.
- **Skip the retro** - go back after the feature ships and check which threats actually materialized. That is how you calibrate.

---

## Linking to the rest of this repo

| Threat surfaced | Where to find mitigations |
|-----------------|---------------------------|
| Injection of any kind | `language-patterns.md`, `database-security.md` |
| Auth / session | `authorization-rbac.md`, `framework-examples.md` |
| Crypto | `applied-cryptography.md` |
| Supply chain | `supply-chain-security.md` |
| Cloud misconfig | `cloud-iam-hardening.md`, `container-k8s-hardening.md` |
| LLM / agent | `llm-agent-security.md`, `mcp-security.md` |
| Privacy (LINDDUN) | `privacy-data-minimization.md` |
| Detection / response | `incident-playbooks.md`, `vuln-management.md` |
