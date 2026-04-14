# graphql-security.md

GraphQL is not "less secure" than REST, but it **shifts** the control points. The real risk is not the presence of a `/graphql` endpoint; it is that a client can choose **the shape, depth, cost, and sometimes the exact properties** of the request. Controls must therefore be designed around four questions:

1. **Who can call what?**  
   AuthN/AuthZ at the object, field, and action level.
2. **How much work does the request trigger?**  
   Depth limit, complexity budget, alias/batching caps, backend fan-out.
3. **What does the API reveal about itself?**  
   Introspection, field suggestions, error messages, global IDs.
4. **How does the API deviate from the classic request/response model?**  
   Multipart upload, persisted queries, WebSocket subscriptions, N+1, telemetry.

---

## Minimum baseline

- Strong AuthN at the transport level.
- AuthZ **at the object level** and **at the property level**.  
  A resolver that "returns the object if the user is logged in" is not sufficient.
- **Depth** and **complexity/cost** limits.
- **Volume** limits: document size, number of aliases, number of operations per batch, response size.
- Introspection **disabled in production** for unprivileged clients.
- Per-operation telemetry: name, depth, cost, alias count, backend calls, latency, errors, principal, tenant.
- Persisted queries **allowlisted** for public surfaces when possible.
- Errors **masked** on the client side, detailed only in internal logs.

---

## 1) Depth limit

Depth limits trees of the form:

```graphql
query {
  me {
    manager {
      manager {
        manager {
          reports {
            manager {
              reports {
                id
              }
            }
          }
        }
      }
    }
  }
}
```

### Recommendation

- Public API: max depth **6 to 8** to start.
- Internal API / BFF: **8 to 12** if telemetry shows real needs.
- Exclude trivial fields from cost, **not** from depth, unless justified.
- Apply the rule before execution.

### What not to do

- Rely solely on an HTTP rate limit counted "per request".
- Allow high depth without a complexity budget.
- Exempt an entire mobile client without per-operation metrics.

---

## 2) Complexity analysis (cost-based)

Depth alone does not catch "flat" but very expensive queries:

```graphql
query SearchEverything {
  users(first: 1000) { edges { node { id email roles teams { id name } } } }
  invoices(first: 1000) { edges { node { id amount customer { id tier } } } }
  projects(first: 1000) { edges { node { id repo ciRuns(first: 100) { id status } } } }
}
```

### Practical model

Define a **cost** per field:

- simple scalar: `1`
- 1->1 relation: `2`
- paginated connection: `base + multiplier * first`
- fields hitting an expensive backend: higher cost
- "admin", "search", "export" fields: higher cost + server cap

Simple example:

```text
total_cost =
  sum(field costs)
  + sum(pagination multipliers)
  + surcharge on backend fan-out fields
```

### Recommendation

- Set a **global budget** per operation, for example `300` or `500`.
- Add a **per-role budget** if some clients are internal.
- Log the computed cost for each operation.
- Reject requests without an operation name in production if you depend on fine-grained metrics.

### What not to do

- Allow `first: 1000` everywhere because "the client needs it".
- Count only GraphQL nodes without looking at real SQL/HTTP fan-out.
- Reserve cost analysis to the gateway without feedback on expensive resolvers.

---

## 3) Persisted queries / APQ

Two mechanisms must be distinguished:

### APQ (Automatic Persisted Queries)

- Primary purpose: **performance**.
- The client sends a **SHA-256 hash**.
- If the server does not know the hash, the client then resends the full query.
- Very useful for reducing request size and improving CDN caching.

### Allowlisted persisted queries

- Primary purpose: **security + stability**.
- Only known, versioned, and manifest-published queries are accepted.
- Much stronger against opportunistic discovery, arbitrary batching, and handcrafted queries.

### Recommendation

- **Public / mobile / consumer web surface**: prefer the **allowlist**.
- **Internal surface**: APQ is possible, but keep depth/complexity/rate limits.
- Do not sell APQ as a security control in itself.

### Anti-pattern

- "We have APQ, so we can leave introspection and batch requests open".
- "We allowlist queries, so we no longer need field-level AuthZ".

---

## 4) Introspection in production

Introspection is not a vulnerability in itself, but it:

- speeds up mapping by an attacker,
- reveals types, relations, admin mutations, and field names,
- increases the effectiveness of fuzzing attacks and BOLA/BOPLA.

### Recommendation

- **Disable in production** for unprivileged clients.
- If you must keep it:
  - restrict to internal admins/devs,
  - log all calls,
  - require an approved client ID or trusted origin.

### Anti-pattern

- Leaving GraphiQL / Playground in production "because debugging is needed".
- Confusing IDE disabling with introspection disabling.

---

## 5) Batching attacks

If your server accepts an array of operations in a single HTTP request, an attacker can:

- bypass a rate limit counted "per request",
- mix small enumeration queries,
- amplify CPU/memory impact.

### Recommendation

- Disable batching if you do not need it.
- Otherwise:
  - cap the number of operations per batch,
  - apply cost **across the entire batch**,
  - count the batch as **N operations** for rate limiting.

---

## 6) Alias-based DoS

Example:

```graphql
query {
  a1: search(q: "x") { id }
  a2: search(q: "x") { id }
  a3: search(q: "x") { id }
  # ...
  a500: search(q: "x") { id }
}
```

A naive rate limit sees "one request". The backend potentially sees **500 executions**.

### Recommendation

- Cap the **number of aliases**.
- Include `alias_count` in the cost.
- Reject documents with too many tokens or repeated fields.

---

## 7) Field suggestions leak

Many servers respond:

> Cannot query field `usrs`. Did you mean `users`?

This is very useful for a developer, and equally useful for an attacker in the mapping phase.

### Recommendation

- Disable suggestions in production if the framework allows it.
- Otherwise, hide the details on the client side via an error presenter / formatter.
- Never return the internal stack or admin type names.

---

## 8) IDOR via node IDs (Relay)

Relay and global IDs do **not** eliminate the IDOR/BOLA risk.  
A global ID is just another identifier. Even if base64-encoded, it often remains:

- predictable,
- replayable,
- or easily collectable from the UI.

### Recommendation

- Control access **in the object resolver**, not only in the parent.
- Verify `tenant_id`, ownership, business relationship, object state.
- Enforce pagination caps on Relay connections.
- Log `node(id:)` calls and server-side decoded IDs.

### Anti-pattern

- "The global ID is not sequential, so it is not IDOR."
- Access control at the list level, but not at the `node(id:)` level.

---

## 9) N+1 abuse

N+1 is not just an accidental performance problem. It is also an abuse surface:

- a client can force enormous fan-out,
- cause SQL/HTTP saturation,
- exploit fields that appear innocent but are very expensive.

### Recommendation

- Use dataloaders / batch resolvers.
- Instrument `resolver_count`, `db.query.count`, `downstream_call_count`.
- Add a specific cost to fields that fan out.
- Set a server-side ceiling on `first`, `last`, `limit`.

---

## 10) Error masking

In production, the client must not receive:

- stack trace,
- table name,
- SQL message,
- upstream details,
- internal type/resolver names.

### Recommendation

- Respond with a generic message.
- Set a stable code in `extensions.code` if needed.
- Keep full detail in correlated logs/traces.

### Anti-pattern

- Reusing `err.Error()` as-is from the ORM or upstream.
- Making client behavior depend on an unstable error message.

---

## 11) File upload via multipart spec

The **best** model for files remains:

1. mutation to request a signed URL,
2. direct upload to storage,
3. confirmation mutation with server-side metadata.

### Why avoid native GraphQL multipart?

- more subtle CSRF/browser surface,
- harder backpressure,
- riskier parsing,
- mixing of API logic and file transport,
- validation and scanning often forgotten.

### If you must accept GraphQL multipart

- limit **size**, **MIME type**, **number of files**,
- antivirus / malware scan,
- rename on the server side,
- forbid client-supplied names/paths,
- isolate storage,
- require appropriate CSRF protection,
- never trust `Content-Type` alone.

---

## 12) Subscription auth (WebSocket upgrade)

Subscriptions break the illusion that "one verified token per HTTP request is sufficient".

### Control points

- Auth at the time of the **WebSocket upgrade** or `connection_init`.
- Authorization context injected into the subscription.
- Revalidation if the token is expired or a refresh is needed.
- Verification **on each event** if the right depends on the object/tenant.
- `CheckOrigin` / strict origin allowlist.
- Quotas for concurrent connections and subscriptions per socket.

### Anti-pattern

- Checking only the presence of a token, not its validity.
- Performing AuthZ at subscription time, then pushing events without re-filtering.
- Accepting any WebSocket origin.

---

## Apollo Server (Node) — examples

### 1. Secure base: introspection off, masked errors, CSRF, depth limit

```ts
import { ApolloServer } from "@apollo/server";
import depthLimit from "graphql-depth-limit";

const server = new ApolloServer({
  schema,
  introspection: false, // prod
  hideSchemaDetailsFromClientErrors: true,
  csrfPrevention: true,
  validationRules: [
    depthLimit(8),
  ],
  formatError(formattedError) {
    // Keep detail in logs; return a stable message to the client.
    return {
      message: "Request rejected",
      extensions: {
        code: formattedError.extensions?.code ?? "GRAPHQL_ERROR",
      },
    };
  },
});
```

### 2. Complexity rule (cost-based)

```ts
import { ApolloServer } from "@apollo/server";
import { createComplexityRule, simpleEstimator, fieldExtensionsEstimator } from "graphql-query-complexity";
import depthLimit from "graphql-depth-limit";

const complexityRule = createComplexityRule({
  maximumComplexity: 400,
  estimators: [
    fieldExtensionsEstimator(),
    simpleEstimator({ defaultComplexity: 1 }),
  ],
  onComplete: (complexity: number) => {
    console.log("graphql_complexity", { complexity });
  },
});

const server = new ApolloServer({
  schema,
  introspection: false,
  hideSchemaDetailsFromClientErrors: true,
  csrfPrevention: true,
  validationRules: [depthLimit(8), complexityRule],
});
```

> Tip: for expensive fields, declare a cost via a schema extension or a server-side registry, then increase the cost for paginated connections.

### 3. Allowlisted persisted queries

```ts
import crypto from "node:crypto";
import express from "express";

const app = express();
app.use(express.json());

const allowlist = new Set([
  // SHA-256 of normalized and published operations
  "7b3f6e4c2f5d6a4f6b1d54b9f3f5a4e9c7f3b1d8a9c4e2f6d1b3c5a7e9f1d2c3",
]);

app.use("/graphql", (req, res, next) => {
  const hash = req.body?.extensions?.persistedQuery?.sha256Hash;
  if (!hash || !allowlist.has(hash)) {
    return res.status(403).json({
      errors: [{ message: "Unknown persisted query" }],
    });
  }
  next();
});
```

### 4. Upload: prefer signed URL; if multipart is required, wrap it tightly

```ts
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { graphqlUploadExpress, GraphQLUpload } from "graphql-upload";

const app = express();
app.use(graphqlUploadExpress({
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 2,
}));

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Upload: GraphQLUpload,
    Mutation: {
      async uploadAvatar(_: unknown, { file }: any, ctx: MyContext) {
        if (!ctx.principal) throw new Error("Unauthorized");

        const upload = await file;
        if (!["image/png", "image/jpeg"].includes(upload.mimetype)) {
          throw new Error("Unsupported media type");
        }

        // Do not use the client-supplied name as the final path.
        const safeObjectKey = `avatars/${ctx.principal.userId}/${crypto.randomUUID()}`;
        // stream -> AV scan -> object storage
        return { ok: true, objectKey: safeObjectKey };
      },
    },
  },
  csrfPrevention: true,
});
```

### 5. Subscription auth via `graphql-ws`

```ts
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

useServer(
  {
    schema,
    onConnect: async (ctx) => {
      const auth = String(ctx.connectionParams?.authorization ?? "");
      if (!auth) throw new Error("Unauthorized");
    },
    context: async (ctx) => {
      const auth = String(ctx.connectionParams?.authorization ?? "");
      const principal = await verifyBearer(auth);
      if (!principal) throw new Error("Unauthorized");
      return { principal };
    },
  },
  wsServer,
);
```

**To add in production**: origin allowlist, per-socket quotas, token revalidation before pushing sensitive events.

---

## Strawberry (Python) — examples

> The examples below primarily show the structure of controls. Adapt the integration (ASGI, FastAPI, Django, etc.) to your stack.

### 1. Disable IDE, introspection, and field suggestions

```python
import strawberry
from strawberry.schema.config import StrawberryConfig
from strawberry.extensions import AddValidationRules
from graphql.validation import NoSchemaIntrospectionCustomRule

@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "ok"

schema = strawberry.Schema(
    query=Query,
    config=StrawberryConfig(
        disable_field_suggestions=True,
        relay_max_results=50,
    ),
    extensions=[
        AddValidationRules([NoSchemaIntrospectionCustomRule]),
        # Add your depth / alias / token cap rules here
    ],
)
```

### 2. FastAPI integration with auth context

```python
from fastapi import FastAPI, Request, WebSocket
from strawberry.fastapi import GraphQLRouter

async def get_context(request: Request | WebSocket):
    auth = request.headers.get("authorization", "")
    principal = await verify_bearer(auth)
    if not principal:
        raise Exception("Unauthorized")
    return {"principal": principal}

graphql_app = GraphQLRouter(
    schema,
    context_getter=get_context,
    graphql_ide=None,                 # no IDE in production
    multipart_uploads_enabled=False,  # keep False by default
)

app = FastAPI()
app.include_router(graphql_app, prefix="/graphql")
```

### 3. Mutation with object / property AuthZ

```python
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def update_user_role(self, info, user_id: strawberry.ID, role: str) -> bool:
        principal = info.context["principal"]
        if not principal.is_admin:
            raise Exception("Forbidden")

        if role not in {"viewer", "editor", "admin"}:
            raise Exception("Invalid role")

        await user_service.update_role(user_id=user_id, role=role, actor_id=principal.user_id)
        return True
```

### 4. Upload: preference for signed URL, otherwise enforce very strict bounds

```python
# Recommended model
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_upload_url(self, info, filename: str, content_type: str) -> str:
        principal = info.context["principal"]
        if not principal:
            raise Exception("Unauthorized")
        if content_type not in {"image/png", "image/jpeg"}:
            raise Exception("Unsupported media type")

        return await object_store.create_signed_upload_url(
            owner_id=principal.user_id,
            content_type=content_type,
            ttl_seconds=300,
        )
```

### 5. Strawberry-specific notes

- `graphql_ide=None` in production.
- `multipart_uploads_enabled=False` by default: keep this choice as long as possible.
- `disable_field_suggestions=True` reduces information leakage of the "Did you mean..." type.
- `relay_max_results` must be tight to prevent overly broad connections.
- Add extensions/rules for:
  - depth,
  - number of aliases,
  - number of tokens,
  - document size.

---

## gqlgen (Go) — examples

### 1. Minimal server without introspection in production + complexity limit

```go
package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/gorilla/websocket"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

type principalKey struct{}

func main() {
	srv := handler.New(executableSchema)

	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})

	srv.Use(extension.FixedComplexityLimit(400))

	if os.Getenv("ENV") != "production" {
		srv.Use(extension.Introspection{})
	}

	srv.SetErrorPresenter(func(ctx context.Context, e error) *gqlerror.Error {
		err := graphql.DefaultErrorPresenter(ctx, e)
		err.Message = "Request rejected"
		return err
	})

	srv.SetRecoverFunc(func(ctx context.Context, err interface{}) error {
		return gqlerror.Errorf("Internal server error")
	})

	http.Handle("/graphql", srv)
	http.ListenAndServe(":8080", nil)
}
```

### 2. Subscription auth at `connection_init` + origin allowlist

```go
srv.AddTransport(transport.Websocket{
	KeepAlivePingInterval: 15 * time.Second,
	Upgrader: websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return r.Header.Get("Origin") == "https://app.example.com"
		},
	},
	InitFunc: func(ctx context.Context, initPayload transport.InitPayload) (context.Context, error) {
		token := initPayload.Authorization()
		if token == "" {
			return nil, errors.New("missing authorization")
		}

		principal, err := verifyBearer(token)
		if err != nil {
			return nil, errors.New("unauthorized")
		}

		return context.WithValue(ctx, principalKey{}, principal), nil
	},
})
```

### 3. Upload via multipart spec: memory and size bounds

```yaml
# gqlgen.yml
uploadMaxSize: 10485760   # 10 MiB
uploadMaxMemory: 1048576  # 1 MiB in memory before spill to disk
```

### 4. Resolver with object access control

```go
func (r *queryResolver) Invoice(ctx context.Context, id string) (*model.Invoice, error) {
	principal, _ := ctx.Value(principalKey{}).(*Principal)
	if principal == nil {
		return nil, errors.New("unauthorized")
	}

	invoice, err := r.invoiceStore.ByID(ctx, id)
	if err != nil {
		return nil, errors.New("not found")
	}

	if invoice.TenantID != principal.TenantID && !principal.IsAdmin {
		return nil, errors.New("forbidden")
	}

	return invoice, nil
}
```

---

## Additional controls to plan at the gateway / edge

- Rate limit by:
  - IP,
  - user,
  - client ID,
  - operation name,
  - cumulative cost.
- Rejection of anonymous or oversized documents.
- Maximum body size.
- Separate quotas for mutations, subscriptions, and expensive queries.
- Logging of:
  - `operation_name`,
  - `principal`,
  - `tenant`,
  - `depth`,
  - `complexity`,
  - `alias_count`,
  - `resolver_count`,
  - `db_query_count`,
  - `persisted_query_hash`,
  - `status_code`,
  - `error_code`.

---

## Hostile review checklist

| Control | What to look for | Red flag |
|---|---|---|
| Depth limit | Rule active in production | only in staging |
| Complexity budget | max cost + logs | no per-operation telemetry |
| Persisted queries | versioned manifest / allowlist | APQ alone sold as security |
| Introspection | disabled or restricted | GraphiQL/Playground exposed in production |
| Alias / batching | explicit caps | free and uncounted batch |
| Object AuthZ | check in each sensitive resolver | control only at the parent |
| Property AuthZ | whitelist/guards on sensitive fields | `roles`, `ssn`, `apiKeys` returned to standard client |
| Error masking | presenter/formatter | `err.Error()` returned as-is |
| Upload | signed URL or strict bounds | multipart without AV, without CSRF, without caps |
| Subscriptions | Auth at handshake + revalidation | token read once then forgotten |
| Relay/node IDs | ownership/tenant verification | trusting base64 opacity |
| N+1 | dataloaders + metrics | unmeasured backend fan-out |

---

## CWE mapping

| Topic | Primary CWE | Notes |
|---|---|---|
| IDOR / BOLA | CWE-639 | Authorization Bypass Through User-Controlled Key |
| BOPLA / field overexposure | CWE-200 / CWE-863 | data exposure + insufficient authz |
| Mass assignment | CWE-915 | uncontrolled dynamic property modification |
| JWT `alg=none` / claims confusion | CWE-345 / CWE-347 | authenticity / signature poorly verified |
| SSRF | CWE-918 | Server-Side Request Forgery |
| Alias DoS / batching / N+1 abuse | CWE-400 | Uncontrolled Resource Consumption |
| Introspection / suggestions / verbose errors | CWE-200 / CWE-209 | information disclosure |
| Poorly bounded multipart upload | CWE-434 | dangerous type upload; complement with CSRF controls |
| Insufficient subscription auth | CWE-306 / CWE-862 | critical function insufficiently authenticated/authorized |

---

## OWASP API Security Top 10 mapping (2023)

| GraphQL risk | OWASP API Top 10 |
|---|---|
| IDOR via `node(id:)`, neighboring REST/GraphQL objects | API1: Broken Object Level Authorization |
| Weak JWT, weak subscription auth | API2: Broken Authentication |
| Sensitive field overfetch, mass assignment | API3: Broken Object Property Level Authorization |
| Depth/complexity/batching/alias/N+1 abuse | API4: Unrestricted Resource Consumption |
| Introspection, field suggestions, GraphiQL in production, detailed errors | API8: Security Misconfiguration |
| SSRF via fetchers / webhooks / URL import | API7: Server-Side Request Forgery |
| Login flows exposed to credential stuffing | API6: Unrestricted Access to Sensitive Business Flows |

---

## Simple design rules

- **AuthN/AuthZ everywhere an object becomes addressable again**.
- **What is expensive must be measured, then bounded**.
- **What helps the developer in production also helps the attacker**.
- **A hash (APQ) is not an allowlist**.
- **Base64 is not an authorization**.
- **A subscription is not a long HTTP request: it is a live channel**.

---

## GDPR relevance

GraphQL touches GDPR primarily through **data minimisation** and **security of processing**. The controls below have a direct Article mapping.

| Control | GDPR Article | Rationale |
|---|---|---|
| Field-level AuthZ (object + property) | Art. 5(1)(c) — Minimisation; Art. 25 — Privacy by default | Users and roles should only receive the personal data fields they legitimately need. A resolver returning `ssn`, `salary`, `mfaSecret`, or `recoveryCodes` to a low-privilege principal violates minimisation by default. |
| Disabled introspection in production | Art. 25 — Privacy by default | Introspection exposes the full data model including field names that hint at personal data categories. Disabling it by default limits unnecessary data disclosure to unauthenticated or low-privilege clients. |
| IDOR / BOLA controls on `node(id:)` and REST-equivalent resolvers | Art. 32 — Security of processing | Unauthorized access to personal data objects via predictable IDs constitutes a personal data breach under Art. 4(12) and may trigger Art. 33 notification. Resolver-level ownership checks are a required technical measure. |
| Error masking | Art. 32 — Security of processing; Art. 5(1)(f) — Confidentiality | Stack traces, table names, and field names in error responses can reveal personal data schema. Error presenters are a confidentiality control. |
| Upload controls (MIME, size, AV scan, server-side rename) | Art. 32 — Security of processing | Malicious uploads can compromise the system storing personal data. Upload hardening reduces the attack surface on data stores. |
| Persisted query allowlist | Art. 25 — Privacy by default | An allowlist enforces that only known, reviewed queries — assessed for necessity and proportionality — can execute. Ad-hoc queries from unknown clients bypass minimisation intent. |
| Complexity / depth / batching limits | Art. 32 — Security of processing | Unconstrained queries can trigger mass extraction of personal data (bulk export via deep traversal or alias amplification). Resource limits are also data exfiltration controls. |

### Practical implication for DPIA

If the GraphQL API exposes personal data (user profiles, health data, financial data, etc.), a DPIA screening should check:

1. Is field-level AuthZ enforced at the resolver level — not only at the parent query?
2. Can any query path return more personal data than the use case requires?
3. Is introspection disabled or restricted to authenticated internal principals?
4. Are IDOR/BOLA controls in place for every globally addressable object carrying personal data?
5. Are logs structured to detect abnormal access patterns (volume, field selection, principal/tenant mismatch)?

These five questions map directly to Art. 35(7)(d) — technical and organisational measures adopted to address identified risks.
