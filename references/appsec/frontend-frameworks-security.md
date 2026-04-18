---
title: "Frontend Framework Security"
slug: frontend-frameworks-security
category: appsec
depth: 3
audit_level: [2, 3]
last_reviewed: 2026-04-03
sources:
  - "Next.js Content Security Policy documentation"
  - "Vue.js security guide"
  - "OWASP DOM based XSS Prevention Cheat Sheet"
triggers_strong: ["nextjs security", "react xss", "nuxt ssr leak", "dangerouslysetinnerhtml"]
triggers_weak: ["frontend security", "framework review"]
related: ["browser-security-modern", "secure-headers"]
---

# Frontend Framework Security (React, Next.js, Vue, Nuxt)

> Last reviewed: 2026-04-03 | Next review: 2026-10-03 | Priority: Recommended | Audit Level: 2-3 | Automation: Partial (ESLint security rules, Semgrep; SSR data leaks and prototype pollution manual)

Modern SPA and SSR frameworks introduce security risks beyond what classic OWASP XSS coverage addresses. This file covers the subtleties specific to React, Next.js, Vue, and Nuxt.

---

## 1. SSR Data Leaks (Next.js / Nuxt)

### The `__NEXT_DATA__` problem

Next.js injects the return value of `getServerSideProps` into the HTML as a JSON blob accessible at `window.__NEXT_DATA__`. This is visible to any user - including unauthenticated ones who view the page source.

```javascript
// Vulnerable - full database object returned to the page
export async function getServerSideProps({ req }) {
  const user = await db.user.findById(req.session.userId);
  return {
    props: { user },  // exposes: passwordHash, ssn, internalId, role, createdAt, ...
  };
}
```

Anyone can open DevTools or `curl` the page and see:
```html
<script id="__NEXT_DATA__" type="application/json">
  {"props":{"pageProps":{"user":{"id":1,"email":"alice@example.com","passwordHash":"$2b$10$...","ssn":"123-45-6789","role":"admin"}}}}
</script>
```

```javascript
// Safe - return only what the component needs to render
export async function getServerSideProps({ req }) {
  const user = await db.user.findById(req.session.userId);
  return {
    props: {
      user: {
        name: user.name,
        email: user.email,
        // nothing else
      },
    },
  };
}
```

**Audit command - check what's in `__NEXT_DATA__` of any page:**

```bash
curl -s https://yourapp.com/dashboard | grep -o '"__NEXT_DATA__"[^<]*' | head -c 2000
# Or in a browser: copy(JSON.stringify(window.__NEXT_DATA__, null, 2))
```

### Nuxt `useAsyncData` / `useFetch`

Same risk applies in Nuxt - data returned from server-side composables is serialized into the payload:

```javascript
// Vulnerable
const { data } = await useAsyncData('user', () =>
  $fetch(`/api/users/${id}`)  // returns full DB model
)

// Safe - project only what the page needs at the API layer
// GET /api/users/:id should return { name, email } - not the full model
```

### React Server Components

RSC responses are streamed as structured data - any prop passed from a Server Component to a Client Component is visible in the network response:

```jsx
// Vulnerable Server Component
async function UserProfile({ userId }) {
  const user = await getUser(userId);
  return <ProfileCard user={user} />;  // full user object in RSC payload
}

// Safe - project before passing to client
async function UserProfile({ userId }) {
  const user = await getUser(userId);
  return <ProfileCard name={user.name} avatar={user.avatarUrl} />;
}
```

---

## 2. DOM-Based XSS in Modern Frameworks

### React `dangerouslySetInnerHTML`

React escapes all JSX content by default, making standard XSS impossible. `dangerouslySetInnerHTML` bypasses this protection entirely.

```jsx
// Vulnerable - user-controlled HTML injected directly
function Comment({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

// Also vulnerable - href with user input
function Link({ url }) {
  return <a href={url}>Click</a>;  // javascript:alert(1) is valid here
}
```

```jsx
// Safe - sanitize with DOMPurify before using dangerouslySetInnerHTML
import DOMPurify from 'dompurify';

function Comment({ content }) {
  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// Safe - validate URL scheme
function Link({ url }) {
  const safeUrl = url.startsWith('https://') || url.startsWith('http://')
    ? url
    : '#';
  return <a href={safeUrl}>Click</a>;
}

// Safest - render as text, not HTML
function Comment({ content }) {
  return <div>{content}</div>;  // React escapes this automatically
}
```

### Vue `v-html`

```html
<!-- Vulnerable -->
<div v-html="userComment"></div>

<!-- Safe - use DOMPurify -->
<div v-html="sanitized(userComment)"></div>
```

```javascript
import DOMPurify from 'dompurify';

export default {
  methods: {
    sanitized(html) {
      return DOMPurify.sanitize(html);
    },
  },
};
```

### Template literals injected into DOM

```javascript
// Vulnerable
document.getElementById('output').innerHTML = `Hello, ${username}!`;

// Safe
document.getElementById('output').textContent = `Hello, ${username}!`;
// textContent never parses HTML
```

---

## 3. Prototype Pollution

**What it is:** Merging or cloning user-controlled objects in a way that sets properties on `Object.prototype`, affecting all objects in the application.

**Attack example:**

```javascript
// Attacker-controlled JSON input
const maliciousInput = JSON.parse('{"__proto__":{"isAdmin":true}}');

// Vulnerable deep merge function
function merge(target, source) {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === 'object') {
      merge(target[key] ??= {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

merge({}, maliciousInput);

// Now ALL objects inherit isAdmin: true
console.log({}.isAdmin);     // true - prototype poisoned
console.log([].isAdmin);     // true
```

**Escalation to RCE in Node.js:** Template engines like Handlebars and Pug read properties from the prototype chain. A polluted prototype can override template compilation behavior, leading to remote code execution.

**Common vulnerable libraries:**

| Library | Vulnerable version | Fixed in |
|---------|------------------|----------|
| lodash `_.merge` | < 4.17.12 | 4.17.12 |
| lodash `_.defaultsDeep` | < 4.17.12 | 4.17.12 |
| jQuery `$.extend(true, ...)` | < 3.4.0 | 3.4.0 |
| `qs` (query string) | < 6.7.3 | 6.7.3 |

**Mitigations:**

```javascript
// 1. Freeze Object.prototype (add to app entry point)
Object.freeze(Object.prototype);

// 2. Use Object.create(null) for hash maps (no prototype chain)
const cache = Object.create(null);
cache['__proto__'] = 'harmless string';  // does not pollute anything

// 3. Validate that JSON keys do not include __proto__, constructor, prototype
function safeMerge(target, source) {
  const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
  for (const key of Object.keys(source)) {
    if (FORBIDDEN_KEYS.has(key)) continue;   // skip dangerous keys
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] ??= {};
      safeMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

// 4. Use structuredClone (built-in since Node 17, modern browsers) - prototype-safe
const cloned = structuredClone(userInput);
```

**Detection:**

```bash
# Check for vulnerable lodash in your project
npm audit | grep lodash
# Or
grep -r "\"lodash\":" package-lock.json | head -5
```

---

## 4. Client-Side Secret Exposure

### The `NEXT_PUBLIC_` trap

Any environment variable prefixed with `NEXT_PUBLIC_` in Next.js is **bundled into the client-side JavaScript** and visible to anyone who downloads your app.

```bash
# .env.local - these are ALL exposed to the browser:
NEXT_PUBLIC_API_URL=https://api.example.com        # ok - not a secret
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_abc123        # CATASTROPHIC
NEXT_PUBLIC_DATABASE_URL=postgresql://...           # CATASTROPHIC
NEXT_PUBLIC_OPENAI_API_KEY=sk-...                   # CATASTROPHIC
```

```bash
# Audit: check what's actually in the client bundle
grep -r "NEXT_PUBLIC_" .env* .env.local 2>/dev/null

# After build - search the client bundle for secrets
grep -r "sk_live\|sk-\|postgresql://" .next/static/
```

```javascript
// Safe pattern - secrets only in server-side code
// pages/api/generate.js (runs server-side only)
export default async function handler(req, res) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // not NEXT_PUBLIC_
  const result = await openai.chat.completions.create({ ... });
  res.json({ result });
}

// Client calls the API route, never touches the key directly
const res = await fetch('/api/generate', { method: 'POST', body: JSON.stringify(prompt) });
```

**Same principle for Vite:** Variables prefixed with `VITE_` are exposed to the client. For Vue/Nuxt: `NUXT_PUBLIC_` is client-exposed; `NUXT_` (without PUBLIC) stays server-side.

---

## 5. CSRF in SPA Applications

SPAs are not immune to CSRF. If your app uses **cookie-based authentication**, cross-site requests from attacker-controlled pages can include those cookies.

**`SameSite` mostly solves it - but not completely:**

| `SameSite` value | Protection | Gap |
|-----------------|-----------|-----|
| `Strict` | Cookies not sent on any cross-site request | Breaks OAuth redirects, external links |
| `Lax` (default in modern browsers) | Cookies not sent on cross-site POST/fetch | Sent on top-level GET navigations |
| `None` | No protection | Must use with explicit CSRF tokens |

**Double-submit cookie pattern for SPAs:**

```javascript
// Server: set a CSRF token as a readable (non-HttpOnly) cookie
res.cookie('csrf_token', crypto.randomBytes(32).toString('hex'), {
  sameSite: 'strict',
  secure: true,
  // NOT httpOnly - the SPA needs to read it
});

// Client: read the cookie and add it as a request header
function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];
}

async function apiPost(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),  // attacker cannot read this from a cross-origin page
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
}

// Server: validate the header matches the cookie
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const cookieToken = req.cookies.csrf_token;
    const headerToken = req.headers['x-csrf-token'];
    if (!cookieToken || cookieToken !== headerToken) {
      return res.status(403).json({ error: 'CSRF validation failed' });
    }
  }
  next();
});
```

**Note:** If your API uses `Authorization: Bearer <token>` headers (not cookies), CSRF is not a concern - a cross-origin attacker cannot set custom headers.

---

## 6. Content Security Policy for SPAs

SPAs are challenging for CSP because inline scripts and `eval` are common.

**Why inline scripts break CSP:**

```html
<!-- This breaks with script-src 'self' -->
<script>window.__CONFIG__ = { apiUrl: "https://api.example.com" };</script>
```

**Solution: nonce-based CSP with Next.js middleware:**

```javascript
// middleware.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export function middleware(request) {
  const nonce = crypto.randomBytes(16).toString('base64');
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: https:`,
    `connect-src 'self' https://api.example.com`,
    `font-src 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
  ].join('; ');

  const response = NextResponse.next({
    request: { headers: new Headers({ 'x-nonce': nonce }) },
  });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}
```

```jsx
// app/layout.js - use the nonce on inline scripts
import { headers } from 'next/headers';

export default function RootLayout({ children }) {
  const nonce = headers().get('x-nonce');
  return (
    <html>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{
          __html: `window.__CONFIG__ = ${JSON.stringify(config)}`
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**CSP directives for SPAs:**

```
# Restrictive SPA CSP
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}' 'strict-dynamic';
  style-src 'self' 'nonce-{random}';
  connect-src 'self' https://api.yourapp.com;
  img-src 'self' data: https://cdn.yourapp.com;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  upgrade-insecure-requests;
```

**Test your CSP:** Mozilla Observatory (https://observatory.mozilla.org) and CSP Evaluator (https://csp-evaluator.withgoogle.com).

---

## Checklist

| Check | Expected |
|-------|----------|
| `getServerSideProps` / `useAsyncData` return only needed fields (no full DB objects) | Yes |
| `__NEXT_DATA__` audited for sensitive fields in staging | Yes |
| No secrets prefixed with `NEXT_PUBLIC_`, `VITE_`, `NUXT_PUBLIC_` | Yes |
| `dangerouslySetInnerHTML` / `v-html` always uses DOMPurify | Yes |
| `href` / `src` from user input validated for `javascript:` injection | Yes |
| Lodash (and other deep-merge libs) on non-vulnerable versions | Yes |
| `Object.freeze(Object.prototype)` or key validation in merge functions | Yes |
| CSRF protection: `SameSite=Strict/Lax` cookies, or double-submit pattern | Yes |
| CSP header set with nonce or hash-based `script-src` | Yes |
| `frame-ancestors 'none'` in CSP (or `X-Frame-Options: DENY`) | Yes |

---

## Resources

- OWASP DOM-based XSS Prevention Cheat Sheet
- OWASP CSRF Prevention Cheat Sheet
- Next.js security documentation - https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
- Vue.js security guide - https://vuejs.org/guide/best-practices/security
- DOMPurify - https://github.com/cure53/DOMPurify
- Prototype Pollution - Snyk research
- Mozilla Observatory - https://observatory.mozilla.org

