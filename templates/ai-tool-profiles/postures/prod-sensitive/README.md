# Prod-Sensitive Posture

Use this when:

- the project can touch production infrastructure or finance,
- an incident would have material operational or revenue impact,
- internal admin tools or high-privilege code are in scope.

Key characteristics:

- no autonomous high-impact actions,
- production credentials and data kept out of the workspace,
- strict tool/network/MCP allowlists,
- dual review on infra, auth, workflows, billing, and deletion flows.
