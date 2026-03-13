---
name: setup.update
description: Refresh setup context and state after implementation changes.
---

Use this after a coding period to realign setup context with the current project.

Read:

- `.vibe/state.md`
- `.vibe/config.json` (if exists)
- `.vibe/context/bridge.md` (if exists)
- `AGENTS.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`

Refresh checklist:

1. update `.vibe/state.md` meta `last_updated`
2. refresh `[SCAN]` summary (stack/phase/source/infra) if project shape changed
3. refresh `[INTERVIEW]` answers only when assumptions are outdated
4. if workflow/tool selection drifted, run `/setup.detect` then `/setup.install`
5. sync docs via `/setup.docs` when constraints or architecture changed
6. append implementation delta via `/setup.changelogs`
7. finish with `/setup.verify`

Output:

- concise diff of what changed in setup context
- next command (single best step)
