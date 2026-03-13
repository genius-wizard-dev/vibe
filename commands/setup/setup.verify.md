---
name: setup.verify
description: Verify setup completeness from `.vibe/state.md` and selected tool/workflow choices.
---

Read:

```bash
cat .vibe/state.md
cat .vibe/config.json 2>/dev/null || true
```

Verify:

- state exists: `.vibe/state.md`
- changelog exists: `CHANGE_LOGS.md`
- docs exist: `ARCHITECTURE.md`, `CONVENTIONS.md`, `AGENTS.md`
- selected tool MCP config exists and valid (see `reference/setup.verify.tools.md`)
- selected workflows are ready:
  - pass if `workflow_<name>: ✅` in state
  - else pass if CLI/markers detected

If all pass:

```markdown
## [VERIFY] status: ✅ done
```
