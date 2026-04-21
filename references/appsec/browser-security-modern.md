---
title: "Modern Browser Security"
slug: browser-security-modern
category: appsec
depth: 3
audit_level: [2, 3]
last_reviewed: 2026-04-21
sources:
  - "MDN Content-Security-Policy"
  - "MDN Permissions-Policy"
  - "MDN Subresource Integrity"
  - "W3C CSP Level 3 — https://www.w3.org/TR/CSP3/"
  - "W3C Trusted Types — https://www.w3.org/TR/trusted-types/"
  - "IETF RFC 6265bis (HTTP cookies) — https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/"
triggers_strong: ["trusted types", "permissions policy", "coop coep", "sri"]
triggers_weak: ["browser security", "client-side hardening"]
related: ["secure-headers", "frontend-frameworks-security"]
---

# browser-security-modern.md

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: Essential | Audit Level: 2-3 | Automation: Partial (CSP/COOP/COEP headers automatable via helmet or CF Workers; Trusted Types and SRI review manual)

This document complements `secure-headers.md`. The goal is not to pile on headers "at random", but to address attacks that get through **after** classic defenses:

- DOM XSS in modern sinks,
- cross-origin leaks and context confusion,
- abuse of third-party subresources,
- overly broad browser permissions,
- WebSocket / Worker / WASM / SharedArrayBuffer surfaces,
- poorly understood isolation policies.

---

## 1) Trusted Types

`Trusted Types` hardens **DOM injection sinks** (`innerHTML`, `insertAdjacentHTML`, `srcdoc`, certain script/URL sinks, etc.) by requiring that input passes through an explicit **policy**.

### Minimal CSP

```http
Content-Security-Policy:
  require-trusted-types-for 'script';
  trusted-types app-sanitize;
```

### Recommended pattern

- A **single** policy or very few named policies.
- A transformation function that:
  - sanitizes the HTML,
  - rejects unapproved URLs/scripts,
  - centralizes exceptions.
- Deploy first in **report-only** mode if the frontend is legacy.

### Example

```js
if (typeof trustedTypes === "undefined") {
  // tinyfill: keeps the same code path in browsers without enforcement
  trustedTypes = { createPolicy: (_name, rules) => rules };
}

const policy = trustedTypes.createPolicy("app-sanitize", {
  createHTML: (input) => DOMPurify.sanitize(input),
});

const trustedHTML = policy.createHTML(userSuppliedHtml);
document.querySelector("#content").innerHTML = trustedHTML;
```

### What Trusted Types does not do

- does not replace actual sanitization,
- does not fix a backend that returns dangerous HTML,
- does not protect legacy code if you keep escape hatches everywhere.

### What to avoid

- multiple "temporarily" permissive policies that become permanent,
- a "default" policy that returns almost anything,
- keeping `'unsafe-inline'` and believing TT compensates for everything.

---

## 2) Sanitizer API

The `Sanitizer API` provides native browser sanitization for certain DOM use cases.

### When to use it

- **progressive enhancement**,
- controlled surfaces for rich HTML rendering,
- experiments where you want to avoid a heavy JS dependency.

### When not to rely on it alone

- heterogeneous browser fleet,
- need for identical behavior everywhere,
- need for a tightly controlled sanitization policy.

### Example

```js
const sanitizer = new Sanitizer();
const safe = Document.parseHTMLUnsafe(untrustedHtml, { sanitizer });
document.querySelector("#preview").replaceChildren(...safe.body.childNodes);
```

### Practical stance

- Keep **DOMPurify** (or equivalent) as a portable baseline.
- Use Sanitizer API as an optimization / progressive enhancement.
- If combining with Trusted Types, produce a `TrustedHTML` through your policy.

---

## 3) COEP / COOP / CORP in practice

These three headers serve to properly isolate your document and its subresources.

### Concrete case: SharedArrayBuffer

If you want `SharedArrayBuffer`, WebAssembly threads, or a strong isolation profile, you generally need:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

and compatible subresources (CORS or CORP).

### Roles

- **COOP** (`Cross-Origin-Opener-Policy`)  
  Isolates the page from other opener contexts to prevent certain process/context sharing.
- **COEP** (`Cross-Origin-Embedder-Policy`)  
  Prohibits embedding cross-origin resources that are not explicitly shareable.
- **CORP** (`Cross-Origin-Resource-Policy`)  
  Declares on the resource side whether it can be loaded cross-origin.

### Typical example

Main page:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

JS/wasm/font served by your CDN:

```http
Cross-Origin-Resource-Policy: same-site
```

### Classic pitfall

You enable COEP/COOP and suddenly:

- a third-party analytics script no longer loads,
- an external font breaks,
- a payment iframe no longer works,
- `window.crossOriginIsolated` stays `false`.

### Deployment method

1. Inventory **all** subresources and iframes.
2. Decide what must be self-hosted.
3. Have CORS/CORP corrected on the necessary resources.
4. Test `window.crossOriginIsolated === true`.
5. Deploy per environment with monitoring.

### `credentialless`

`Cross-Origin-Embedder-Policy: credentialless` can help in certain scenarios, but browser compatibility and the expected behavior of credentialless requests must be tested carefully.

---

## 4) Fetch Metadata (`Sec-Fetch-*`)

The `Sec-Fetch-Site`, `Sec-Fetch-Mode`, `Sec-Fetch-Dest`, `Sec-Fetch-User` headers give the server the **origin context** and usage of the request.

### Very useful for

- CSRF,
- XSSI / XS-Leaks,
- admin endpoints,
- endpoints that should never be called cross-site.

### Simple policy

- allow:
  - `same-origin`,
  - `same-site` if your subdomains are trusted,
  - `none` (direct navigation, bookmark, address bar),
  - `GET + navigate` for public pages;
- block cross-site writes by default (`POST`, `PUT`, `PATCH`, `DELETE`) on sensitive endpoints.

### Pseudo-code

```js
function isAllowed(req) {
  const site = req.headers["sec-fetch-site"] || "";
  const mode = req.headers["sec-fetch-mode"] || "";

  if (site === "same-origin" || site === "none") return true;
  if (site === "same-site" && req.path.startsWith("/public/")) return true;
  if (req.method === "GET" && mode === "navigate") return true;

  return false;
}
```

### Important

- Add `Vary: Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest`.
- Provide an explicit allowlist for genuine public CORS APIs.
- Do not replace CSRF tokens with Fetch Metadata alone on the most sensitive flows.

---

## 5) Subresource Integrity (SRI) with hash pinning

SRI protects against the compromise or corruption of a third-party or CDN resource.

### Example

```html
<script
  src="https://cdn.example.net/app.v123.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"></script>
```

### Best practices

- Pin **each version** of an asset.
- Generate hashes in the CI/CD pipeline.
- Store a versioned manifest.
- Avoid "always the same resource" URLs if the content changes without updating the hash/version.
- Self-host if the asset is critical and rarely updated.

### Pitfalls

- For a cross-origin resource, SRI also requires correct CORS behavior.
- A loader/script manager tag can break your pinning model if assets change outside the pipeline.
- A hash that changes frequently without governance becomes mere operational noise.

### Pragmatic hash pinning

- critical and stable assets: **strict hash pinning**,
- non-critical analytics: ideally self-host or at minimum explicit version + vendor review,
- never "load a mutable remote script and see what happens".

---

## 6) Permissions Policy in detail

`Permissions-Policy` controls which sensitive APIs are usable by your document and its iframes.

### Starting header

```http
Permissions-Policy:
  camera=(),
  microphone=(),
  geolocation=(),
  payment=(),
  usb=(),
  serial=()
```

### Quick reference

- `()` = no one has access.
- `(self)` = only your origin.
- `("https://widget.example")` = explicit delegation to an origin.

### Common directives to address explicitly

- `camera`
- `microphone`
- `geolocation`
- `payment`
- `usb`
- `serial`

### Example with targeted delegation to a trusted iframe

```http
Permissions-Policy:
  camera=(),
  microphone=(),
  geolocation=(self),
  payment=("https://payments.example"),
  usb=(),
  serial=()
```

### Anti-pattern

- Defining nothing and leaving browser defaults in place.
- Delegating too broadly to all iframes of a parent domain.
- Forgetting to review the policy after adding an SDK or a third-party widget.

---

## 7) CSP nonce vs hash: trade-offs

| Approach | When to use | Advantages | Disadvantages |
|---|---|---|---|
| **Nonce** | Dynamic SSR HTML, inline scripts generated by the server | flexible, compatible with inline content that changes per response | must be **random per response**, injected everywhere correctly, watch out for caching |
| **Hash** | stable inline snippets, minimal bootstrap, very static pages | no random value per response, easier to audit on static content | breaks as soon as inline content changes, heavier maintenance on dynamic HTML |

### Simple rules

- If you can, **remove the inline**.
- Otherwise, prefer:
  - **nonce** for dynamic HTML,
  - **hash** for stable snippets.
- Avoid `'unsafe-inline'`.
- If using `strict-dynamic`, be very clear about what is bootstrapped and by whom.

---

## 8) Origin-Agent-Cluster (OAC)

```http
Origin-Agent-Cluster: ?1
```

OAC requests that the origin be isolated in an **origin-keyed agent cluster**.

### What it provides

- better performance/memory isolation between origins,
- less implicit sharing with same-site but cross-origin pages,
- useful when an origin hosts heavy processing.

### What it is not

- **not** a strong security boundary on its own,
- **not** a replacement for COOP/COEP/CORP.

### Important rule

Deploy OAC on **all** pages of the origin, or on **none**.  
Behavior is more predictable that way.

---

## 9) Document-Policy

`Document-Policy` is useful for **enforcing or reporting** certain document behaviors (e.g. prohibiting `document.write`, reporting certain problematic usages).

### Practical stance

- consider this feature **experimental / draft**,
- most useful in a lab environment or on a well-controlled browser fleet,
- do not make it a sole critical control.

### Conceptual example

```http
Document-Policy: document-write=?0
```

### Good use

- reporting usage of legacy patterns you want to eliminate,
- progressively hardening a historical frontend.

### Bad use

- believing it replaces CSP, Trusted Types, or a genuine legacy code overhaul.

---

## 10) Attribution Reporting

The Attribution Reporting API has a product/ad measurement interest, not a real defensive application security role. Furthermore, the technology is now **deprecated** in modern documentation.

### Recommendation

- **Do not adopt** for greenfield security work.
- If you already have it:
  - isolate it behind a flag,
  - document the business need,
  - plan its removal.

---

## Summary table: feature -> mitigated attack -> browser support

> **Note**: this table is intentionally qualitative. Verify exact compatibility on your actual browser fleet before global activation.

| Feature | Mitigated attack / risk | Browser support (practical 2026) |
|---|---|---|
| Trusted Types | DOM XSS, injection into HTML/script/URL sinks | available in recent major versions; verify legacy fleet |
| Sanitizer API | HTML injection in some rendering flows | limited availability; treat as progressive enhancement |
| COOP + COEP + CORP | XS-Leaks, context confusion, prerequisite for SharedArrayBuffer/cross-origin isolation | modern support, but strong compatibility testing needed with third-party assets |
| Fetch Metadata | CSRF, XSSI, XS-Leaks, unexpected cross-site calls | broadly usable on modern browsers, with variations by header |
| Subresource Integrity | CDN / third-party asset compromise | broadly supported |
| Permissions Policy | abuse of sensitive APIs (camera, mic, geolocation, payment, USB, serial) | mixed support / limited availability depending on directives |
| Origin-Agent-Cluster | better process/context isolation and reduced same-site cross-origin interference | useful modern support, but validate against target fleet |
| Document-Policy | reduction/reporting of legacy document patterns | experimental / draft |
| Attribution Reporting | no direct defensive security benefit | deprecated; avoid for new deployments |

---

## Drop-in Nginx headers (complement to `secure-headers.md`)

> **Important**: the nonce must be generated **per response**, on the application side or a component capable of producing a cryptographically strong random value. The `$csp_nonce` placeholder below is intentional.

```nginx
# Modern complementary baseline
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Resource-Policy "same-site" always;
add_header Origin-Agent-Cluster "?1" always;

add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Content-Type-Options "nosniff" always;

# Modern CSP: merge with your existing CSP
add_header Content-Security-Policy "
  default-src 'self';
  base-uri 'none';
  object-src 'none';
  frame-ancestors 'none';
  script-src 'self' 'nonce-$csp_nonce' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https:;
  require-trusted-types-for 'script';
  trusted-types app-sanitize
" always;
```

### Useful variants

- If you depend on incompatible third parties, start by **not enabling COEP** everywhere.
- If you need cross-origin iframes, test the exact effect of `COOP: same-origin` carefully.
- If your app is highly static, replace nonces with **CSP hashes**.

---

## Cloudflare Workers: headers + Fetch Metadata guard

```js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Fetch Metadata guard for sensitive endpoints
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/account")) {
      const site = request.headers.get("sec-fetch-site") || "";
      const mode = request.headers.get("sec-fetch-mode") || "";

      const allowed =
        site === "same-origin" ||
        site === "none" ||
        (request.method === "GET" && mode === "navigate");

      if (!allowed) {
        return new Response("Forbidden", { status: 403 });
      }
    }

    const response = await fetch(request);
    const headers = new Headers(response.headers);

    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    headers.set("Cross-Origin-Resource-Policy", "same-site");
    headers.set("Origin-Agent-Cluster", "?1");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.append("Vary", "Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest");

    // Example: CSP without nonce. For a real SSR app, inject a nonce on the origin side.
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; " +
      "script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; " +
      "connect-src 'self' https:; require-trusted-types-for 'script'; trusted-types app-sanitize"
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
```

---

## Recommended progressive deployment

1. **Measure before blocking**: CSP report-only, subresource inventory, Fetch Metadata logs.
2. **Reduce permissions**: camera/microphone/geolocation/payment/usb/serial to `()`.
3. **Enable Trusted Types** on the surfaces most exposed to HTML.
4. **Test cross-origin isolation** if you need SAB/WASM threads.
5. **Pin third-party assets** with SRI.
6. **Apply OAC** consistently across the origin.
7. **Treat Document-Policy and Attribution Reporting** as non-priority / advanced.

---

## Quick reference

- **Trusted Types**: to stop modern DOM XSS.
- **Sanitizer API**: a bonus, not a universal foundation.
- **COOP/COEP/CORP**: to properly isolate contexts and unlock SAB.
- **Fetch Metadata**: to filter out nonsensical cross-site calls.
- **SRI**: to avoid blindly trusting third parties.
- **Permissions Policy**: to close sensitive APIs by default.
- **OAC**: to isolate the origin more cleanly.
- **Document-Policy**: experimental, useful for hunting down legacy.
- **Attribution Reporting**: deprecated, outside the defensive roadmap.

---

## GDPR relevance

Several browser security controls have a direct mapping to GDPR obligations, primarily **Art. 25 (privacy by design/default)** and **Art. 32 (security of processing)**. They are not privacy controls in isolation, but they reduce the technical risk of personal data exposure at the browser layer.

| Feature | GDPR Article | Rationale |
|---|---|---|
| **Permissions Policy** | Art. 25 — Privacy by default; Art. 7 — Conditions for consent | Restricting camera, microphone, geolocation, and payment APIs to `()` by default implements privacy-by-default at the browser API layer. Where these APIs require user consent (e.g. geolocation for a location feature), the Permissions Policy delegation must align with the consent signal collected by the CMP. A mismatch (policy allows, consent not collected, or vice versa) is an Art. 7 / Art. 25 finding. |
| **COOP + COEP + CORP** | Art. 32 — Security of processing; Art. 5(1)(f) — Confidentiality | Cross-origin isolation prevents timing side-channels and Spectre-class attacks that could leak personal data across origins. For applications handling special-category data (Art. 9), cross-origin isolation is a proportionate technical measure under Art. 32(1). |
| **Trusted Types + Sanitizer API** | Art. 32 — Security of processing | DOM XSS is one of the primary vectors for in-browser personal data exfiltration. Enforcing Trusted Types closes the most common injection sinks that attackers use to steal session tokens, form data, and page content containing personal data. |
| **Subresource Integrity (SRI)** | Art. 32 — Security of processing; Art. 28 — Processor obligations | Third-party scripts loaded without integrity pinning can be silently replaced (supply chain compromise) to exfiltrate personal data entered on the page. SRI ensures the third-party processor (CDN / analytics vendor) cannot deliver modified code without detection. The CDN relationship may also require a DPA under Art. 28. |
| **Fetch Metadata guard** | Art. 32 — Security of processing | Blocking unexpected cross-site writes (CSRF) on endpoints that process personal data prevents unauthorized modification of data subject records — an integrity obligation under Art. 5(1)(f). |
| **Referrer-Policy: strict-origin-when-cross-origin** | Art. 5(1)(c) — Minimisation; Art. 25 — Privacy by default | Full referrer URLs can contain personal data (e.g. `/users/12345/profile`, search queries with names or health terms). A strict Referrer-Policy prevents leaking these to third-party origins by default. |
| **Attribution Reporting (deprecated)** | Art. 6 — Legal basis; Art. 25 — Privacy by default | Attribution Reporting enables cross-site tracking for advertising measurement. If used, it requires a legal basis (legitimate interest or consent), a DPIA if large-scale profiling is involved, and must be reviewed against ePrivacy / cookie law. Current deprecation trajectory makes this a non-recommended path. |

### Consent and CMP alignment

The Permissions Policy must be reviewed alongside the Consent Management Platform (CMP) configuration:

1. If the CMP collects consent for geolocation, the Permissions Policy must allow `geolocation=(self)` only after that consent is confirmed — never unconditionally.
2. If the CMP does not collect consent for a sensor API (camera, microphone), the Permissions Policy must set that API to `()`.
3. CMP configuration screenshots and Permissions Policy headers together constitute the Art. 7 / Art. 25 evidence package an auditor expects.

### Privacy-by-design checklist for browser layer

- [ ] Permissions Policy reviewed against CMP consent categories.
- [ ] No third-party script loaded without SRI and a valid Art. 28 DPA with the CDN/vendor.
- [ ] Referrer-Policy set to `strict-origin-when-cross-origin` or stricter on pages with personal data in URLs.
- [ ] COOP/COEP assessed for surfaces processing special-category data (Art. 9).
- [ ] Trusted Types enforced (or report-only with a tracked remediation plan) on forms collecting personal data.
- [ ] Attribution Reporting not enabled without a documented legal basis and DPIA review.

