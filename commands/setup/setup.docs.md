---
name: setup.docs
description: Generate minimal shared docs for implementation alignment.
---

Read:

- `.vibe/state.md`
- `.vibe/context/bridge.md` (if exists)

Update/create only:

- `ARCHITECTURE.md`
- `CONVENTIONS.md`
- `AGENTS.md`

Keep docs concise, no long narratives.

Mandatory AGENTS rule:

- after implementation chunks, run `/setup.changelogs` to keep `CHANGE_LOGS.md` current

Write:

```markdown
## [DOCS] status: ✅ done
```
