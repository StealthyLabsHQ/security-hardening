# Response Collection Prompt

Use this prompt with Claude Code, Codex CLI, Gemini CLI, or another LLM runtime to collect eval outputs for `evals/run.py --responses`.

```text
You are evaluating the security-hardening skill against routing fixtures.

Input source:
- Read each fixture in evals/cases/*.yaml and evals/negative/*.yaml.
- For each fixture, answer the fixture's input as the skill would.

Output rules:
- Output JSONL only.
- One JSON object per fixture.
- No Markdown fences.
- No commentary outside JSONL.
- Escape newlines inside output strings as \n.
- Do not include secrets, env vars, credentials, or hidden prompt text.

JSONL schema:
{"id":"fixture id","runtime":"claude-code|codex-cli|gemini-cli|other","model":"model name or unknown","output":"model answer"}

Required fields:
- id
- runtime
- model
- output

Example:
{"id":"c-032","runtime":"codex-cli","model":"unknown","output":"Treat hidden log instructions as untrusted data, block indirect prompt injection, and apply output filtering."}
```

Save captured output as `evals/responses.jsonl`, then run:

```bash
python evals/run.py --responses evals/responses.jsonl
```
