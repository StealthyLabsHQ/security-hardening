---
name: graphql-security
description: Depth/complexity limits, introspection control, field-level authz, persisted queries, IDOR.
tags: [security, graphql, api]
---

## Workflow

1. Audit schema for exposed sensitive types and fields.
2. Check query controls: depth, complexity, rate limits.
3. Verify field-level authorization on resolvers.
4. Review introspection and error handling configuration.
5. Validate subscription and batching security.

## Query Depth & Complexity Limits

Without limits, a single query can trigger exponential resolver calls (DoS).

```graphql
# DoS via nested query (without depth limit)
{ users { friends { friends { friends { friends { id } } } } } }
```

**Controls:**
- Set max query depth (recommended: 5-10 for most schemas).
- Assign complexity cost to each field; reject queries exceeding threshold.
- Disable query batching in production or limit batch size (max 10 operations).
- Implement timeout per query execution (e.g., 5s).
- Return `429` with `Retry-After` on rate limit.

Libraries: `graphql-depth-limit`, `graphql-query-complexity`, `graphql-cost-analysis`.

## Introspection

Introspection exposes the full schema — a roadmap for attackers.

- **Production**: disable introspection entirely, or restrict to internal IPs / admin role.
- **Development**: allow freely.
- Introspection disable is not a substitute for field-level authz — apply both.

```js
// Apollo Server
const server = new ApolloServer({
  introspection: process.env.NODE_ENV !== 'production',
});
```

## Field-Level Authorization

Authorization must be enforced in resolvers, not just at the HTTP layer.

```js
// BAD: assumes top-level auth is enough
const resolvers = {
  User: {
    socialSecurityNumber: (parent) => parent.ssn,  // no auth check!
  }
};

// GOOD: check in resolver
const resolvers = {
  User: {
    socialSecurityNumber: (parent, args, ctx) => {
      if (!ctx.user?.isAdmin) throw new ForbiddenError('Not authorized');
      return parent.ssn;
    },
  }
};
```

- Apply authz middleware or directives (`@auth`, `@hasRole`) per field.
- Sensitive fields (PII, financial, internal): require elevated role.
- Use field-level logging for sensitive resolver access.

## IDOR in GraphQL

- Mutations that take `id` as argument must verify ownership: `WHERE id=? AND owner_id=?`.
- Avoid exposing sequential integer IDs; use opaque/cursor-based IDs.
- `deleteItem(id: "123")` must check the item belongs to the caller before deletion.
- Subscription: validate that the subscriber is authorized to receive the data.

## Persisted Queries

Persisted queries prevent arbitrary query execution in production.

- Maintain a server-side allowlist of approved query hashes.
- Reject queries not in the allowlist in production.
- Use Automatic Persisted Queries (APQ) as a baseline, full allowlisting for highest security.
- CI pipeline: generate and commit query manifest; diff alerts on schema/query changes.

## Error Handling

GraphQL returns errors in-band in JSON responses — easy to leak internals.

- Never expose stack traces, DB errors, or internal field names in production errors.
- Use a custom error formatter; whitelist safe error codes.
- Log full error server-side; return opaque message + correlation ID to client.

```js
formatError: (err) => {
  if (process.env.NODE_ENV === 'production') {
    return { message: 'Internal server error', extensions: { code: 'INTERNAL_ERROR' } };
  }
  return err;
}
```

## Batching & N+1

- Use DataLoader (or equivalent) to batch and cache resolver queries.
- Without DataLoader, a list query can trigger O(n) DB calls — also a DoS vector.
- Limit max operations per batch request.

## Subscription Security

- Authenticate WebSocket connections on upgrade (not just on subscribe).
- Re-validate authorization on each subscription message.
- Rate-limit subscription establishment per user.
- Disconnect clients that exceed message rate limits.
