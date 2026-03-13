# Fast Multi-Agent Orchestrator

Use this prompt when you want end-to-end execution quickly.

Input:

- user request: {{YOUR_REQUEST}}

Execution policy:

1. Build a compact plan with clear outputs and done criteria.
2. Split work into independent units and run them in parallel where safe.
3. Use setup/context files if available (`.vibe/context/bridge.md`, `.vibe/state.md`).
4. Keep responses short, action-first, and avoid redundant explanations.
5. After each unit, update progress and blockers.

Mandatory outputs:

- plan table
- running tasks and owners
- completed artifacts
- next best action
