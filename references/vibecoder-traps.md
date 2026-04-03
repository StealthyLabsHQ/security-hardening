# Vibecoder Security Traps

> Last reviewed: 2026-04-03 | Next review: 2026-10-03 | Priority: Essential | Automation: Full (Semgrep, Bandit, Gitleaks cover most patterns)


Common mistakes made by developers who paste code from LLMs, Stack Overflow, or tutorials without reviewing it for security. Each trap includes what the code looks like, why it is dangerous, and the correct fix.

---

## 1. Trusting LLM/Stack Overflow Code Without Review

LLMs generate plausible-looking code that is often subtly insecure. Common patterns to watch for:

- `eval(user_input)` or `exec(request.data)`
- `pickle.loads(data)` for deserializing user-supplied bytes
- `yaml.load(content)` without `Loader=yaml.SafeLoader`
- `subprocess.run(cmd, shell=True)` with user-controlled `cmd`
- `os.system(f"convert {filename}")` with a user-supplied filename

**Fix:** Treat any code involving user input as untrusted regardless of source. Search the codebase for these function calls before merging.

---

## 2. Trusting the Frontend for Roles

```javascript
// Vulnerable - role check on the client
if (user.role === 'admin') {
  showAdminPanel();
  fetch('/api/admin/users');  // server accepts because "frontend already checked"
}
```

The server never checked. An attacker calls `/api/admin/users` directly.

**Fix:** Validate every permission server-side on every request, regardless of what the frontend sends.

```python
# Server-side check on every request
@require_role('admin')
def admin_users():
    ...
```

---

## 3. Hidden Routes Without Access Control

```python
# "Only admins know this URL exists"
@app.route('/internal/reset-all-passwords', methods=['POST'])
def reset_all():
    # no auth check - "it's not linked anywhere"
    ...
```

Security through obscurity is not security. Scanners and brute-force tools will find it.

**Fix:** Every route must enforce authentication and authorization explicitly. There is no safe "unlisted" endpoint.

---

## 4. JWT Without Validating Claims

```javascript
// Vulnerable - decodes without verification
const payload = jwt.decode(token);  // does NOT verify signature

// Also vulnerable - does not check aud/iss/exp
const payload = jwt.verify(token, secret);
// if exp is missing, token never expires
// if iss is not checked, tokens from another service are accepted
```

**Fix:**

```javascript
const payload = jwt.verify(token, secret, {
  algorithms: ['RS256'],
  audience: 'my-api',
  issuer: 'https://auth.myapp.com',
  // exp is checked automatically when present
});
```

---

## 5. CORS Wildcard With Credentials

```javascript
// Vulnerable - allows any origin to make credentialed requests
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Credentials', 'true');
```

Browsers block this combination per spec, but some server-side clients do not enforce it.

**Fix:** Never combine `*` with credentials. Use an explicit origin allowlist.

```javascript
const ALLOWED_ORIGINS = ['https://app.mycompany.com'];
if (ALLOWED_ORIGINS.includes(req.headers.origin)) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
}
```

---

## 6. File Upload Without Validation

```python
# Vulnerable - saves whatever the user uploads, wherever they say
@app.route('/upload', methods=['POST'])
def upload():
    f = request.files['file']
    f.save(f'/uploads/{f.filename}')  # path traversal via filename
    # no MIME check, no extension check, no size limit
```

An attacker can upload a `.php` webshell, use `../../etc/cron.d/backdoor` as the filename, or send a 10GB file.

**Fix:**

```python
import os
from pathlib import Path

ALLOWED_EXTENSIONS = {'.jpg', '.png', '.pdf'}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

@app.route('/upload', methods=['POST'])
def upload():
    f = request.files['file']
    ext = Path(f.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        abort(400, 'File type not allowed')
    content = f.read(MAX_SIZE_BYTES + 1)
    if len(content) > MAX_SIZE_BYTES:
        abort(413, 'File too large')
    # generate a safe random filename - never use user-supplied name
    safe_name = f"{uuid.uuid4().hex}{ext}"
    Path('/uploads').joinpath(safe_name).write_bytes(content)
```

---

## 7. Password Hashed With SHA-256

```python
# Vulnerable - fast hash, rainbow tables crack it in seconds
import hashlib
hashed = hashlib.sha256(password.encode()).hexdigest()
```

SHA-256 is a general-purpose fast hash. A GPU can compute billions per second.

**Fix:** Use a dedicated password hashing function designed to be slow.

```python
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))

# Or with Argon2 (preferred per NIST 800-63B)
from argon2 import PasswordHasher
ph = PasswordHasher()
hashed = ph.hash(password)
```

---

## 8. Logging Sensitive Data

```python
# Vulnerable
logger.info(f"Login attempt: user={email} password={password}")
logger.debug(f"Request headers: {request.headers}")  # contains Authorization
logger.error(f"Payment failed: {request.json()}")    # may contain card data
```

Logs are often stored long-term, forwarded to multiple systems, and accessible to many people.

**Fix:**

```python
logger.info(f"Login attempt: user={email}")  # never log passwords
logger.debug(f"Request from IP: {request.remote_addr}")  # not full headers
logger.error(f"Payment failed for order_id={order_id}")  # reference ID, not payload
```

---

## 9. Disabling TLS Verification

```python
# Vulnerable - "just to get it working quickly"
import requests
response = requests.get(url, verify=False)
```

```javascript
// Vulnerable
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

This removes all protection against MITM attacks. It never stays "temporary".

**Fix:** Fix the certificate issue (self-signed? provide the CA cert). Never disable verification in code.

```python
# Self-signed CA
response = requests.get(url, verify='/path/to/ca-bundle.crt')
```

---

## 10. Running Docker as Root With Full Host Mount

```dockerfile
# Vulnerable - runs as root, entire host filesystem mounted
FROM node:18
# no USER directive = runs as root
```

```yaml
# Vulnerable docker-compose
volumes:
  - /:/host  # full host filesystem accessible inside container
```

A container escape or RCE in the app now owns the host.

**Fix:**

```dockerfile
FROM node:18-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
```

```yaml
volumes:
  - ./data:/app/data  # mount only what is needed, read-only if possible
  - ./config:/app/config:ro
```

---

## 11. Mass Assignment Without Allowlisting

```javascript
// Vulnerable - user controls all fields including role, isAdmin, etc.
const user = await User.create(req.body);
```

```python
# Vulnerable
user = User(**request.json())
```

**Fix:** Explicitly pick the fields you accept.

```javascript
const { name, email, password } = req.body;
const user = await User.create({ name, email, password });
```

---

## 12. Ignoring Rate Limiting on Sensitive Endpoints

Password reset, login, OTP verification, and account creation endpoints without rate limiting are trivially brute-forced.

**Fix:** Apply rate limiting to every sensitive endpoint.

```javascript
// Express + express-rate-limit
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many attempts, try again later'
});
app.post('/login', loginLimiter, loginHandler);
```

---

## Quick Reference - Grep Patterns to Run Before Merging

```bash
# Dangerous function calls
grep -rn "eval(" --include="*.js" --include="*.py" --include="*.php" .
grep -rn "exec(" --include="*.py" .
grep -rn "shell=True" --include="*.py" .
grep -rn "pickle.loads" --include="*.py" .
grep -rn "yaml.load(" --include="*.py" .
grep -rn "verify=False" --include="*.py" .
grep -rn "NODE_TLS_REJECT_UNAUTHORIZED" --include="*.js" --include="*.ts" .
grep -rn "innerHTML" --include="*.js" --include="*.ts" .
grep -rn "dangerouslySetInnerHTML" --include="*.jsx" --include="*.tsx" .

# Secrets patterns (use Gitleaks for full coverage)
grep -rn "password\s*=" --include="*.py" --include="*.js" .
grep -rn "secret\s*=" --include="*.py" --include="*.js" .
grep -rn "api_key\s*=" --include="*.py" --include="*.js" .
```
