---
title: "WebAuthn / FIDO2 Implementation Guide"
slug: webauthn-fido2
category: iam
depth: 2
audit_level: [2, 3]
last_reviewed: 2026-04-14
sources:
  - "W3C Web Authentication Level 3"
  - "FIDO Alliance Passkeys guidance"
triggers_strong: ["webauthn", "fido2", "passkeys", "phishing resistant mfa"]
triggers_weak: ["strong authentication", "passkey rollout"]
related: ["session-management", "authorization-rbac"]
---

# WebAuthn / FIDO2 Implementation Guide

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: Recommended | Audit Level: 2-3 | Automation: Partial (registration/login tests and RP/origin checks automatable; recovery design and rollout policy manual)

Use this guide when implementing **phishing-resistant authentication** with passkeys / WebAuthn instead of relying only on passwords, SMS OTP, or TOTP.

WebAuthn is not just a UI button. The security comes from correct server-side verification, correct origin/RP binding, and a sane recovery model.

---

## 1. Recommended Defaults

- Require HTTPS.
- Set the correct **RP ID** and verify the expected **origin**.
- Generate a fresh random challenge for every registration and authentication ceremony.
- Expire challenges quickly and bind them to the user/session initiating the ceremony.
- Prefer **user verification** for sensitive apps.
- Default attestation to `none` unless you have a real hardware attestation requirement.

---

## 2. Registration Flow

Server responsibilities:

1. Authenticate the user or otherwise verify they are allowed to add a credential.
2. Generate a challenge and store it server-side with short expiry.
3. Send publicKeyCredentialCreationOptions to the browser.
4. Verify the returned attestation object and client data.
5. Store:
   - credential ID,
   - public key,
   - RP ID,
   - user handle if used,
   - transports if available,
   - signature counter / related metadata if your library exposes it.

Client example:

```js
const credential = await navigator.credentials.create({
  publicKey: creationOptionsFromServer,
});
```

Do not trust browser success alone. The server must verify the attestation response.

---

## 3. Authentication Flow

Server responsibilities:

1. Generate a fresh challenge.
2. Send publicKeyCredentialRequestOptions.
3. Verify:
   - challenge,
   - origin,
   - RP ID hash,
   - signature,
   - user presence / verification flags according to policy.
4. Update stored authenticator state.

Client example:

```js
const assertion = await navigator.credentials.get({
  publicKey: requestOptionsFromServer,
});
```

---

## 4. Server Verification Checklist

| Check | Why it matters |
|-------|----------------|
| Challenge matches and is unused | Prevent replay |
| Origin matches expected app origin | Prevent phishing / origin confusion |
| RP ID hash matches your RP ID | Prevent credential use on the wrong site |
| Signature verifies against stored public key | Core authenticator proof |
| User verification policy enforced | Stops weaker ceremonies on sensitive apps |

Use a maintained server library; do not hand-roll WebAuthn verification.

---

## 5. User Verification, Resident Credentials, Passkeys

- For admin, finance, or sensitive internal tools, prefer **userVerification = required**.
- Use discoverable credentials / passkeys when you want username-less or low-friction sign-in.
- Be explicit about whether WebAuthn is:
  - first factor,
  - second factor,
  - step-up only.

Do not market "we support passkeys" if the account recovery path falls back to weak SMS with no additional checks.

---

## 6. Signature Counter Caveat

Older guidance often treated `signCount` as a hard anti-cloning control. In practice:

- some authenticators do not increment reliably,
- synced passkey ecosystems can reduce the value of a simple monotonic-counter assumption.

Treat unexpected counter behavior as a **risk signal**, not the only decision point. Combine it with:

- device/session history,
- geovelocity anomalies,
- recovery events,
- account sensitivity.

---

## 7. Recovery Model

Recovery is where strong authentication programs often fail.

Recommended options:

- another registered passkey/security key,
- recovery codes stored offline,
- existing authenticated session with step-up,
- helpdesk recovery with strong identity verification for workforce apps.

Avoid weak fallback becoming the real primary auth path.

---

## 8. Rollout Patterns

| Pattern | Use when |
|---------|----------|
| Password + WebAuthn as MFA | easiest initial rollout |
| Passwordless passkey | consumer or workforce apps ready for full passkey UX |
| Step-up only | admin actions, finance approval, high-risk operations |

Recommended rollout:

1. add passkey enrollment after normal login,
2. require it for admins/high-risk users first,
3. expand to sensitive workflows,
4. monitor recovery and helpdesk friction,
5. then consider passwordless.

---

## 9. Common Failure Modes

- Challenge stored client-side only.
- Origin/RP checks missing or too broad.
- Registration allowed without a trusted existing session.
- WebAuthn added, but recovery remains weak and bypassable.
- Passkeys supported, but risky actions still rely on stale sessions with no step-up.
- Credentials not removable or auditable by the user/admin.

---

## 10. Checklist

| Check | Expected |
|-------|----------|
| Challenges are random, short-lived, and single-use | Yes |
| Origin and RP ID are verified server-side | Yes |
| Attestation is `none` unless there is a real device-trust need | Yes |
| User verification policy is explicit | Yes |
| Recovery path is documented and stronger than SMS fallback | Yes |
| Admin / high-risk actions use WebAuthn as step-up or stronger | Yes |

---

## References

- `security-improvements.md`
- `authorization-rbac.md`
- `session-management.md`
- `social-engineering-physical.md`

