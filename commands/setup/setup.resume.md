---
name: setup.resume
description: Resume setup flow from `.vibe/state.md` and suggest next command.
---

```bash
cat .vibe/state.md 2>/dev/null || echo "No setup state yet. Run /setup.init"
```

Route:

- no state -> `/setup.init`
- detect pending -> `/setup.detect`
- install pending -> `/setup.install`
- docs pending -> `/setup.docs`
- skills pending -> `/setup.skills`
- verify pending -> `/setup.verify`
- complete -> continue implementation, then run `/setup.update` after major coding cycles
