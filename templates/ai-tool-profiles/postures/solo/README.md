# Solo Posture

Use this when:

- one person or a very small team is shipping quickly,
- the repo is not a regulated environment,
- you still want strong defaults against secrets, unsafe commands, and prompt injection.

Key characteristics:

- review-first workflow,
- no autonomous push/deploy/delete,
- production data excluded from prompts and workspace by default,
- manual review on auth, billing, webhooks, deletion, infra.
