---
title: "Framework Security Examples"
slug: framework-examples
category: appsec
depth: 2
audit_level: [1, 2]
last_reviewed: null
sources:
  - "Express documentation"
  - "FastAPI documentation"
  - "Django security documentation"
  - "Spring Security reference"
  - "Ruby on Rails Security Guide"
triggers_strong: ["express security", "fastapi security", "django security", "framework examples"]
triggers_weak: ["framework hardening", "copy paste security"]
related: ["language-patterns", "frontend-frameworks-security"]
---

# Framework Security Examples

Ready-to-use, copy-paste security configurations per framework. Each section covers: security headers, authentication middleware, input validation, rate limiting, and error handling.

> Review frequency: **Bi-annual** - framework APIs and best practices evolve frequently.

---

## Express / Node.js

### Security Headers (Helmet)

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],        // add nonce for inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.disable('x-powered-by');
```

### JWT Authentication Middleware

```javascript
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies?.session_token; // HttpOnly cookie, not Authorization header
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
      audience: 'my-api',
      issuer: 'https://auth.myapp.com',
    });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const apiLimiter  = rateLimit({ windowMs: 60 * 1000, max: 100 });

app.post('/auth/login', loginLimiter, loginHandler);
app.use('/api/', apiLimiter);
```

### Input Validation (Zod)

```javascript
const { z } = require('zod');

const UserSchema = z.object({
  name:  z.string().min(1).max(100),
  email: z.string().email(),
  age:   z.number().int().min(1).max(149),
});

app.post('/users', (req, res) => {
  const result = UserSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error.flatten());
  // use result.data - validated and typed
});
```

### Safe Error Handler

```javascript
app.use((err, req, res, next) => {
  const id = crypto.randomUUID();
  console.error(`[${id}]`, err);
  res.status(500).json({ error: 'Internal server error', id });
});
```

---

## NestJS

### Global Security Setup

```typescript
// main.ts
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(rateLimit({ windowMs: 60_000, max: 100 }));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // strips unknown properties (prevents mass assignment)
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
```

```typescript
// DTO with validation
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString() @Length(1, 100) name: string;
  @IsEmail() email: string;
  // role is NOT in the DTO - cannot be set by the user
}
```

---

## FastAPI / Python

### Security Headers Middleware

```python
from fastapi import FastAPI, Request
from fastapi.responses import Response
import time, uuid

app = FastAPI()

SECURITY_HEADERS = {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'",
}

@app.middleware('http')
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    for key, value in SECURITY_HEADERS.items():
        response.headers[key] = value
    return response
```

### JWT Authentication

```python
from fastapi import Depends, HTTPException, Cookie
from jose import JWTError, jwt

def get_current_user(session_token: str = Cookie(default=None)):
    if not session_token:
        raise HTTPException(status_code=401)
    try:
        payload = jwt.decode(
            session_token,
            PUBLIC_KEY,
            algorithms=['RS256'],
            audience='my-api',
            issuer='https://auth.myapp.com',
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401)
```

### Input Validation (Pydantic)

```python
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name:  str = Field(min_length=1, max_length=100)
    email: EmailStr
    age:   int = Field(gt=0, lt=150)
    # role excluded - cannot be set by the caller

@app.post('/users')
def create_user(body: UserCreate, user=Depends(get_current_user)):
    ...
```

### Rate Limiting (slowapi)

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post('/auth/login')
@limiter.limit('10/minute')
async def login(request: Request, credentials: LoginCredentials):
    ...
```

---

## Django

### settings.py Security Baseline

```python
# HTTPS / Transport
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 63072000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Cookies
SESSION_COOKIE_SECURE   = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE      = True
CSRF_COOKIE_HTTPONLY    = True

# Content
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Never expose in production
DEBUG = False
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
ALLOWED_HOSTS = ['app.mycompany.com']
```

### IDOR-Safe QuerySet Pattern

```python
# views.py
from django.shortcuts import get_object_or_404

class InvoiceDetailView(LoginRequiredMixin, View):
    def get(self, request, invoice_id):
        # Always filter by owner - prevents IDOR
        invoice = get_object_or_404(Invoice, pk=invoice_id, owner=request.user)
        return JsonResponse(invoice.to_dict())
```

---

## Laravel / PHP

### Security Headers Middleware

```php
// app/Http/Middleware/SecurityHeaders.php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-Frame-Options', 'DENY');
    $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->headers->set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    $response->headers->remove('X-Powered-By');
    $response->headers->remove('Server');
    return $response;
}
```

### Input Validation (Form Request)

```php
// Never use $request->all() directly
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'  => 'required|string|max:100',
            'email' => 'required|email|max:255',
            // 'role' intentionally absent - cannot be set by user
        ];
    }
}

public function store(StoreUserRequest $request): JsonResponse
{
    // $request->validated() contains only declared fields
    User::create($request->validated());
}
```

### IDOR Prevention

```php
// Scope queries to the authenticated user
$invoice = Invoice::where('id', $id)
    ->where('user_id', auth()->id())  // ownership check
    ->firstOrFail();                  // 404 if not found or not owned
```

---

## Spring Boot / Java

### Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .headers(headers -> headers
                .frameOptions(FrameOptionsConfig::deny)
                .contentTypeOptions(Customizer.withDefaults())
                .httpStrictTransportSecurity(hsts -> hsts
                    .maxAgeInSeconds(63072000)
                    .includeSubDomains(true)
                    .preload(true))
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .csrf(csrf -> csrf.disable())  // stateless JWT API - CSRF not needed
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

### Input Validation (Bean Validation)

```java
public class UserCreateRequest {
    @NotBlank @Size(min = 1, max = 100)
    private String name;

    @NotBlank @Email
    private String email;

    @Min(1) @Max(149)
    private int age;
    // role field absent - cannot be set by caller
}

@PostMapping("/users")
public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateRequest req) {
    // req is validated - only declared fields accepted
}
```

---

## Go (Gin)

### Security Headers Middleware

```go
func SecurityHeaders() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
        c.Header("X-Content-Type-Options", "nosniff")
        c.Header("X-Frame-Options", "DENY")
        c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
        c.Header("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'")
        c.Next()
    }
}

func main() {
    r := gin.New()
    r.Use(SecurityHeaders())
    ...
}
```

### JWT Authentication Middleware

```go
func JWTMiddleware(publicKey *rsa.PublicKey) gin.HandlerFunc {
    return func(c *gin.Context) {
        cookie, err := c.Cookie("session_token")
        if err != nil { c.AbortWithStatus(401); return }

        token, err := jwt.Parse(cookie, func(t *jwt.Token) (interface{}, error) {
            if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
                return nil, fmt.Errorf("unexpected signing method")
            }
            return publicKey, nil
        })
        if err != nil || !token.Valid { c.AbortWithStatus(401); return }

        claims := token.Claims.(jwt.MapClaims)
        if claims["aud"] != "my-api" { c.AbortWithStatus(401); return }
        c.Set("user", claims)
        c.Next()
    }
}
```

### IDOR-Safe DB Query

```go
func GetInvoice(c *gin.Context) {
    invoiceID := c.Param("id")
    userID := c.MustGet("user").(jwt.MapClaims)["sub"].(string)

    var invoice Invoice
    // Always scope by owner_id to prevent IDOR
    result := db.Where("id = ? AND owner_id = ?", invoiceID, userID).First(&invoice)
    if result.Error != nil {
        c.JSON(404, gin.H{"error": "not found"})
        return
    }
    c.JSON(200, invoice)
}
```

