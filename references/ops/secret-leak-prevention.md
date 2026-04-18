---
title: "Secret Leak Prevention"
slug: secret-leak-prevention
category: ops
depth: 2
audit_level: [1, 2]
last_reviewed: 2026-04-03
sources:
  - "GitHub push protection"
  - "Gitleaks"
  - "TruffleHog"
triggers_strong: ["secret leak", "pushed api key", "gitleaks", "git filter repo"]
triggers_weak: ["credential leak", "secret scanning"]
related: ["pre-push-checklist", "incident-playbooks"]
---

# Secret Leak Prevention

> Last reviewed: 2026-04-03 | Next review: 2026-10-03 | Priority: Essential | Automation: Full (Gitleaks, TruffleHog, GitHub push protection)

**The rule that supersedes everything else:**

> A secret that has been pushed must be considered compromised - even if deleted in the next commit, even if the repo is private, even if no one saw it.

Git history is permanent. Forks, clones, CI caches, and GitHub's own infrastructure may have seen the secret before you deleted it. Deletion does not equal revocation.

---

## Types of Secrets to Never Commit

| Category | Examples |
|----------|---------|
| AI / LLM API keys | `sk-...` (OpenAI), `sk-ant-...` (Anthropic), Google AI API keys |
| Cloud credentials | AWS access keys (`AKIA...`), GCP service account JSON, Azure client secrets |
| Payment | Stripe secret keys (`sk_live_...`), PayPal client secrets |
| Source control | GitHub PATs (`ghp_...`, `github_pat_...`), GitLab tokens |
| Messaging / bots | Discord bot tokens, Telegram bot tokens, Slack tokens (`xoxb-...`) |
| Databases | Connection strings with credentials, DB passwords |
| Auth secrets | JWT signing secrets, OAuth client secrets, session keys |
| Certificates & keys | Private keys (`.pem`, `.key`, `id_rsa`), PKCS12 (`.p12`, `.pfx`) |
| Service accounts | Firebase admin SDK JSON, GCP service account JSON |
| Infrastructure | Terraform state with secrets, Kubernetes secrets, SSH keys |
| Webhooks | Webhook signing secrets (Stripe, GitHub, Twilio) |
| Config files | `.env`, `config/local.*`, `secrets.*`, `credentials.json` |

---

## Incident Response: Secret Leaked to Git

Follow these steps in order. Speed matters - automated scanners index public repos within minutes.

### Step 1 - Revoke immediately (do this first, before anything else)

Do not waste time trying to delete the commit first. Revoke the key while it is still potentially being used.

| Secret type | How to revoke |
|-------------|--------------|
| OpenAI key | platform.openai.com > API Keys > Delete |
| Anthropic key | console.anthropic.com > API Keys > Revoke |
| GitHub PAT | Settings > Developer settings > Personal access tokens > Delete |
| AWS access key | IAM > Users > Security credentials > Deactivate + Delete |
| Stripe key | dashboard.stripe.com > Developers > API Keys > Roll key |
| GCP service account | IAM > Service Accounts > Disable + delete key |
| Firebase | Firebase Console > Project Settings > Service accounts > Generate new |
| Slack token | api.slack.com > Your Apps > OAuth > Revoke |
| Database password | Run `ALTER USER` / `SET PASSWORD` immediately, rotate connection strings |

### Step 2 - Check for unauthorized usage

Before cleaning history, check if the secret was already used maliciously:

```bash
# AWS - check CloudTrail for recent API calls with the leaked key
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIA... \
  --start-time $(date -d '24 hours ago' -u +%Y-%m-%dT%H:%M:%SZ)

# GitHub - check audit log for PAT usage (organization admin)
# Settings > Organizations > Audit log > filter by token
```

For other providers: check the usage/activity dashboard. Look for calls from unexpected IPs, regions, or at unusual times.

### Step 3 - Remove from Git history

Deleting a commit does not remove a secret from history. Use one of:

```bash
# Option A: git-filter-repo (recommended - faster and safer than BFG)
pip install git-filter-repo
git filter-repo --path-glob '*.env' --invert-paths
git filter-repo --replace-text <(echo 'sk-abc123==>REMOVED')

# Option B: BFG Repo-Cleaner
java -jar bfg.jar --replace-text secrets.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force --all
```

After force-pushing, contact all collaborators to re-clone. Old clones still have the secret in history.

### Step 4 - Invalidate derived sessions and tokens

If the leaked secret was used to sign tokens (JWT secret, session key):
- Invalidate all existing sessions.
- Rotate the signing key.
- Force re-login for all users.

### Step 5 - Postmortem (short)

Answer these 5 questions in writing:

1. What was leaked, and where?
2. When was it pushed, and when was it detected?
3. Was it used maliciously? (evidence either way)
4. What allowed it to happen? (no pre-commit hook, .gitignore missing, etc.)
5. What control will prevent recurrence?

---

## Prevention: Controls Ordered by Effectiveness

The best control stops the secret before it reaches the remote. Detection after push is always too late for public repos.

### Level 1 - Block locally before commit (best)

```bash
# Install pre-commit + gitleaks hook
pip install pre-commit

# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.4
    hooks:
      - id: gitleaks
```

```bash
pre-commit install   # runs gitleaks on every git commit
pre-commit install --hook-type pre-push  # also blocks git push
```

### Level 2 - Block in CI before merge

```yaml
# Already in .github/workflows/security.yml in this repo
- uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Level 3 - GitHub push protection (native)

Enable in repository settings: **Security > Code security and analysis > Secret scanning > Push protection**.

GitHub will block pushes containing known secret patterns (200+ supported providers) before they reach the remote.

### Level 4 - Periodic history scanning

```bash
# Scan full git history
gitleaks detect --source . --verbose --log-level debug

# TruffleHog - entropy-based detection, good for custom tokens
trufflehog git file://. --only-verified
```

---

## Detection by Secret Type

| Provider | Pattern | Severity | Immediate Action |
|----------|---------|----------|-----------------|
| OpenAI | `sk-[a-zA-Z0-9]{48}` | Critical | Revoke at platform.openai.com |
| Anthropic | `sk-ant-[a-zA-Z0-9\-]{90+}` | Critical | Revoke at console.anthropic.com |
| GitHub PAT (classic) | `ghp_[a-zA-Z0-9]{36}` | Critical | Revoke in GitHub Settings |
| GitHub PAT (fine-grained) | `github_pat_[a-zA-Z0-9_]{82}` | Critical | Revoke in GitHub Settings |
| AWS access key | `AKIA[A-Z0-9]{16}` | Critical | Deactivate in IAM, check CloudTrail |
| AWS secret key | 40-char base64, paired with AKIA key | Critical | Same as above |
| Stripe live secret | `sk_live_[a-zA-Z0-9]{24+}` | Critical | Roll key in Stripe dashboard |
| Stripe test secret | `sk_test_[a-zA-Z0-9]{24+}` | High | Roll key (test data, but same pattern) |
| GCP service account | JSON with `"private_key"` field | Critical | Disable key in IAM console |
| Slack token | `xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}` | Critical | Revoke at api.slack.com |
| Discord bot token | `[MN][a-zA-Z0-9]{23}\.[a-zA-Z0-9-_]{6}\.[a-zA-Z0-9-_]{27}` | High | Regenerate in Discord Dev Portal |
| Telegram bot token | `[0-9]{8,10}:[a-zA-Z0-9_-]{35}` | High | Revoke via @BotFather |
| JWT secret (HS256) | Any hardcoded `secret`, `jwt_secret`, `signing_key` | High | Rotate key, invalidate all tokens |
| Private key (PEM) | `-----BEGIN (RSA\|EC\|OPENSSH) PRIVATE KEY-----` | Critical | Revoke cert/key, reissue |

---

## Frontend Special Case

A common vibecoder mistake is putting server-side secrets in frontend code believing they are "read-only" or "safe for clients".

**The rule:** if a key can make server-side API calls, sign anything, charge money, or read private data - it must never be in frontend code.

| Secret | Frontend-safe? | Why |
|--------|---------------|-----|
| Stripe publishable key (`pk_live_...`) | Yes | Designed for client use, cannot charge |
| Stripe secret key (`sk_live_...`) | Never | Can issue refunds, create charges, read all data |
| Supabase anon key | Conditional | Safe only with proper Row Level Security (RLS) configured |
| Supabase service_role key | Never | Bypasses all RLS - full DB admin |
| OpenAI API key | Never | Pays your bill, no rate limit protection |
| Anthropic API key | Never | Same as above |
| Firebase API key | Conditional | Can be public if Firebase Security Rules are configured |
| Firebase admin SDK JSON | Never | Full admin access to all Firebase services |
| Any OAuth client secret | Never | Allows token exchange without user interaction |

**Safe pattern for calling AI APIs from a frontend:**

```
Browser --> Your backend (validates user, applies rate limiting) --> OpenAI API
                                                                         ^
                                                              API key lives here only
```

Never put the API key in the browser. Your backend is the proxy.

---

## Vibecoder Secret Leak Traps

Most common ways secrets end up in Git:

**1. Committing .env directly**
```bash
# How it happens
git add .        # accidentally adds .env
git commit -m "quick fix"
# .env now in history forever
```

**2. Copy-pasting a working test**
```python
# "I'll clean it up later"
client = openai.OpenAI(api_key="sk-abc123realkey")
```

**3. Secret in README or documentation**
```markdown
## Example usage
curl -H "Authorization: Bearer ghp_myrealtokenhere" https://api.github.com/user
```

**4. Secret in example/config file**
```yaml
# config.example.yml - developer used real values "as an example"
database:
  password: "myrealpassword123"
```

**5. Secret in frontend bundle**
```javascript
const OPENAI_KEY = "sk-abc123"; // compiled into bundle, visible to anyone
```

**6. Backup files committed**
```bash
git add database_backup.sql    # contains real data and connection strings
git add .env.backup
git add config_old.json
```

**7. Screenshot / log with token in commit message or file**
```
# Commit message: "fix - token was: ghp_abc123..."
```

**8. Service account JSON from Cloud console**
```bash
# Downloaded from GCP console and committed directly
git add my-project-firebase-adminsdk-abc123.json
```

---

## Safe .gitignore Template

Add to your `.gitignore`. These patterns prevent accidental staging, but remember: `.gitignore` does not protect against `git add -f`.

```gitignore
# Environment & secrets
.env
.env.*
.env.local
.env.*.local
!.env.example    # keep the example template

# Certificates & keys
*.pem
*.key
*.p12
*.pfx
*.crt
*.cer
id_rsa
id_rsa.*
id_ed25519
id_ed25519.*
*.asc

# Service accounts & credentials
service-account*.json
*-adminsdk-*.json
firebase-adminsdk*.json
credentials.json
google-credentials.json
gcp-credentials.json

# Config with secrets
config/local.*
config/production.*
secrets.*
*.secrets
*.secret

# Database dumps
*.sql
*.dump
*.bak
*.backup

# Archives that may contain secrets
*.zip
*.tar.gz
*.7z

# Terraform
*.tfvars
*.tfstate
*.tfstate.*
.terraform/

# Kubernetes
kubeconfig
*.kubeconfig

# IDE / OS
.DS_Store
Thumbs.db
```

---

## Safe-by-Design Patterns

### Local development

```bash
# .env.example (committed - no real values)
OPENAI_API_KEY=your-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
STRIPE_SECRET_KEY=sk_test_your-key-here

# .env (never committed - real values for local dev)
OPENAI_API_KEY=sk-realvalue...
DATABASE_URL=postgresql://...
```

### Application code

```python
# Never
client = openai.OpenAI(api_key="sk-abc123")

# Always
import os
client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
```

### GitHub Actions

```yaml
# Never hardcode in workflow file
- run: curl -H "Authorization: Bearer sk-abc123" ...

# Use repository secrets
- run: curl -H "Authorization: Bearer ${{ secrets.OPENAI_API_KEY }}" ...
```

### Production: use a secrets manager

| Platform | Tool | Pattern |
|----------|------|---------|
| Any | HashiCorp Vault | `vault kv get secret/myapp/openai` |
| AWS | AWS Secrets Manager | `boto3.client('secretsmanager').get_secret_value(...)` |
| GCP | Secret Manager | `secretmanager.SecretManagerServiceClient()` |
| Azure | Key Vault | `SecretClient(vault_url, credential)` |
| All | SOPS (Mozilla) | Encrypted secrets file committed to Git |
| GitHub | Actions Secrets | `${{ secrets.MY_SECRET }}` |
| Doppler | Doppler CLI | `doppler run -- node server.js` |

