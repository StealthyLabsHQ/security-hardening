---
title: "Mobile Application Security"
slug: mobile-security
category: platform
depth: 2
audit_level: [2, 3]
last_reviewed: 2026-04-03
sources:
  - "OWASP Mobile Top 10 2024"
  - "OWASP MASVS"
triggers_strong: ["mobile security", "ios security", "android security", "masvs"]
triggers_weak: ["mobile app review", "client security"]
related: ["desktop-app-security", "session-management"]
---

# Mobile Application Security (iOS & Android)

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Recommended | Automation: Partial (MobSF, static analysis; cert pinning manual)


Reference: OWASP Mobile Top 10 (2024) and OWASP MASVS (Mobile Application Security Verification Standard).

---

## M1 - Improper Credential Usage

- Never hardcode API keys, tokens or passwords in source code or resource files.
- Use the platform secure storage (Keychain on iOS, Keystore on Android) for all secrets.
- Rotate secrets regularly and revoke compromised credentials immediately.

```swift
// iOS - store in Keychain
let query: [String: Any] = [
  kSecClass as String: kSecClassGenericPassword,
  kSecAttrAccount as String: "api_token",
  kSecValueData as String: tokenData
]
SecItemAdd(query as CFDictionary, nil)
```

```kotlin
// Android - store in EncryptedSharedPreferences
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
val prefs = EncryptedSharedPreferences.create(
    context, "secure_prefs", masterKey,
    AES256_SIV, AES256_GCM
)
```

---

## M2 - Inadequate Supply Chain Security

- Pin dependency versions; use lockfiles (`Podfile.lock`, `Package.resolved`, `gradle.lockfile`).
- Scan dependencies for CVEs: `trivy`, `snyk`, `dependency-check`.
- Verify checksums of downloaded SDKs.

---

## M3 - Insecure Authentication & Authorization

- Require biometric or PIN re-authentication before accessing sensitive features (not just at app launch).
- Validate authorization server-side on every API call; never trust the mobile client.
- Implement short-lived tokens (15-60 min) with rotating refresh tokens.

---

## M4 - Insufficient Input/Output Validation

- Validate and sanitize all data from deep links, QR codes, NFC, and clipboard.
- Use parameterized queries for SQLite (same as server-side SQL injection rules).
- Encode output before displaying in WebViews.

---

## M5 - Insecure Communication

**Certificate Pinning**

Prevent MITM even if a rogue CA is trusted on the device.

```swift
// iOS - URLSession with pinning
func urlSession(_ session: URLSession,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    guard let serverCert = challenge.protectionSpace.serverTrust,
          validatePin(serverCert) else {
        completionHandler(.cancelAuthenticationChallenge, nil)
        return
    }
    completionHandler(.useCredential, URLCredential(trust: serverCert))
}
```

- Enforce TLS 1.2+ for all network calls.
- Disable cleartext traffic (`android:usesCleartextTraffic="false"` in AndroidManifest).
- Use App Transport Security (ATS) on iOS (no exceptions without justification).

---

## M6 - Inadequate Privacy Controls

- Request only the permissions the app actually needs (camera, location, contacts).
- Do not log PII (names, emails, tokens) to logcat, NSLog, or crash reporters.
- Mask sensitive fields in screenshots (set `FLAG_SECURE` on Android, `isHidden` on sensitive iOS views).

---

## M7 - Insufficient Binary Protections

- Enable ProGuard / R8 (Android) or Bitcode + symbol stripping (iOS) to obfuscate compiled code.
- Detect rooted (Android) or jailbroken (iOS) devices and warn or restrict functionality.
- Detect debugger attachment and tampering in production builds.

```kotlin
// Android - basic root detection
val paths = listOf("/system/app/Superuser.apk", "/sbin/su", "/system/bin/su")
val isRooted = paths.any { File(it).exists() }
```

---

## M8 - Security Misconfiguration

- Set `android:debuggable="false"` and `android:allowBackup="false"` in production manifests.
- Remove all test/debug endpoints and logging before release.
- Restrict exported components: set `android:exported="false"` on activities/services not meant to be public.

---

## M9 - Insecure Data Storage

| Storage | Risk | Recommendation |
|---------|------|---------------|
| SharedPreferences (plain) | World-readable on rooted devices | Use EncryptedSharedPreferences |
| SQLite (plain) | Readable via ADB backup | Use SQLCipher for sensitive DBs |
| External storage | Accessible to other apps | Avoid for sensitive data |
| Logs / crash reports | May contain PII or tokens | Sanitize before logging |
| Clipboard | Accessible to all apps | Clear clipboard after copy of sensitive data |

---

## M10 - Insufficient Cryptography

- Use AES-256-GCM for symmetric encryption. Never ECB mode.
- Use platform APIs (Android Keystore, iOS CryptoKit/SecKey) - do not roll your own crypto.
- Never use MD5 or SHA1 for integrity checks; use SHA-256 minimum.

---

## Audit Checklist

| Check | Expected |
|-------|----------|
| No hardcoded secrets in source or resources | Yes |
| Sensitive data stored in Keychain / Keystore | Yes |
| Certificate pinning implemented | Yes |
| Cleartext traffic disabled | Yes |
| ProGuard / code obfuscation enabled | Yes |
| `debuggable=false` in production build | Yes |
| Jailbreak / root detection present | Yes |
| No PII in logs | Yes |
| Permissions follow least privilege | Yes |

**Tools**

| Tool | Purpose |
|------|---------|
| MobSF (Mobile Security Framework) | Static and dynamic analysis |
| Frida | Dynamic instrumentation / runtime analysis |
| apktool | APK decompilation |
| objection | Runtime mobile exploration (no jailbreak needed) |
| Drozer | Android attack surface analysis |

