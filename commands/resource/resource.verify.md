---
name: resource.verify
description: Verify resource bootstrap integrity before coding in Spec-Kit/GSD/BMAD flows.
---

Read:

```bash
cat .vibe/resource/state.md
```

Verify:

- bridge exists: `.vibe/resource/context/bridge.md`
- root changelog exists: `CHANGE_LOGS.md`
- docs exist: `ARCHITECTURE.md`, `CONVENTIONS.md`, `AGENTS.md`
- MCP config for selected runtimes using `reference/resource.verify.tools.md`
- selected workflow artifacts (`.specify`, `.planning`, `_bmad`)
- `[SKILL_FIND] status: done`
- `[BASE] status: done` and base blueprint exists

If all good, set `[VERIFY] status: done`.
