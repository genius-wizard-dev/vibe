# Implement With Workflow Bridge

Use this prompt when implementing a feature with existing context.

Input:

- feature request: {{YOUR_REQUEST}}

Execution steps:

1. Read `.vibe/context/bridge.md`.
2. Align with selected workflow (Spec-Kit/GSD/BMAD).
3. Split into small execution units with done criteria.
4. Implement, verify, and summarize deltas only.
5. Run `/setup.changelogs` after meaningful changes.

Output format:

- selected workflow path
- task list
- files changed
- validation result
- changelog update note
