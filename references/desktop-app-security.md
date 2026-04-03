# Desktop Application Security (C#, C++, Electron)

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Recommended | Automation: Partial (compiler flags, Electronegativity; DLL hijacking manual)


---

## C / C++ - Memory Safety

The root cause of most C/C++ vulnerabilities is unsafe memory operations on untrusted input.

**Dangerous patterns**

```c
// Buffer overflow - fixed-size buffer, unbounded copy
char buf[256];
strcpy(buf, userInput);          // no bounds check
gets(input);                     // always vulnerable, removed in C11

// Format string injection
printf(userInput);               // attacker controls format string
sprintf(buf, userInput);

// Integer overflow leading to heap overflow
size_t len = atoi(userInput);
char *data = malloc(len);
memcpy(data, src, len * 4);     // len * 4 can overflow
```

**Safe alternatives**

```c
strncpy(buf, userInput, sizeof(buf) - 1);
buf[sizeof(buf) - 1] = '\0';

snprintf(buf, sizeof(buf), "%s", userInput);  // format string is literal

// Validate size before allocation
if (len > MAX_ALLOWED || len == 0) return ERROR;
```

**Compiler protections (enable all)**

| Flag (GCC/Clang) | Protection |
|------------------|-----------|
| `-fstack-protector-strong` | Stack canaries |
| `-D_FORTIFY_SOURCE=2` | Bounds checking on libc functions |
| `-pie -fPIE` | Position Independent Executable (ASLR support) |
| `-Wl,-z,relro,-z,now` | Read-only relocations (RELRO) |
| `-fsanitize=address` | AddressSanitizer (dev/test builds) |

On Windows: enable `/GS` (stack cookies), `/DYNAMICBASE` (ASLR), `/NXCOMPAT` (DEP).

---

## C# / .NET - Common Pitfalls

**Dangerous patterns**

```csharp
// Command injection
Process.Start("cmd.exe", "/c " + userInput);

// SQL injection
string query = "SELECT * FROM users WHERE id = " + userId;

// Deserialization RCE
BinaryFormatter bf = new BinaryFormatter();
object obj = bf.Deserialize(stream);           // RCE via gadget chains

// XXE
XmlDocument doc = new XmlDocument();           // external entities enabled by default
doc.Load(userInput);
```

**Safe alternatives**

```csharp
// Safe process launch - arguments as separate parameter, never via shell
Process.Start(new ProcessStartInfo {
    FileName = "ping",
    Arguments = validatedHost,
    UseShellExecute = false
});

// Parameterized query
using var cmd = new SqlCommand("SELECT * FROM users WHERE id = @id", conn);
cmd.Parameters.AddWithValue("@id", userId);

// Safe deserialization - use System.Text.Json or Newtonsoft with type restrictions
var obj = JsonSerializer.Deserialize<MyType>(json);

// Safe XML - disable DTD / external entities
var settings = new XmlReaderSettings {
    DtdProcessing = DtdProcessing.Prohibit,
    XmlResolver = null
};
```

---

## DLL Hijacking

Windows applications load DLLs by searching a list of directories in order. If an attacker can place a malicious DLL earlier in the search path, it gets loaded instead.

**Vulnerable pattern**

```c
// Relative path - searches CWD first, then system dirs
LoadLibrary("version.dll");
```

**Safe alternatives**

```c
// Absolute path - no search order ambiguity
LoadLibraryEx("C:\\Windows\\System32\\version.dll",
              NULL, LOAD_LIBRARY_SEARCH_SYSTEM32);
```

**Mitigations**

- Always use absolute paths for `LoadLibrary` / `LoadLibraryEx`.
- Set `LOAD_LIBRARY_SEARCH_SYSTEM32` flag for system DLLs.
- Sign all DLLs and verify signatures before loading (use `CryptVerifyMessage`).
- Apply the **DLL Safe Search Mode** via registry: `HKLM\System\CurrentControlSet\Control\Session Manager\SafeDllSearchMode = 1`.
- Run the application from a directory where users cannot write files.

---

## Electron Security

Electron apps combine a Chromium renderer with a Node.js backend. XSS in a renderer with Node integration enabled = full RCE on the host machine.

**Dangerous configuration**

```javascript
// Never do this for windows loading remote or user-controlled content
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,       // Node.js available in renderer = RCE via XSS
    contextIsolation: false,     // renderer can access main process objects
    webSecurity: false           // disables same-origin policy
  }
})
```

**Secure configuration**

```javascript
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // renderer cannot call require()
    contextIsolation: true,      // isolates preload script from renderer
    sandbox: true,               // renderer runs in OS sandbox
    webSecurity: true,
    allowRunningInsecureContent: false,
    preload: path.join(__dirname, 'preload.js')  // only approved APIs exposed
  }
})

// preload.js - expose only what is needed via contextBridge
const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
  sendMessage: (msg) => ipcRenderer.send('message', msg)
})
```

**Additional Electron hardening**

- Validate all IPC messages in the main process (treat renderer as untrusted).
- Restrict navigation: intercept `will-navigate` and `new-window` events, block unexpected origins.
- Enable Content Security Policy in the renderer.
- Keep Electron and Chromium up to date (patch lag is common and exploitable).
- Disable `remote` module (deprecated and dangerous).

---

## Audit Checklist

| Check | Expected |
|-------|----------|
| Compiler hardening flags enabled (C/C++) | Yes |
| No unsafe string functions (strcpy, gets, sprintf) | Yes |
| No BinaryFormatter / Java ObjectInputStream deserialization | Yes |
| DLLs loaded via absolute paths | Yes |
| All DLLs signed and signature verified | Yes |
| Electron: nodeIntegration disabled | Yes |
| Electron: contextIsolation enabled | Yes |
| Electron: sandbox enabled | Yes |
| IPC inputs validated in main process | Yes |

**Tools**

| Tool | Purpose |
|------|---------|
| Process Monitor (Sysinternals) | Detect DLL search order hijacking |
| PE-sieve | Detect injected code / hollowed processes |
| dotnet-retire | Scan .NET dependencies for CVEs |
| Electronegativity | Static analysis for Electron misconfigurations |
| AddressSanitizer / Valgrind | Memory error detection in C/C++ |
