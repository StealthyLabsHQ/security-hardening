---
name: vibecoder-traps
description: Common AI-generated code security traps: eval, shell injection, path traversal, mass assignment, hardcoded creds.
tags: [security, ai-generated, traps, vibe-coding]
---

## Overview

AI coding assistants frequently produce code that is functional but insecure. These patterns appear correct, pass basic tests, and often go unreviewed. Each trap below is a recurring AI anti-pattern — detect and fix them on sight.

## Trap 1: eval / exec on User Input

```python
# BAD — AI frequently generates this for "dynamic" behavior
result = eval(user_input)
exec(f"import {module_name}")

# BAD — JS
eval(req.body.expression)
new Function(userCode)()
```

**Fix:** Never eval user input. Use explicit parsers, safe expression evaluators (mathjs, simpleeval with allowlist), or restructure to eliminate the need.

## Trap 2: Shell Injection

```python
# BAD
os.system(f"convert {filename} output.png")
subprocess.run(f"grep {pattern} {filepath}", shell=True)

# BAD — Node.js
exec(`ls ${userDir}`)
```

**Fix:** Use array arguments; never `shell=True`/shell interpolation with user data.

```python
# GOOD
subprocess.run(["convert", filename, "output.png"])
subprocess.run(["grep", "-F", pattern, filepath])
```

## Trap 3: Path Traversal

```python
# BAD — AI generates this constantly for file serving
@app.route("/files/<filename>")
def serve_file(filename):
    return send_file(f"uploads/{filename}")
    # Bypassed with: ../../etc/passwd
```

**Fix:** Resolve and validate path is within intended root.

```python
import os
BASE = os.path.realpath("uploads")

def safe_path(filename):
    target = os.path.realpath(os.path.join(BASE, filename))
    if not target.startswith(BASE + os.sep):
        raise ValueError("Path traversal detected")
    return target
```

## Trap 4: Mass Assignment

```js
// BAD — AI frequently does this for "simplicity"
const user = await User.create(req.body);
await user.update(req.body);

// Allows: { role: "admin", emailVerified: true, ... }
```

**Fix:** Explicitly pick allowed fields.

```js
const { name, email } = req.body;
await User.create({ name, email });
```

## Trap 5: Hardcoded Credentials

```js
// BAD — AI fills in placeholders that become permanent
const client = new DB({ password: "dev_password_123" });
const API_KEY = "sk-abc123...";  // "temporary" key committed forever
```

**Fix:** Always use environment variables. Add pre-commit scanning.

## Trap 6: SQL Injection via String Concat

```python
# BAD — AI generates this when "keeping it simple"
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")
cursor.execute("SELECT * FROM users WHERE id = " + user_id)
```

**Fix:** Parameterized queries, always.

```python
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
```

## Trap 7: Insecure Direct Object Reference (IDOR)

```js
// BAD — AI omits ownership check
app.get('/invoice/:id', async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  res.json(invoice);  // any authenticated user can read any invoice
});
```

**Fix:** Always filter by current user.

```js
const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
if (!invoice) return res.status(404).json({ error: 'Not found' });
```

## Trap 8: Verbose Error Responses

```js
// BAD — AI adds try/catch and sends the error directly
try {
  await db.query(sql);
} catch (err) {
  res.status(500).json({ error: err.message, stack: err.stack });
}
```

**Fix:** Log internally; return generic message externally.

```js
} catch (err) {
  logger.error({ err, correlationId });
  res.status(500).json({ error: 'Internal server error', correlationId });
}
```

## Trap 9: Disabled TLS Verification

```python
# BAD — AI adds this to "fix" SSL errors in dev, then it ships
requests.get(url, verify=False)
```

```js
// BAD
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

**Fix:** Fix the certificate (use a real cert or trust the CA). Never ship `verify=False`.

## Trap 10: Regex DoS (ReDoS)

```js
// BAD — AI generates nested quantifiers without awareness of catastrophic backtracking
const emailRe = /^([a-zA-Z0-9]+\.?)*@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
if (emailRe.test(userInput)) { ... }
```

**Fix:** Use simple, anchored regexes; apply input length limit before regex; use a proven email validation library.

## Review Checklist

When reviewing AI-generated code, always scan for:
- [ ] `eval`, `exec`, `Function(`, `new Function`
- [ ] `shell=True`, backtick template strings in exec calls
- [ ] `f"...{user_input}..."` passed to DB/filesystem/shell
- [ ] `.create(req.body)` / `.update(req.body)` without field filtering
- [ ] Hardcoded strings matching secret patterns
- [ ] `verify=False` / `NODE_TLS_REJECT_UNAUTHORIZED`
- [ ] Missing `WHERE owner_id =` on resource queries
- [ ] Error responses that include `err.message` or `err.stack`
