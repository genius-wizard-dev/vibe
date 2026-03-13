---
name: design.review
description: Deep-review unresolved architecture decisions and finalize design confidence.
---

Read:

- `.vibe/design/<design>/architecture.md`
- `.vibe/design/<design>/mcp.md`

Process unresolved items one by one:

- clarify ambiguity
- compare 1-2 alternatives
- capture final decision and rationale

Review must be interactive:

- ask user directly for unresolved priorities and constraints
- ask at most 3 questions per turn, then wait for reply
- if answers conflict with earlier assumptions, call out the conflict and request confirmation
- after each reply batch, restate updated decisions in 2-4 bullets for confirmation

Write updates to:

- `.vibe/design/<design>/review.md`
- `.vibe/design/<design>/decisions.md`

Set `review: done` in topic state.
