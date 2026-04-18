# Stale Review Queue

These files received frontmatter in Phase 2, but `last_reviewed` remains `null` because the
underlying source set or current-version validation was not strong enough to mark them as
freshly reviewed.

| File | Reason |
|---|---|
| `references/ops/detection-engineering.md` | The file explicitly states it was generated from an inferred threat library because the source threat model was unavailable in that session. |
| `references/appsec/framework-examples.md` | Framework snippets need version-aware revalidation against current upstream framework guidance before they can be marked freshly reviewed. |
| `references/appsec/graphql-security.md` | The document lacks normalized source metadata and needs a dedicated pass against current GraphQL security guidance before review can be asserted. |
| `references/appsec/security-myths.md` | Narrative guidance lacks a normalized source set and explicit review metadata, so freshness is intentionally left unresolved. |

