---
title: "Framework Security Examples"
slug: framework-examples
category: appsec
depth: 2
audit_level: [1, 2]
last_reviewed: 2026-04-19
sources:
  - "Express security best practices"
  - "NestJS security documentation"
  - "FastAPI security documentation"
  - "Django security documentation"
  - "Laravel security documentation"
  - "Spring Security reference"
  - "Gin framework examples"
triggers_strong: ["express security", "fastapi security", "django security", "framework examples"]
triggers_weak: ["framework hardening", "copy paste security"]
related: ["language-patterns", "frontend-frameworks-security", "api-security", "production-error-handling"]
---

# Framework Security Examples

> Last reviewed: 2026-04-19 | Next review: 2026-10-19 | Priority: Recommended | Audit Level: 1-2 | Automation: Partial (linting, dependency scanning, and baseline middleware checks automatable; object-level authorization, business logic, and environment-specific hardening manual)

Use this file when you want **copy-paste starter patterns** for common frameworks without importing insecure tutorial defaults into production.

The goal is not to memorize framework syntax. The goal is to keep the same defensive rules across stacks:

- validate input before business logic,
- keep privileged fields out of caller-controlled schemas,
- scope queries by tenant or owner,
- harden cookies and headers,
- return safe errors,
- rate-limit abuse paths,
- separate authentication from authorization.

---

## 1. How to use this file safely

Treat these snippets as **secure starting points**, not drop-in proof that your app is secure.

Before copying a snippet into production, answer:

1. Does this route also need **object-level authorization**?
2. Are any request fields able to change role, tenant, status, or ownership?
3. Is the app using **cookies** or **bearer tokens**? The CSRF answer changes.
4. Are error messages and logs safe for production?
5. Are uploads, outbound fetches, and webhooks handled elsewhere?

If a snippet makes the app run but widens trust or skips validation, it is the wrong snippet.

---

## 2. Cross-framework minimum baseline

| Control area | Minimum expectation |
|---|---|
| Transport and headers | HTTPS, HSTS where appropriate, `nosniff`, frame protection, safe referrer policy |
| Request validation | Allowlist schemas, type checks, bounded lengths, no mass assignment |
| Authentication | Verified issuer/audience/expiry or hardened server sessions |
| Authorization | Object-level and function-level checks server-side |
| Abuse controls | Rate limits on login, reset, OTP, search, upload, and export paths |
| Error handling | Generic client errors, detailed internal logs with correlation ID |
| Secrets | No secrets in code, templates, or client-visible config |
| Logging | Stable identifiers only; avoid passwords, tokens, full bodies, and raw exports |

---

## 3. Express / Node.js

### 3.1 Baseline middleware

```javascript
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

app.disable("x-powered-by");
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.post("/auth/login", loginLimiter, loginHandler);
```

### 3.2 Request validation and mass-assignment prevention

```javascript
const { z } = require("zod");

const UserUpdateSchema = z.object({
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/).optional(),
});

app.patch("/api/me", requireAuth, async (req, res) => {
  const parsed = UserUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid request" });
  }

  await users.updateProfile(req.user.id, parsed.data);
  return res.status(204).end();
});
```

Do not pass `req.body` directly into ORM update helpers.

### 3.3 Object-level authorization pattern

```javascript
app.get("/api/invoices/:id", requireAuth, async (req, res) => {
  const invoice = await db.invoice.findFirst({
    where: {
      id: req.params.id,
      ownerId: req.user.sub,
      tenantId: req.user.tenant_id,
    },
  });

  if (!invoice) {
    return res.status(404).json({ error: "not found" });
  }

  res.json(invoice);
});
```

### 3.4 Safe error handler

```javascript
const crypto = require("crypto");

app.use((err, req, res, next) => {
  const errorId = crypto.randomUUID();
  logger.error({ errorId, err }, "unhandled request error");
  res.status(500).json({ error: "internal server error", id: errorId });
});
```

---

## 4. NestJS

### 4.1 App bootstrap hardening

```typescript
import helmet from "helmet";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(3000);
}
```

### 4.2 DTO that avoids privilege drift

```typescript
import { IsEmail, IsOptional, IsString, Length } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @Length(1, 100)
  displayName!: string;

  @IsOptional()
  @IsEmail()
  backupEmail?: string;
}
```

Do not include `role`, `tenantId`, `isAdmin`, or internal workflow status fields in user-controlled DTOs.

### 4.3 Guard plus ownership check

```typescript
@Get(":invoiceId")
async getInvoice(
  @Param("invoiceId") invoiceId: string,
  @Req() req: RequestWithUser,
) {
  const invoice = await this.invoiceRepo.findOne({
    where: {
      id: invoiceId,
      ownerId: req.user.sub,
      tenantId: req.user.tenantId,
    },
  });

  if (!invoice) throw new NotFoundException();
  return invoice;
}
```

`@UseGuards(AuthGuard)` is not enough by itself if the resolver or handler can still fetch another tenant's object.

---

## 5. FastAPI / Python

### 5.1 Security headers middleware

```python
from fastapi import FastAPI, Request

app = FastAPI()

SECURITY_HEADERS = {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'",
}

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    for key, value in SECURITY_HEADERS.items():
        response.headers[key] = value
    return response
```

### 5.2 Pydantic request model

```python
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(gt=0, lt=150)
```

### 5.3 Authenticated and scoped query

```python
@app.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: int, current_user=Depends(get_current_user)):
    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.id == invoice_id,
            Invoice.owner_id == current_user["sub"],
            Invoice.tenant_id == current_user["tenant_id"],
        )
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404)
    return invoice
```

### 5.4 Safe exception handler

```python
import uuid
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    error_id = uuid.uuid4().hex
    logger.exception("Unhandled request error", extra={"error_id": error_id})
    return JSONResponse(status_code=500, content={"error": "internal server error", "id": error_id})
```

---

## 6. Django

### 6.1 `settings.py` production baseline

```python
DEBUG = False
ALLOWED_HOSTS = ["app.example.com"]
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 63072000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
```

### 6.2 Queryset scoping for IDOR prevention

```python
from django.shortcuts import get_object_or_404

class InvoiceDetailView(LoginRequiredMixin, View):
    def get(self, request, invoice_id):
        invoice = get_object_or_404(
            Invoice,
            pk=invoice_id,
            owner=request.user,
            tenant=request.user.tenant,
        )
        return JsonResponse(invoice.to_dict())
```

### 6.3 Form / serializer allowlisting

```python
class ProfileUpdateForm(forms.Form):
    display_name = forms.CharField(max_length=100)
    locale = forms.RegexField(regex=r"^[a-z]{2}-[A-Z]{2}$", required=False)
```

Do not reuse model forms blindly for user self-service flows if the model also contains admin or billing-only fields.

---

## 7. Laravel / PHP

### 7.1 Security headers middleware

```php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-Frame-Options', 'DENY');
    $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->headers->set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    return $response;
}
```

### 7.2 Form request allowlist

```php
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
        ];
    }
}

public function store(StoreUserRequest $request): JsonResponse
{
    User::create($request->validated());
    return response()->json([], 201);
}
```

### 7.3 Policy-based object authorization

```php
public function show(string $id): JsonResponse
{
    $invoice = Invoice::where('id', $id)
        ->where('user_id', auth()->id())
        ->where('tenant_id', auth()->user()->tenant_id)
        ->firstOrFail();

    return response()->json($invoice);
}
```

---

## 8. Spring Boot / Java

### 8.1 HTTP security baseline

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .headers(headers -> headers
            .frameOptions(frame -> frame.deny())
            .contentTypeOptions(Customizer.withDefaults())
            .httpStrictTransportSecurity(hsts -> hsts
                .maxAgeInSeconds(63072000)
                .includeSubDomains(true)
                .preload(true)))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/auth/**").permitAll()
            .anyRequest().authenticated())
        .build();
}
```

### 8.2 Request DTO and method-level authorization

```java
public class UserCreateRequest {
    @NotBlank @Size(min = 1, max = 100)
    private String name;

    @NotBlank @Email
    private String email;
}

@PreAuthorize("hasAuthority('invoice:read')")
@GetMapping("/invoices/{id}")
public InvoiceDto getInvoice(@PathVariable UUID id, Authentication auth) {
    return invoiceService.getForPrincipal(id, auth.getName());
}
```

Keep ownership or tenant scoping inside the service or repository layer too; controller annotations alone are not enough.

---

## 9. Go (Gin)

### 9.1 Security headers middleware

```go
func SecurityHeaders() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
        c.Header("X-Content-Type-Options", "nosniff")
        c.Header("X-Frame-Options", "DENY")
        c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
        c.Next()
    }
}
```

### 9.2 Bound request struct

```go
type UpdateProfileRequest struct {
    DisplayName string `json:"displayName" binding:"required,min=1,max=100"`
    Locale      string `json:"locale" binding:"omitempty,startswith=en"`
}
```

### 9.3 Safe object lookup

```go
func GetInvoice(c *gin.Context) {
    invoiceID := c.Param("id")
    user := c.MustGet("user").(Claims)

    var invoice Invoice
    result := db.Where("id = ? AND owner_id = ? AND tenant_id = ?", invoiceID, user.Subject, user.TenantID).First(&invoice)
    if result.Error != nil {
        c.JSON(404, gin.H{"error": "not found"})
        return
    }

    c.JSON(200, invoice)
}
```

---

## 10. Cross-framework traps to review aggressively

Look harder when a snippet introduces:

- `role`, `isAdmin`, `tenantId`, `status`, or pricing fields in request models,
- disabled CSRF without confirming the auth model,
- raw ORM update helpers using the whole request body,
- auth checks in controllers without repository/service scoping,
- verbose exception dumps in API responses,
- tutorial defaults left enabled in production,
- outbound fetch or file upload examples without destination validation.

If the example solves functionality but not trust boundaries, it is not production-ready.

---

## 11. Fast review checklist

| Check | Expected |
|---|---|
| Request schemas allowlist fields only | Yes |
| Authenticated routes also enforce object-level authorization where needed | Yes |
| Error responses are generic and correlated | Yes |
| Sensitive flows are rate-limited | Yes |
| Cookies and transport settings are hardened | Yes |
| Secrets are loaded from environment or manager, not code | Yes |
| Logging avoids full bodies, tokens, and raw exports | Yes |

---

## 12. Related references

- `api-security.md`
- `language-patterns.md`
- `production-error-handling.md`
- `security-diff-review.md`
