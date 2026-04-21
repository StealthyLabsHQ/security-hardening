---
title: "RAG & Retrieval Security"
slug: rag-retrieval-security
category: ai
depth: 2
audit_level: [2, 3, 4]
last_reviewed: 2026-04-21
sources:
  - "OWASP Top 10 for LLM Applications v2025 — https://genai.owasp.org/llm-top-10 (LLM04 Data/Model Poisoning, LLM08 Vector/Embedding Weaknesses)"
  - "NIST retrieval-augmented generation glossary — https://www.nist.gov/trustworthy-and-responsible-ai"
  - "NIST IR 8579"
  - "Hines et al. — Spotlighting (Delimiting, Datamarking, Encoding) — https://arxiv.org/abs/2403.14720 (2024-03)"
  - "Zou et al. — GCG universal adversarial suffixes — https://arxiv.org/abs/2307.15043 (2023-07)"
  - "Carlini et al. — Extracting Training Data from LLMs — https://www.usenix.org/conference/usenixsecurity21/presentation/carlini-extracting (USENIX 2021)"
triggers_strong: ["rag security", "retrieval security", "vector store", "embedding leakage", "document poisoning"]
triggers_weak: ["retrieval", "knowledge base", "semantic search"]
related: ["llm-agent-security", "hostile-corpus-review", "agent-evals-red-teaming", "privacy-data-minimization"]
---

# RAG & Retrieval Security

> Last reviewed: 2026-04-18 | Next review: 2026-10-18 | Priority: Recommended | Audit Level: 2-4 | Automation: Partial (chunk validation, attribute filtering, and retrieval telemetry automatable; corpus trust decisions, source approval, and retrieval quality adjudication manual)

Use this guide when an AI system relies on a knowledge base, vector store, semantic search, embeddings, or retrieval-augmented generation.

NIST defines RAG as a system where a model is paired with a separate retrieval system or knowledge base that provides contextual information at query time. That architecture improves relevance, but it also creates a second attack surface: the corpus and retrieval layer itself.

---

## 1. Main risk model

Retrieval changes the question from:

- "What can the model do?"

to:

- "What can the model do after being influenced by this corpus, retrieval policy, and permission model?"

OWASP's `LLM08:2025 Vector and Embedding Weaknesses` calls out risks such as unauthorized access, cross-context leakage, embedding inversion, and data poisoning in RAG systems. NIST IR 8579 likewise highlights prompt injection, hallucinations, data exposure, and unauthorized access as practical security challenges in an internal RAG chatbot.

---

## 2. What to protect

| Asset | What can go wrong |
|---|---|
| Source documents | Hidden instructions, stale content, malformed data, embedded secrets |
| Chunking / parsing pipeline | Poisoned or mis-segmented content changes what is retrievable |
| Vector store / embedding store | Cross-tenant leakage, weak access filtering, eventual deletion gaps |
| Retrieval policy | Too many results, wrong scope, missing metadata filters |
| Final answer | Model follows injected content or cites out-of-scope data |

If the retrieval layer is weak, the model can look aligned while still producing unsafe answers.

---

## 3. Main failure modes

### Corpus poisoning

Examples:

- attacker uploads a document containing hidden instructions,
- old documents with insecure guidance stay retrievable after they should have been removed,
- untrusted third-party content is mixed with approved internal guidance.

### Permission failure

Examples:

- one team's embeddings are retrievable by another team,
- support content and internal admin procedures share the same vector store with weak filtering,
- the user query does not carry tenant, role, or data-classification context into retrieval.

### Over-broad retrieval

Examples:

- too many chunks are retrieved,
- low-relevance matches still influence the answer,
- retrieval includes documents from the wrong recency, region, or business unit.

### Deletion and lifecycle drift

Examples:

- removed files remain retrievable briefly because deletion is eventually consistent,
- expired or deprecated content remains in active stores,
- no retention policy exists for vector stores.

### Weak auditability

Examples:

- no record of which chunks were retrieved,
- no record of which metadata filters were applied,
- no stable citation path from answer back to corpus.

---

## 4. Minimum control set

### Treat the corpus as untrusted until classified

- Separate trusted internal guidance from user-submitted or scraped content.
- Validate and normalize documents before indexing.
- Strip hidden markup and scan for instruction-like payloads before chunking.
- Do not let unreviewed documents become high-trust retrieval sources.

Pair this with `hostile-corpus-review.md` for intake.

### Enforce permission-aware retrieval

- Carry tenant, role, region, data class, and other authorization attributes into retrieval.
- Partition vector stores when the blast radius of cross-context leakage is high.
- Use metadata or attribute filtering where supported.

OpenAI's retrieval APIs explicitly support per-file attributes for semantic search filtering. Use that capability to narrow results rather than relying on prompt text alone.

### Keep retrieval narrow

- Limit the number of results.
- Prefer high-quality, scoped stores over one giant mixed corpus.
- Bias toward recent, approved, and role-appropriate sources.
- Require citations or source attribution in the final answer on sensitive workflows.

### Manage lifecycle and deletion

- Define expiration or retention policies for vector stores.
- Re-index after source corrections rather than assuming retrieval will self-heal.
- Remember that deletions may not disappear from search instantly; treat removal as eventually consistent until confirmed.

OpenAI's retrieval guide explicitly notes that removing files from a vector store is eventually consistent, and its vector-store APIs support expiration policies.

### Log retrieval decisions

Record:

- query,
- store or corpus used,
- metadata filters,
- returned chunk identifiers,
- final cited sources,
- operator or system policy version.

Without this, you cannot investigate why a RAG answer was wrong or unsafe.

---

## 5. Corpus trust tiers

| Tier | Examples | Retrieval treatment |
|---|---|---|
| `T0 Approved` | reviewed runbooks, internal standards, signed guidance | can be retrieved directly within scope |
| `T1 Restricted` | internal-but-sensitive docs, customer-specific data, legal exports | retrieve only with explicit permission filters and citation |
| `T2 Untrusted` | uploads, scraped pages, external docs, customer attachments | quarantine or down-rank until reviewed |

Do not mix `T0` and `T2` into the same retrieval path without explicit controls.

---

## 6. Design patterns that hold up

### Pattern: split stores by trust and audience

- one store for approved operational guidance,
- one store per tenant or customer boundary,
- one quarantine store for newly uploaded or external material.

### Pattern: retrieval before generation, validation before action

- retrieve,
- filter by authorization and trust tier,
- generate an answer with citations,
- validate before any downstream tool use or side effect.

### Pattern: short-lived experimental stores

For ad hoc or user-uploaded knowledge bases:

- set expiration,
- keep them out of high-trust production retrieval paths,
- require re-approval if they will become persistent.

---

## 7. Red flags during review

- one vector store shared across unrelated tenants or trust tiers,
- no metadata/attribute filtering,
- no deletion confirmation after file removal,
- retrieved chunks not exposed to logs or reviewers,
- prompt-only tenant scoping with no enforcement in retrieval,
- unbounded top-k retrieval,
- no source attribution in answers on sensitive workflows,
- direct tool execution based on retrieved content.

If you see these patterns, the RAG layer is acting as an ungoverned side channel into the model.

---

## 8. Evaluation ideas

Before release, test at least:

1. A hidden-instruction document that should be blocked or quarantined.
2. A cross-tenant retrieval attempt that should return nothing.
3. A stale/deleted document that should no longer influence answers.
4. A benign near-neighbor document to measure false positives.
5. A retrieval trace review: can you reconstruct exactly why a chunk was used?

Use `agent-evals-red-teaming.md` to turn these into standing regression cases.

---

## 9. Official references

- OWASP - `Top 10 for Large Language Model Applications`: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- OWASP - `LLM08:2025 Vector and Embedding Weaknesses`: https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/
- NIST - `retrieval-augmented generation` glossary entry: https://csrc.nist.gov/glossary/term/retrieval_augmented_generation
- NIST - `IR 8579, Developing the NCCoE Chatbot`: https://csrc.nist.gov/pubs/ir/8579/ipd
- Google - `SAIF Risk Assessment`: https://blog.google/innovation-and-ai/technology/safety-security/google-ai-saif-risk-assessment/
- OpenAI - `Retrieval guide`: https://developers.openai.com/api/docs/guides/retrieval
- OpenAI - `File search guide`: https://developers.openai.com/api/docs/guides/tools-file-search
