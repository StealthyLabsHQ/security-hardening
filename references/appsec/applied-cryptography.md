---
title: "Applied Cryptography for Developers"
slug: applied-cryptography
category: appsec
depth: 3
audit_level: [2, 3]
last_reviewed: 2026-04-19
sources:
  - "OWASP Cryptographic Storage Cheat Sheet"
  - "OWASP Password Storage Cheat Sheet"
  - "NIST SP 800-57"
  - "Tippe and Berner - Argon2 Adoption and Effectiveness in Real-World Software"
triggers_strong: ["argon2id", "aes-gcm", "cryptography", "jwt signing key"]
triggers_weak: ["crypto review", "key management"]
related: ["webauthn-fido2", "secret-leak-prevention"]
---

# Applied Cryptography for Developers

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 2-3 | Automation: Partial (Semgrep/Bandit detect deprecated algorithms; key length and mode checks manual)

Practical algorithm selection and code examples for developers. Cryptography mistakes are among the most common vulnerabilities (CWE-326, CWE-327, CWE-916, CWE-338).

---

## 1. Password Hashing - the Most Common Mistake (CWE-916)

Passwords must be hashed with a **slow, memory-hard** algorithm. The goal is to make brute-force expensive.

**Never use for passwords:** MD5, SHA-1, SHA-256, SHA-512 - even with a salt. These algorithms are designed to be fast, which is the problem. An attacker with a GPU can test billions of SHA-256 hashes per second.

**Use instead:**

| Algorithm | Recommendation | Notes |
|-----------|---------------|-------|
| **Argon2id** | First choice (2024+) | Winner of Password Hashing Competition. Resists GPU and side-channel attacks. |
| **bcrypt** | Acceptable for legacy compatibility | Max 72-byte input, add pepper for defense in depth |
| **scrypt** | Acceptable | Memory-hard, less common |

**Recommended Argon2id parameters (OWASP 2024):** memory=64MB, iterations=3, parallelism=4, hash length=32

```python
# Python - argon2-cffi (pip install argon2-cffi)
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher(
    time_cost=3,        # iterations
    memory_cost=65536,  # 64 MB in KiB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

# Hash on registration
hashed = ph.hash("user_password")

# Verify on login
try:
    ph.verify(hashed, "user_password")
    # Re-hash if parameters changed (transparently upgrades old hashes)
    if ph.check_needs_rehash(hashed):
        hashed = ph.hash("user_password")
except VerifyMismatchError:
    raise ValueError("Invalid password")

# bcrypt - legacy compatibility (pip install bcrypt)
import bcrypt

hashed_bcrypt = bcrypt.hashpw(b"user_password", bcrypt.gensalt(rounds=12))
valid = bcrypt.checkpw(b"user_password", hashed_bcrypt)
```

```javascript
// Node.js - argon2 npm package (npm install argon2)
const argon2 = require('argon2');

// Hash on registration
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,   // 64 MB
  timeCost: 3,
  parallelism: 4,
});

// Verify on login
const valid = await argon2.verify(hash, password);

// bcrypt - legacy compatibility (npm install bcrypt)
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

const bcryptHash = await bcrypt.hash(password, SALT_ROUNDS);
const bcryptValid = await bcrypt.compare(password, bcryptHash);
```

```go
// Go - golang.org/x/crypto/argon2
import (
    "golang.org/x/crypto/argon2"
    "crypto/rand"
    "encoding/base64"
    "fmt"
)

func hashPassword(password string) (string, error) {
    salt := make([]byte, 16)
    if _, err := rand.Read(salt); err != nil {
        return "", err
    }
    // time=3, memory=64MB, threads=4, keyLen=32
    hash := argon2.IDKey([]byte(password), salt, 3, 64*1024, 4, 32)
    // Store as "$argon2id$salt$hash" for later parsing
    encoded := fmt.Sprintf("$argon2id$%s$%s",
        base64.RawStdEncoding.EncodeToString(salt),
        base64.RawStdEncoding.EncodeToString(hash),
    )
    return encoded, nil
}
```

**Migration from bcrypt to Argon2id:** On login, verify the stored bcrypt hash first. If valid, immediately re-hash the plaintext password with Argon2id and overwrite the stored hash. No forced password reset needed - the migration happens transparently over time as users log in.

---

## 2. Symmetric Encryption - Choosing the Right Mode

**The core rule:** Always use **authenticated encryption** (AEAD) - it provides confidentiality AND integrity in one operation.

**Why AES-CBC is dangerous without MAC:**
- Padding oracle attacks (POODLE, BEAST) recover plaintext without the key
- Bit-flip attacks allow an attacker to modify ciphertext and produce predictable plaintext changes
- AES-CBC alone provides no integrity guarantee - you cannot detect tampering

**Use instead:**

| Algorithm | Recommendation | Notes |
|-----------|---------------|-------|
| **AES-256-GCM** | First choice | Hardware-accelerated on modern CPUs (AES-NI) |
| **ChaCha20-Poly1305** | Preferred for mobile/embedded | No AES-NI required, constant-time, preferred for TLS on mobile |
| **AES-CBC + HMAC-SHA256** | Legacy only | Encrypt-then-MAC only; complex to implement correctly |

**Critical rules for AES-256-GCM:**
- Never reuse a (key, nonce) pair - use a random 96-bit nonce per encryption
- Store the nonce alongside the ciphertext (nonce is not secret)
- Verify the authentication tag before using decrypted data

```python
# Python - cryptography library
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

def encrypt(key: bytes, plaintext: bytes, associated_data: bytes = b"") -> bytes:
    # key must be 32 bytes (AES-256)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit random nonce
    ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)
    return nonce + ciphertext  # prepend nonce for storage

def decrypt(key: bytes, data: bytes, associated_data: bytes = b"") -> bytes:
    aesgcm = AESGCM(key)
    nonce, ciphertext = data[:12], data[12:]
    return aesgcm.decrypt(nonce, ciphertext, associated_data)
    # raises InvalidTag if tampered - never ignore this exception
```

```javascript
// Node.js - built-in crypto
const crypto = require('crypto');

function encrypt(key, plaintext) {
    const nonce = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([nonce, authTag, encrypted]); // store all three
}

function decrypt(key, data) {
    const nonce = data.slice(0, 12);
    const authTag = data.slice(12, 28);
    const ciphertext = data.slice(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    // throws if tag verification fails - never suppress this error
}
```

```go
// Go - crypto/aes + crypto/cipher
import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
)

func encrypt(key, plaintext []byte) ([]byte, error) {
    block, err := aes.NewCipher(key) // key must be 32 bytes
    if err != nil { return nil, err }
    gcm, err := cipher.NewGCM(block)
    if err != nil { return nil, err }
    nonce := make([]byte, gcm.NonceSize())
    if _, err = rand.Read(nonce); err != nil { return nil, err }
    return gcm.Seal(nonce, nonce, plaintext, nil), nil // nonce prepended
}

func decrypt(key, data []byte) ([]byte, error) {
    block, _ := aes.NewCipher(key)
    gcm, _ := cipher.NewGCM(block)
    nonce, ciphertext := data[:gcm.NonceSize()], data[gcm.NonceSize():]
    return gcm.Open(nil, nonce, ciphertext, nil) // returns error if tag invalid
}
```

---

## 3. Asymmetric Cryptography and TLS

**Algorithm selection:**

| Use case | Recommended | Acceptable | Never use |
|----------|-------------|------------|-----------|
| TLS certificates | ECDSA P-256 or Ed25519 | RSA-2048 | RSA-1024, DSA |
| Code signing | Ed25519 | ECDSA P-256, RSA-4096 | RSA-1024, DSA, ECDSA with SHA-1 |
| SSH keys | Ed25519 | ECDSA P-256 | RSA-1024, DSA |
| Key exchange (TLS) | X25519 (ECDHE) | P-256 ECDHE | RSA key exchange (no PFS) |

**TLS configuration:**
- Require TLS 1.2 minimum, prefer TLS 1.3
- Disable: TLS 1.0, TLS 1.1, SSLv3
- Cipher suites: AEAD only (drop all CBC cipher suites for TLS 1.2)
- Enable HSTS with `max-age` of at least 1 year

**Certificate pinning - tradeoffs:**

| Approach | Pro | Con |
|----------|-----|-----|
| Pin leaf certificate | Strongest binding | Breaks on every cert renewal |
| Pin intermediate CA | Survives cert rotation | Breaks if CA changes |
| Pin public key (SPKI) | Survives cert renewal if same key | Operational risk if key is compromised |
| No pinning + HSTS | Easy to operate | Vulnerable to rogue CA issuance |

Certificate pinning is recommended for high-value mobile apps (banking, authentication). For most web services, HSTS + CAA DNS records + Certificate Transparency monitoring (crt.sh) provide equivalent protection with much lower operational risk. If you pin, always include a backup pin and a recovery mechanism.

**Nginx TLS hardening:**

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
ssl_prefer_server_ciphers off;  # let client choose for TLS 1.3
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;        # disable for perfect forward secrecy
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
```

---

## 4. Cryptographically Secure Random Number Generation (CSPRNG)

**The critical rule:** Never use general-purpose PRNGs for anything security-sensitive.

**Why `Math.random()` and `random.random()` are broken for security:**
- They are deterministic pseudo-random generators, not cryptographically secure
- A PRNG seeded with a predictable value (timestamp, PID) can be predicted by an attacker
- Session tokens or API keys generated with PRNG can be guessed

**Correct APIs:**

| Language | Correct API | Wrong API |
|----------|------------|-----------|
| Python | `secrets.token_bytes(32)`, `secrets.token_urlsafe(32)`, `secrets.token_hex(32)` | `random.random()`, `random.randint()` |
| Node.js | `crypto.randomBytes(32)`, `crypto.randomUUID()` | `Math.random()` |
| Go | `crypto/rand.Read()` | `math/rand` |
| Java | `SecureRandom` | `java.util.Random` |
| PHP | `random_bytes()`, `random_int()` | `rand()`, `mt_rand()` |

```python
import secrets

# Session token (URL-safe base64, 32 bytes entropy)
session_token = secrets.token_urlsafe(32)

# API key (hex)
api_key = secrets.token_hex(32)

# Password reset token
reset_token = secrets.token_urlsafe(32)

# Timing-safe comparison (prevents timing attacks on token comparison)
if secrets.compare_digest(stored_token, provided_token):
    ...
```

```javascript
const crypto = require('crypto');

// Session token (32 bytes = 256-bit entropy)
const sessionToken = crypto.randomBytes(32).toString('base64url');

// API key
const apiKey = crypto.randomBytes(32).toString('hex');

// UUID v4 (uses CSPRNG internally)
const uuid = crypto.randomUUID();

// Timing-safe comparison
const timingSafeEqual = crypto.timingSafeEqual(
    Buffer.from(storedToken),
    Buffer.from(providedToken)
);
```

```go
import (
    "crypto/rand"
    "crypto/subtle"
    "encoding/base64"
)

func generateToken(length int) (string, error) {
    b := make([]byte, length)
    if _, err := rand.Read(b); err != nil {
        return "", err
    }
    return base64.URLEncoding.EncodeToString(b), nil
}

// Timing-safe comparison
func secureCompare(a, b []byte) bool {
    return subtle.ConstantTimeCompare(a, b) == 1
}
```

**Use CSPRNG for:** session tokens, CSRF tokens, API keys, password reset tokens, OTP secrets, encryption keys, nonces, salts.

---

## 5. Hashing for Integrity (not passwords)

For integrity checks, HMAC generation, and non-password hashing, use SHA-256 or SHA-3. These are fast by design (good for files, bad for passwords).

**HMAC vs plain hash:**
- Plain hash: `hash(data)` - verifies integrity but anyone who knows the hash algorithm can forge it
- HMAC: `HMAC(key, data)` - verifies both integrity and authenticity (requires the secret key)
- Use HMAC for: webhook signature verification, API request signing, session data integrity
- Use plain hash for: file checksums, deduplication, content-addressed storage

```python
import hmac
import hashlib

# HMAC-SHA256 - webhook signature verification (e.g. GitHub webhooks)
def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    # Timing-safe comparison prevents timing oracle attacks
    return hmac.compare_digest(f"sha256={expected}", signature)

# Compute HMAC for outgoing request signing
def sign_request(body: bytes, secret: bytes) -> str:
    return hmac.new(secret, body, hashlib.sha256).hexdigest()

# File integrity check (SHA-256) - no key needed, content-addressed only
def file_hash(path: str) -> str:
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()
```

```javascript
// Node.js - HMAC-SHA256
const crypto = require('crypto');

// Sign a message
function signMessage(secret, message) {
    return crypto.createHmac('sha256', secret)
        .update(message)
        .digest('hex');
}

// Verify a webhook signature (timing-safe)
function verifyWebhook(payload, signature, secret) {
    const expected = 'sha256=' + crypto.createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    // timingSafeEqual requires same-length buffers
    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signature);
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

// SHA-256 file hash
const fs = require('fs');
function fileHash(path) {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(path);
    hash.update(data);
    return hash.digest('hex');
}
```

```go
// Go - HMAC-SHA256
import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
)

// Sign a message
func signMessage(secret, message []byte) string {
    mac := hmac.New(sha256.New, secret)
    mac.Write(message)
    return hex.EncodeToString(mac.Sum(nil))
}

// Verify a signature (timing-safe via hmac.Equal)
func verifySignature(secret, message []byte, signature string) bool {
    mac := hmac.New(sha256.New, secret)
    mac.Write(message)
    expected := mac.Sum(nil)
    decoded, err := hex.DecodeString(signature)
    if err != nil { return false }
    return hmac.Equal(expected, decoded) // constant-time comparison
}
```

**SHA-1 status:** Deprecated for digital signatures and TLS certificates (since 2017). Still acceptable for git object hashing and non-security checksums. Do not use SHA-1 for any new security-sensitive code.

---

## 6. Algorithm Selection Quick Reference

| Use Case | Recommended | Acceptable (legacy) | Never use |
|----------|-------------|--------------------|-----------| 
| Password storage | Argon2id | bcrypt, scrypt | MD5, SHA-1/256/512 (even salted) |
| Symmetric encryption | AES-256-GCM, ChaCha20-Poly1305 | AES-256-CBC + HMAC | AES-ECB, DES, 3DES, RC4 |
| Authenticated encryption | AES-256-GCM | ChaCha20-Poly1305 | Encryption without MAC |
| File / data integrity | SHA-256, SHA-3-256 | SHA-512 | MD5, SHA-1 (for security) |
| Message authentication | HMAC-SHA256 | HMAC-SHA512 | MD5-based HMAC |
| Asymmetric signatures | Ed25519, ECDSA P-256 | RSA-4096 | RSA-1024, DSA, ECDSA + SHA-1 |
| Key exchange | X25519 (ECDHE), P-256 ECDHE | RSA-2048 (TLS) | RSA key exchange (no PFS) |
| Random token generation | `secrets` / `crypto.randomBytes` | OS `/dev/urandom` directly | `Math.random()`, `random.random()` |
| TLS version | TLS 1.3 | TLS 1.2 (AEAD suites only) | TLS 1.1, TLS 1.0, SSLv3 |

---

## 7. Common Cryptographic Mistakes

| Mistake | CWE | Example | Fix |
|---------|-----|---------|-----|
| AES-ECB mode (patterns visible in ciphertext) | CWE-327 | `AES.new(key, AES.MODE_ECB)` | Use AES-256-GCM |
| Hardcoded encryption key | CWE-321 | `KEY = b"hardcodedkey1234"` | Load from secrets manager or env |
| Reused IV/nonce with AES-GCM | CWE-330 | Fixed nonce or counter reset | `os.urandom(12)` per encryption |
| MD5/SHA-1 for passwords | CWE-916 | `hashlib.md5(password)` | Argon2id |
| Weak PRNG for tokens | CWE-338 | `random.randint(0, 10**16)` | `secrets.token_urlsafe(32)` |
| Non-constant-time comparison | CWE-208 | `if token == stored_token` | `secrets.compare_digest()` |
| CBC without MAC | CWE-354 | AES-CBC only | AES-256-GCM |
| Short key length | CWE-326 | RSA-1024, 3DES-112 | RSA-4096 or Ed25519 |

---

## 8. Checklist

| Check | Expected |
|-------|----------|
| Passwords hashed with Argon2id (or bcrypt as fallback) | Yes |
| No MD5, SHA-1, SHA-256 for password storage | Confirmed |
| Symmetric encryption uses AES-256-GCM or ChaCha20-Poly1305 | Yes |
| Nonces are random and unique per encryption | Yes |
| Authentication tag checked before using decrypted data | Yes |
| Session/API tokens generated with CSPRNG | Yes |
| Token comparisons use timing-safe functions | Yes |
| HMAC used for message authentication (not plain hash) | Yes |
| TLS 1.2 minimum, prefer TLS 1.3 | Yes |
| No CBC cipher suites in TLS 1.2 configuration | Yes |
| No hardcoded encryption keys | Yes |
| Encryption keys managed via secrets manager | Yes |

---

## Resources

- NIST SP 800-57 - Key Management Guidelines
- OWASP Cryptographic Storage Cheat Sheet
- OWASP Password Storage Cheat Sheet
- Password Hashing Competition - Argon2 specification
- Trail of Bits - Cryptographic audit guidelines
- RFC 8439 - ChaCha20 and Poly1305

---

## Academic grounding

### Argon2 choice alone does not save weak deployments

Tippe and Berner (2025, arXiv 2504.17121) found that many real-world Argon2 deployments still undershoot recommended memory and iteration settings. They also showed that even correctly configured Argon2 offers limited protection against predictable, dictionary-grade passwords. The failure mode is not only choosing the wrong algorithm, but choosing the right one with weak parameters and weak user passwords.

Practical additions:

- standardize on Argon2id rather than Argon2i or Argon2d for password storage,
- enforce a minimum baseline of `m=65536`, `t=3`, and `p=4` unless hardware benchmarking justifies a stronger profile,
- review library defaults rather than trusting them, because under-parameterized defaults are a recurring cause of weak deployments,
- pair password hashing guidance with password quality controls such as blocklists, breach screening, and strength estimation.

### Review implication

When a code review says "we use Argon2," do not stop there. Verify variant, memory cost, time cost, parallelism, upgrade path, and how legacy hashes are rehashed over time. Treat password quality enforcement as part of the same control family.

