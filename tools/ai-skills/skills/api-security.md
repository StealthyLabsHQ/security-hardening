---
name: api-security
description: REST/GraphQL API security: auth, rate limiting, input validation, IDOR, CORS, error masking.
tags: [security, api, rest, graphql]
---

## Workflow

1. Map all endpoints: method, path, auth requirement, input schema, response schema.
2. Audit each category below per endpoint.
3. Flag deviations; propose fixes with minimal surface change.

## Authentication

- Bearer tokens: verify signature algorithm explicitly; reject `alg: none`.
- API keys: transmit in headers only (never URL params — they appear in logs).
- OAuth2: validate `state` param (CSRF); store tokens server-side when possible.
- Mutual TLS: enforce client cert validation for internal service-to-service calls.
- Re-authenticate before sensitive actions (password change, payment).

## Authorization

- Every endpoint must check: is caller authenticated? does caller own the resource?
- IDOR pattern: `GET /users/{id}` must verify `id == current_user.id` or admin role.
- Object-level: query `WHERE id=? AND owner_id=?` — never trust client-supplied owner.
- Function-level: separate admin endpoints; do not hide, actually deny.
- Avoid exposing sequential IDs; prefer UUIDs or opaque tokens.

## Rate Limiting

- Apply per-IP and per-user on: auth endpoints, password reset, OTP, search.
- Exponential backoff on repeated failures; lockout with notification.
- Return `429 Too Many Requests` with `Retry-After` header.
- Rate-limit GraphQL by query cost, not just request count.

## Input Validation

- Schema-validate all request bodies before processing.
- Allowlist fields; strip unexpected keys (no mass assignment).
- Validate types, lengths, ranges, formats (regex for email/phone/etc).
- Reject or encode special characters for the target context (SQL, HTML, shell).
- Limit nested object depth and array sizes.

## CORS

- `Access-Control-Allow-Origin`: specify exact origin(s); never `*` with credentials.
- `Access-Control-Allow-Credentials: true` requires exact origin match.
- `Access-Control-Allow-Methods`/`Headers`: allowlist only.
- Validate `Origin` header server-side on state-changing requests.

## Error Masking

- Return generic errors to clients: `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`.
- Never expose stack traces, SQL errors, internal paths, version strings.
- Log full error server-side with correlation ID; return correlation ID to client.
- Differentiate 401 (not authenticated) from 403 (not authorized).

## Transport

- Enforce HTTPS everywhere; redirect HTTP → HTTPS.
- HSTS header: `max-age=31536000; includeSubDomains; preload`.
- Disable TLS < 1.2; prefer TLS 1.3.
- Validate server certificates on outbound calls.

## Sensitive Data

- Never return passwords, secrets, or full card numbers in responses.
- Mask/truncate PII in logs and error messages.
- Paginate large result sets; never return unbounded lists.

## Common REST Traps

- `PUT /resource` without auth check replaces others' resources (IDOR write).
- Bulk endpoints (`DELETE /items?ids=1,2,3`) must validate ownership of each ID.
- File download endpoints: validate that the file belongs to the caller.
- Redirect endpoints: validate target URL against allowlist (open redirect).
