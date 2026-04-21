---
title: "SSRF, Deserialization & Command Injection"
slug: ssrf-deserialization-command-injection
category: appsec
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "OWASP SSRF Prevention Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html"
  - "OWASP Deserialization Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html"
  - "OWASP API Security Top 10 2023 — https://owasp.org/API-Security/editions/2023/en/0x00-header/"
  - "CWE-78: OS Command Injection — https://cwe.mitre.org/data/definitions/78.html"
  - "CWE-502: Deserialization of Untrusted Data — https://cwe.mitre.org/data/definitions/502.html"
  - "CWE-918: Server-Side Request Forgery — https://cwe.mitre.org/data/definitions/918.html"
  - "RFC 8725 JWT BCP — https://datatracker.ietf.org/doc/rfc8725/ (2020-02)"
triggers_strong: ["ssrf", "unsafe deserialization", "command injection", "shell true", "pickle loads", "yaml load"]
triggers_weak: ["remote fetch review", "parser risk", "process execution"]
related: ["api-security", "language-patterns", "security-diff-review", "cloud-iam-hardening"]
---

# SSRF, Deserialization & Command Injection

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Essential | Audit Level: 2-4 | Automation: Partial (pattern search, dependency checks, outbound network policy, and some lint rules automatable; business-logic reachability, parser trust review, and exploitability analysis manual)

Use this guide when code accepts **URLs**, **serialized objects**, **archives**, **YAML/XML payloads**, or **user-controlled input that reaches a shell or system command**.

These issues look different on the surface, but the security pattern is the same: untrusted input reaches a more powerful interpreter, parser, or executor than the developer intended.

---

## 1. Why these bugs are high impact

These classes often turn a small coding shortcut into a control-plane incident:

- SSRF can steal cloud credentials, reach internal admin panels, or pivot into trusted networks.
- Unsafe deserialization can create objects, invoke gadget chains, or trigger code execution.
- Command injection can break out of intended argument boundaries and execute arbitrary system commands.

They are dangerous because they cross trust boundaries quickly:

- external input -> internal network,
- attacker-controlled bytes -> privileged parser,
- application string -> shell execution.

If a feature does remote fetch, dynamic parsing, or OS interaction, review depth should increase immediately.

---

## 2. Minimum baseline

| Risk area | Minimum expectation |
|---|---|
| SSRF | allowlist destinations where possible, block internal ranges and metadata endpoints, validate after DNS resolution, restrict redirects |
| Deserialization | prefer simple data formats, never deserialize untrusted native objects by default, use safe loaders and schemas |
| Command execution | avoid shell invocation when possible, pass arguments as arrays, allowlist commands and flags, bound environment and working directory |
| Observability | log intent and decision, not raw secrets or full sensitive payloads |
| Containment | outbound egress policy, runtime least privilege, secret scoping, short-lived credentials |

---

## 3. SSRF

### 3.1 What to look for

High-risk patterns include:

- URL previewers,
- image or document importers,
- webhook validators,
- PDF renderers or headless browsers,
- integrations that "test connection" to a user-supplied endpoint,
- server-side fetch from user-controlled URLs.

### 3.2 Core rule

Do not let the caller choose an arbitrary destination for a privileged server-side request.

Prefer one of these models:

- fixed vendor endpoints,
- identifier-to-destination mapping controlled by the server,
- strict allowlist of domains or service aliases,
- asynchronous fetch worker with egress restrictions.

### 3.3 Validation rules

If you must accept a destination, enforce all of these:

- allowed scheme only, usually `https`,
- normalized hostname parsing,
- deny loopback, link-local, RFC1918, ULA, multicast, and internal control-plane ranges,
- deny cloud metadata targets,
- verify again after DNS resolution,
- restrict redirects or re-validate every redirect hop,
- keep ports on an allowlist,
- set low timeouts and response size limits.

### 3.4 High-signal SSRF failure modes

| Failure | Why it matters |
|---|---|
| blocklist by string match only | `localhost`, dotted-decimal, IPv6, or encoded variants bypass it |
| DNS checked once, request sent later | DNS rebinding or dual-resolution issues |
| redirects trusted automatically | attacker pivots from allowed host to internal host |
| metadata endpoint reachable | cloud role credentials may leak |
| same fetcher used for both public internet and internal integrations | trust boundary collapse |
| response body returned directly | internal data exfiltration becomes trivial |

### 3.5 Safer pattern

```python
from urllib.parse import urlparse
import ipaddress
import socket

ALLOWED_SCHEMES = {"https"}
BLOCKED_IPS = {
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
}

def allowed_destination(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_SCHEMES:
        return False
    if not parsed.hostname:
        return False
    answers = socket.getaddrinfo(parsed.hostname, parsed.port or 443, type=socket.SOCK_STREAM)
    for answer in answers:
        addr = ipaddress.ip_address(answer[4][0])
        if any(addr in net for net in BLOCKED_IPS):
            return False
    return True
```

This still needs redirect control, timeout limits, and ideally egress policy at the network layer.

### 3.6 Cloud-specific rule

If the application runs in cloud infrastructure, assume SSRF to metadata is a live threat until proven otherwise.

Protect with:

- IMDSv2 or equivalent where available,
- network controls that block metadata from untrusted workloads,
- least-privilege workload roles,
- no long-lived cloud keys sitting in environment variables.

---

## 4. Unsafe deserialization

### 4.1 Core rule

Treat native object deserialization of untrusted data as unsafe by default.

Prefer:

- JSON into explicit schemas,
- primitive fields only,
- safe YAML parsers,
- fixed message formats,
- signed and versioned internal messages where object graphs are unavoidable.

Avoid:

- Python `pickle.loads` on user-controlled data,
- Java `ObjectInputStream` for untrusted streams,
- PHP `unserialize` on attacker-controlled input,
- unsafe YAML loaders,
- XML parsers with dangerous entity behavior when not locked down.

### 4.2 Why deserialization becomes code execution

The risk is not only "data becomes object." The risk is that constructors, magic methods, or gadget chains may run during or after load.

That creates paths like:

- object creation with attacker-controlled types,
- file writes or process launch from magic methods,
- remote class or gadget invocation,
- policy bypass because validation occurs after deserialization.

### 4.3 Safer examples

```python
# Unsafe
import pickle
obj = pickle.loads(request_body)

# Safer
from pydantic import BaseModel

class InvoiceRequest(BaseModel):
    invoice_id: str
    locale: str | None = None

payload = InvoiceRequest.model_validate_json(request_body)
```

```python
# Unsafe YAML
import yaml
config = yaml.load(user_text, Loader=yaml.Loader)

# Safer YAML
config = yaml.safe_load(user_text)
```

### 4.4 Review questions

- Is the format intended for untrusted input or only internal trusted messages?
- Does the parser create arbitrary types or execute hooks?
- Can the input select a class, file path, or function name?
- Is validation happening before dangerous interpretation or only after?
- Can the same parser be reached from uploads, queues, caches, or support tooling?

### 4.5 Deserialization red flags

| Pattern | Risk |
|---|---|
| `pickle.loads`, `marshal.loads`, `yaml.load` with broad loader | unsafe object creation |
| `unserialize` or equivalent on cookie/session field | attacker-controlled gadget entry point |
| message format includes class name or type discriminator from caller | arbitrary type selection |
| archived config import with automatic object binding | hidden parser trust boundary |
| XML parser with external entity support | XXE, SSRF, file disclosure |

---

## 5. Command injection

### 5.1 Core rule

Do not build shell commands by string concatenation when untrusted input influences any part of the command.

Prefer:

- library call instead of shell,
- argument array instead of shell string,
- fixed executable path,
- allowlisted flags and subcommands,
- bounded environment variables,
- isolated worker user with minimal filesystem and network access.

### 5.2 Safer pattern

```python
import subprocess

# Unsafe
subprocess.run(f"convert {user_filename} output.png", shell=True)

# Safer
subprocess.run([
    "/usr/bin/convert",
    user_filename,
    "output.png",
], check=True, shell=False)
```

Using an argument array is necessary but not always sufficient. You still need to validate:

- file path,
- allowed executable,
- allowed flags,
- output location,
- timeout and resource usage.

### 5.3 High-signal failure modes

| Failure | Why it matters |
|---|---|
| `shell=True` with user input | shell metacharacters become execution primitives |
| user controls full command or flag | attacker changes behavior even without metacharacters |
| user controls file path passed to powerful tool | path traversal, overwrite, local file read |
| environment inherited blindly | tool may use attacker-controlled config, proxy, or library path |
| output returned directly | command output becomes exfiltration channel |

### 5.4 Strong defaults

- set explicit executable path,
- use fixed working directory,
- set timeout,
- drop privileges where possible,
- scrub environment variables,
- limit temp file and output paths,
- avoid invoking interpreters for tasks that can use native libraries.

---

## 6. Review heuristics for diffs

Search changed lines for:

- `requests.get(user_url)` or similar,
- `fetch(url)` on server side,
- `yaml.load`, `pickle.loads`, `ObjectInputStream`, `unserialize`,
- `subprocess`, `child_process`, `os.system`, `exec`, `Runtime.getRuntime()`,
- new upload/import/parsing feature,
- comments like "test connection", "preview", "import config", or "run tool".

If a diff adds any of these, review:

1. destination control,
2. parser safety,
3. command boundary,
4. logging and error exposure,
5. least-privilege runtime context.

---

## 7. Minimal verification tests

| Risk | Quick test |
|---|---|
| SSRF | try loopback, RFC1918, metadata, and redirect hop to blocked target |
| Unsafe deserialization | send payload selecting unexpected type or triggering unsafe loader path |
| YAML / XML parser risk | test external entity, alias explosion, or unsafe tag handling where relevant |
| Command injection | inject shell metacharacters, extra flags, or unexpected file paths |
| Response exfiltration | verify internal fetch response is never returned raw to caller |

Do not stop after the first blocklist bypass fails. Try alternate encodings, IPv6, redirect chains, and secondary parser paths.

---

## 8. Common anti-patterns

| Anti-pattern | Why it fails |
|---|---|
| "Only admins can call this fetch endpoint" | admin compromise still turns into internal pivot |
| "The hostname isn't localhost, so it's safe" | IP literals, DNS rebinding, and internal names bypass naive checks |
| "We use JSON except for one legacy import path" | the legacy path becomes the exploit path |
| "Argument array means no risk" | attacker may still control executable behavior through flags or paths |
| "The tool runs in Docker so it's fine" | container may still reach secrets, internal network, or control plane |

---

## 9. Review checklist

| Check | Expected |
|---|---|
| User input cannot choose arbitrary internal destinations | Yes |
| Metadata and internal ranges are blocked and re-validated after resolution | Yes |
| Untrusted input is not deserialized into native objects by default | Yes |
| Safe loaders and explicit schemas are used | Yes |
| Shell execution is avoided or strictly bounded | Yes |
| Runtime role, network, and filesystem access are scoped tightly | Yes |
| Errors and logs do not expose internal fetch targets or raw payloads | Yes |

---

## Resources

- `api-security.md`
- `language-patterns.md`
- `security-diff-review.md`
- `cloud-iam-hardening.md`
