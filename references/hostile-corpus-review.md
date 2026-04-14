# hostile-corpus-review.md

> **Blocked by missing corpus in this session**
>
> You requested a critical audit of **35 files from `references/`**, in the format:
>
> `file:line -> problem -> proposed fix`
>
> In this session, the repository and the announced uploads are not visible on the execution side. Therefore, producing honest **line-by-line** findings without fabricating evidence is not possible.
>
> This file serves as a **blocking report + hostile review grid** to be filled in once the actual corpus is mounted.

## Expected output format

| Severity | File:line | Problem | Proposed fix |
|---|---|---|---|
| Critical | `references/example.md:L42-L57` | Example of a broken or obsolete control | Replace with the correct configuration / version / pattern |
| High | `references/example.md:L60-L82` | Contradictory or actively dangerous advice in prod | Rewrite with preconditions, limitations, and counter-examples |
| Medium | `references/example.md:L90-L101` | Code that compiles but does not hold up in prod | Add configuration, tests, error handling, telemetry |
| Low | `references/example.md:L110-L118` | Ambiguous terminology or version | Update the reference, clarify version and status |

## Hostile review checklist

### Obsolescence / versions
- EOL or near-EOL framework versions,
- Apollo Server v2/v3 examples still presented as "normal",
- references to abandoned libraries,
- references to algorithms or parameters that are too weak,
- browser/API docs still presenting deprecated features as recommended.

### False sense of security
- bcrypt with cost factor too low,
- JWT without `aud` / `iss` constraints / key rotation,
- "disabling introspection is enough" as a GraphQL security message,
- permissive CSP with `'unsafe-inline'`,
- CORS wildcard + credentials,
- "base64" or opaque IDs treated as an authorization control.

### Contradictions between files
- one document recommends APQ, another allows arbitrary queries,
- one document recommends strict headers incompatible with another frontend example,
- one document requires MFA everywhere, another gives examples of persistent service accounts without rotation,
- one document advocates direct uploads, another shows multipart without CSRF.

### Code that compiles but breaks in prod
- hardcoded secret,
- missing timeout, retries, circuit breaking,
- missing memory / size / pagination limits,
- lack of correlated logging,
- missing input or claims validation,
- missing access control by tenant/object/property.

### Abandoned tools / patterns
- unmaintained libraries,
- examples relying on removed functionality,
- references to legacy headers as primary protection,
- GitHub Actions workflows not pinned by SHA.

## Suggested prioritization

1. **Critical**  
   Exploitable vulnerability or actively dangerous advice.
2. **High**  
   Incomplete or misleading control likely to lead to a vulnerability.
3. **Medium**  
   Correct advice in a lab but insufficient in production.
4. **Low**  
   Documentation debt, terminology, clarity, versioning.

## What needs to be done once the corpus is visible

1. List the 35 files actually present.
2. Extract code snippets and normative recommendations.
3. Verify:
   - versions,
   - dependency maintenance,
   - cross-document consistency,
   - actual production security,
   - state of cited tools.
4. Produce the final table **max 50 issues**, sorted by severity, with `file:line` references.

## Quality rule

No line should be written without local evidence:
- exact snippet,
- line or line range,
- concrete and actionable proposed fix.
